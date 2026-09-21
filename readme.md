
NODE_ENV=production  -> .env.prod, .env.production, .env
NODE_ENV=test        -> .env.test.local, .env.test, .env
default/development  -> .env.local, .env.development.local, .env.development, .env



For local testing on Windows PowerShell:
Set NODE_ENV=production. 
or
$env:NODE_ENV="production"
npm run start:prod



For Docker on EC2, pass production env vars into the container:
docker run -d \
  --name nest-graphql-mysql \
  -p 8085:8085 \
  --env-file .env.prod \
  nest-graphql-mysql
Or explicitly:
docker run -d \
  --name nest-graphql-mysql \
  -p 8085:8085 \
  -e NODE_ENV=production \
  -e PORT=8085 \
  -e MYSQL_DB_HOST=your-db-host \
  -e MYSQL_DB_PORT=3306 \
  -e MYSQL_DB_USER=your-user \
  -e MYSQL_DB_PASSWORD=your-password \
  -e MYSQL_DB_NAME=graphql_demo \
  nest-graphql-mysql


  -------Seed data---------------
  It uses your same env convention: local reads .env.local, production reads .env.prod
To add seed data into the database - scripts/bulk-insert-from-excel.js
  npm run seed:excel

  npm run seed:excel -- --file ./test-data/graphql-seed.xlsx

>> To clear existing users/posts first:
npm run seed:excel -- --file ./test-data/graphql-seed.xlsx --truncate


