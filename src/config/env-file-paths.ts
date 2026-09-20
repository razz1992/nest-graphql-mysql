const DEFAULT_NODE_ENV = 'development';

export function getEnvFilePaths(nodeEnv = process.env.NODE_ENV): string[] {
  const normalizedNodeEnv = nodeEnv?.trim() || DEFAULT_NODE_ENV;

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
