type EnvironmentVariables = Record<string, unknown>;

const ALLOWED_NODE_ENV_VALUES = ['development', 'production', 'test'] as const;

type NodeEnv = (typeof ALLOWED_NODE_ENV_VALUES)[number];

function readOptionalString(
  config: EnvironmentVariables,
  key: string,
): string | undefined {
  const value = config[key];

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function readRequiredString(
  config: EnvironmentVariables,
  key: string,
  validationErrors: string[],
): string {
  const value = readOptionalString(config, key);

  if (!value) {
    validationErrors.push(`${key} is required`);
    return '';
  }

  return value;
}

function readInteger(
  config: EnvironmentVariables,
  key: string,
  defaultValue: number,
  validationErrors: string[],
): number {
  const rawValue = readOptionalString(config, key);

  if (!rawValue) {
    return defaultValue;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    validationErrors.push(`${key} must be a positive integer`);
    return defaultValue;
  }

  return parsedValue;
}

function readNodeEnv(
  config: EnvironmentVariables,
  validationErrors: string[],
): NodeEnv {
  const rawNodeEnv = readOptionalString(config, 'NODE_ENV') ?? 'development';

  if (!ALLOWED_NODE_ENV_VALUES.includes(rawNodeEnv as NodeEnv)) {
    validationErrors.push(
      `NODE_ENV must be one of: ${ALLOWED_NODE_ENV_VALUES.join(', ')}`,
    );
    return 'development';
  }

  return rawNodeEnv as NodeEnv;
}

export function validateEnvironment(
  config: EnvironmentVariables,
): EnvironmentVariables {
  const validationErrors: string[] = [];
  const nodeEnv = readNodeEnv(config, validationErrors);
  const sslKeyPath = readOptionalString(config, 'SSL_KEY_PATH');
  const sslCertPath = readOptionalString(config, 'SSL_CERT_PATH');

  if ((sslKeyPath && !sslCertPath) || (!sslKeyPath && sslCertPath)) {
    validationErrors.push(
      'SSL_KEY_PATH and SSL_CERT_PATH must be provided together',
    );
  }

  const validatedConfig = {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: readInteger(
      config,
      'PORT',
      nodeEnv === 'production' ? 8085 : 3000,
      validationErrors,
    ),
    MYSQL_DB_HOST: readRequiredString(
      config,
      'MYSQL_DB_HOST',
      validationErrors,
    ),
    MYSQL_DB_PORT: readInteger(config, 'MYSQL_DB_PORT', 3306, validationErrors),
    MYSQL_DB_USER: readRequiredString(
      config,
      'MYSQL_DB_USER',
      validationErrors,
    ),
    MYSQL_DB_PASSWORD: readRequiredString(
      config,
      'MYSQL_DB_PASSWORD',
      validationErrors,
    ),
    MYSQL_DB_NAME:
      readOptionalString(config, 'MYSQL_DB_NAME') ?? 'graphql_demo',
    SSL_KEY_PATH: sslKeyPath,
    SSL_CERT_PATH: sslCertPath,
    SSL_PASSPHRASE: readOptionalString(config, 'SSL_PASSPHRASE'),
  };

  if (validationErrors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n${validationErrors.join('\n')}`,
    );
  }

  return validatedConfig;
}
