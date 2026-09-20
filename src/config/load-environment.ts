import dotenv from 'dotenv';

import { getEnvFilePaths } from './env-file-paths';

let isEnvironmentLoaded = false;

export function loadEnvironmentVariables(): void {
  if (isEnvironmentLoaded) {
    return;
  }

  for (const path of getEnvFilePaths()) {
    dotenv.config({ path });
  }

  isEnvironmentLoaded = true;
}
