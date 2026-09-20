function getDefaultPort(): number {
  return process.env.NODE_ENV === 'production' ? 8085 : 3000;
}

export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? getDefaultPort()),
    isProduction: process.env.NODE_ENV === 'production',
  },
  database: {
    host: process.env.MYSQL_DB_HOST,
    port: Number(process.env.MYSQL_DB_PORT ?? 3306),
    username: process.env.MYSQL_DB_USER,
    password: process.env.MYSQL_DB_PASSWORD,
    name: process.env.MYSQL_DB_NAME ?? 'graphql_demo',
  },
  ssl: {
    keyPath: process.env.SSL_KEY_PATH,
    certPath: process.env.SSL_CERT_PATH,
    passphrase: process.env.SSL_PASSPHRASE,
  },
});
