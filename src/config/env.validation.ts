type EnvironmentVariables = Record<string, unknown>;

const ALLOWED_NODE_ENV_VALUES = ['development', 'production', 'test'] as const;
type NodeEnv = (typeof ALLOWED_NODE_ENV_VALUES)[number];

function readOptionalString(config: EnvironmentVariables, key: string): string | undefined {
  const value = config[key];
  if (typeof value !== 'string') return undefined;
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function readRequiredString(config: EnvironmentVariables, key: string, errors: string[]): string {
  const value = readOptionalString(config, key);
  if (!value) {
    errors.push(`${key} is required`);
    return '';
  }
  return value;
}

function readInteger(config: EnvironmentVariables, key: string, defaultValue: number, errors: string[]): number {
  const rawValue = readOptionalString(config, key);
  if (!rawValue) return defaultValue;
  const parsedValue = Number(rawValue);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    errors.push(`${key} must be a positive integer`);
    return defaultValue;
  }
  return parsedValue;
}

function readNodeEnv(config: EnvironmentVariables, errors: string[]): NodeEnv {
  const rawNodeEnv = readOptionalString(config, 'NODE_ENV') ?? 'development';
  if (!ALLOWED_NODE_ENV_VALUES.includes(rawNodeEnv as NodeEnv)) {
    errors.push(`NODE_ENV must be one of: ${ALLOWED_NODE_ENV_VALUES.join(', ')}`);
    return 'development';
  }
  return rawNodeEnv as NodeEnv;
}

export function validateEnvironment(config: EnvironmentVariables): EnvironmentVariables {
  const errors: string[] = [];
  const nodeEnv = readNodeEnv(config, errors);
  const sslKeyPath = readOptionalString(config, 'SSL_KEY_PATH');
  const sslCertPath = readOptionalString(config, 'SSL_CERT_PATH');
  const mysqlDbPassword = readOptionalString(config, 'MYSQL_DB_PASSWORD');
  const mysqlDbPasswordFile = readOptionalString(config, 'MYSQL_DB_PASSWORD_FILE');
  const mysqlSslCaPath = readOptionalString(config, 'MYSQL_SSL_CA_PATH');

  if ((sslKeyPath && !sslCertPath) || (!sslKeyPath && sslCertPath)) {
    errors.push('SSL_KEY_PATH and SSL_CERT_PATH must be provided together');
  }
  if (!mysqlDbPassword && !mysqlDbPasswordFile) {
    errors.push('Either MYSQL_DB_PASSWORD or MYSQL_DB_PASSWORD_FILE is required');
  }

  const validatedConfig = {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: readInteger(config, 'PORT', nodeEnv === 'production' ? 8085 : 3000, errors),
    MYSQL_DB_HOST: readRequiredString(config, 'MYSQL_DB_HOST', errors),
    MYSQL_DB_PORT: readInteger(config, 'MYSQL_DB_PORT', 3306, errors),
    MYSQL_DB_USER: readRequiredString(config, 'MYSQL_DB_USER', errors),
    MYSQL_DB_PASSWORD: mysqlDbPassword ?? '',
    MYSQL_DB_PASSWORD_FILE: mysqlDbPasswordFile,
    MYSQL_DB_NAME: readOptionalString(config, 'MYSQL_DB_NAME') ?? 'graphql_demo',
    MYSQL_SSL_CA_PATH: mysqlSslCaPath,
    SSL_KEY_PATH: sslKeyPath,
    SSL_CERT_PATH: sslCertPath,
    SSL_PASSPHRASE: readOptionalString(config, 'SSL_PASSPHRASE'),
  };

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n${errors.join('\n')}`);
  }
  return validatedConfig;
}
