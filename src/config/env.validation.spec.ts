import { validateEnvironment } from './env.validation';

const validEnvironment = {
  NODE_ENV: 'test',
  PORT: '3000',
  MYSQL_DB_HOST: 'mysql.example.test',
  MYSQL_DB_PORT: '3306',
  MYSQL_DB_USER: 'test-user',
  MYSQL_DB_NAME: 'testdb',
};

describe('validateEnvironment database credentials', () => {
  it('accepts a directly injected database password', () => {
    const result = validateEnvironment({ ...validEnvironment, MYSQL_DB_PASSWORD: 'test-password' });
    expect(result).toEqual(expect.objectContaining({ MYSQL_DB_PASSWORD: 'test-password' }));
  });

  it('accepts a file-backed database password', () => {
    const result = validateEnvironment({ ...validEnvironment, MYSQL_DB_PASSWORD_FILE: '/run/secrets/mysql_db_password' });
    expect(result).toEqual(expect.objectContaining({
      MYSQL_DB_PASSWORD: '',
      MYSQL_DB_PASSWORD_FILE: '/run/secrets/mysql_db_password',
    }));
  });

  it('rejects configuration when neither password input is supplied', () => {
    expect(() => validateEnvironment(validEnvironment)).toThrow(
      'Either MYSQL_DB_PASSWORD or MYSQL_DB_PASSWORD_FILE is required',
    );
  });

  it('preserves the MySQL TLS CA path', () => {
    const result = validateEnvironment({
      ...validEnvironment,
      MYSQL_DB_PASSWORD: 'test-password',
      MYSQL_SSL_CA_PATH: '/run/mysql-ca/mysql-ca.pem',
    });
    expect(result).toEqual(expect.objectContaining({
      MYSQL_SSL_CA_PATH: '/run/mysql-ca/mysql-ca.pem',
    }));
  });
});
