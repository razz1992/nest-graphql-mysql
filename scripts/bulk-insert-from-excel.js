const path = require('node:path');

const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const xlsx = require('xlsx');

const DEFAULT_CHUNK_SIZE = 500;

function getEnvFilePaths(nodeEnv = process.env.NODE_ENV) {
  const normalizedNodeEnv = nodeEnv?.trim() || 'development';

  if (normalizedNodeEnv === 'production') {
    return ['.env.prod', '.env.production', '.env'];
  }

  if (normalizedNodeEnv === 'test') {
    return ['.env.test.local', '.env.test', '.env'];
  }

  return [
    '.env.local',
    `.env.${normalizedNodeEnv}.local`,
    `.env.${normalizedNodeEnv}`,
    '.env',
  ];
}

function loadEnvironment() {
  for (const envFilePath of getEnvFilePaths()) {
    dotenv.config({ path: envFilePath, quiet: true });
  }
}

function printUsage() {
  console.log(`
Usage:
  npm run seed:excel -- --file ./test-data/graphql-seed.xlsx

Workbook format:
  Sheet "Users": name, email
  Sheet "Posts": title, content, userEmail
  Or Sheet "Posts": title, content, userId

Options:
  --file <path>       Required. Path to .xlsx file.
  --truncate          Optional. Deletes posts and users before inserting.
  --chunk-size <n>    Optional. Defaults to ${DEFAULT_CHUNK_SIZE}.

Environment:
  NODE_ENV=development uses .env.local by default.
  NODE_ENV=production uses .env.prod by default.
  Docker/EC2 injected env vars still take priority.
`);
}

function getOptionValue(args, name) {
  const index = args.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const filePath = getOptionValue(args, '--file') || args[0];
  const chunkSize = Number(
    getOptionValue(args, '--chunk-size') ?? DEFAULT_CHUNK_SIZE,
  );

  if (!filePath) {
    throw new Error('Missing Excel file path. Use --file ./path/to/file.xlsx');
  }

  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error('--chunk-size must be a positive integer');
  }

  return {
    filePath: path.resolve(filePath),
    shouldTruncate: args.includes('--truncate'),
    chunkSize,
  };
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function getDatabaseConfig() {
  return {
    host: requiredEnv('MYSQL_DB_HOST'),
    port: Number(process.env.MYSQL_DB_PORT ?? 3306),
    user: requiredEnv('MYSQL_DB_USER'),
    password: requiredEnv('MYSQL_DB_PASSWORD'),
    database: process.env.MYSQL_DB_NAME || 'graphql_demo',
    multipleStatements: false,
  };
}

function readSheet(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(`Missing required sheet "${sheetName}"`);
  }

  return xlsx.utils.sheet_to_json(sheet, {
    defval: '',
    raw: false,
  });
}

function requireString(row, fieldName, sheetName, rowIndex) {
  const value = row[fieldName];
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    throw new Error(`${sheetName} row ${rowIndex}: "${fieldName}" is required`);
  }

  return normalizedValue;
}

function normalizeUsers(rows) {
  const seenEmails = new Set();

  return rows.map((row, index) => {
    const rowIndex = index + 2;
    const name = requireString(row, 'name', 'Users', rowIndex);
    const email = requireString(row, 'email', 'Users', rowIndex).toLowerCase();

    if (seenEmails.has(email)) {
      throw new Error(`Users row ${rowIndex}: duplicate email "${email}"`);
    }

    seenEmails.add(email);

    return { name, email };
  });
}

function normalizePosts(rows) {
  return rows.map((row, index) => {
    const rowIndex = index + 2;
    const title = requireString(row, 'title', 'Posts', rowIndex);
    const content = requireString(row, 'content', 'Posts', rowIndex);
    const userEmail = String(row.userEmail ?? '')
      .trim()
      .toLowerCase();
    const rawUserId = String(row.userId ?? '').trim();
    const userId = rawUserId ? Number(rawUserId) : undefined;

    if (rawUserId && (!Number.isInteger(userId) || userId <= 0)) {
      throw new Error(
        `Posts row ${rowIndex}: "userId" must be a positive integer`,
      );
    }

    if (!userEmail && !userId) {
      throw new Error(
        `Posts row ${rowIndex}: provide either "userEmail" or numeric "userId"`,
      );
    }

    return {
      title,
      content,
      userEmail: userEmail || undefined,
      userId,
      rowIndex,
    };
  });
}

function readWorkbook(filePath) {
  const workbook = xlsx.readFile(filePath);

  return {
    users: normalizeUsers(readSheet(workbook, 'Users')),
    posts: normalizePosts(readSheet(workbook, 'Posts')),
  };
}

async function chunked(items, chunkSize, handler) {
  for (let index = 0; index < items.length; index += chunkSize) {
    await handler(items.slice(index, index + chunkSize));
  }
}

async function truncateData(connection) {
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  await connection.query('TRUNCATE TABLE `post`');
  await connection.query('TRUNCATE TABLE `user`');
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function upsertUsers(connection, users, chunkSize) {
  if (users.length === 0) {
    return;
  }

  await chunked(users, chunkSize, async (userChunk) => {
    await connection.query(
      `
        INSERT INTO \`user\` (name, email)
        VALUES ?
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          email = VALUES(email)
      `,
      [userChunk.map((user) => [user.name, user.email])],
    );
  });
}

async function getUserIdByEmail(connection) {
  const [rows] = await connection.query('SELECT id, email FROM `user`');

  return new Map(rows.map((row) => [String(row.email).toLowerCase(), row.id]));
}

async function getExistingUserIds(connection) {
  const [rows] = await connection.query('SELECT id FROM `user`');

  return new Set(rows.map((row) => Number(row.id)));
}

function resolvePosts(posts, userIdByEmail, existingUserIds) {
  return posts.map((post) => {
    if (post.userEmail) {
      const userId = userIdByEmail.get(post.userEmail);

      if (!userId) {
        throw new Error(
          `Posts row ${post.rowIndex}: no user found for userEmail "${post.userEmail}"`,
        );
      }

      return {
        ...post,
        userId,
      };
    }

    if (existingUserIds.has(post.userId)) {
      return post;
    }

    // throw new Error(
    //   `Posts row ${post.rowIndex}: no user exists with userId ${post.userId}. Prefer userEmail in Excel for stable seeding.`,
    // );
  });
}

async function insertPosts(connection, posts, chunkSize) {
  if (posts.length === 0) {
    return;
  }

  await chunked(posts, chunkSize, async (postChunk) => {
    await connection.query(
      'INSERT INTO `post` (title, content, userId) VALUES ?',
      [postChunk.map((post) => [post.title, post.content, post.userId])],
    );
  });
}

async function main() {
  loadEnvironment();

  const { filePath, shouldTruncate, chunkSize } = parseArgs();
  const { users, posts } = readWorkbook(filePath);
  const connection = await mysql.createConnection(getDatabaseConfig());

  try {
    await connection.beginTransaction();

    if (shouldTruncate) {
      await truncateData(connection);
    }

    await upsertUsers(connection, users, chunkSize);

    const userIdByEmail = await getUserIdByEmail(connection);
    const existingUserIds = await getExistingUserIds(connection);
    const resolvedPosts = resolvePosts(posts, userIdByEmail, existingUserIds);

    await insertPosts(connection, resolvedPosts, chunkSize);
    await connection.commit();

    console.log(
      `Inserted seed data successfully: ${users.length} users, ${posts.length} posts.`,
    );
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
