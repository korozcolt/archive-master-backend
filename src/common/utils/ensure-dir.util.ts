// src/common/utils/ensure-dir.util.ts

import * as fs from 'fs';
import * as path from 'path';

export const ensureDirectoryExists = (dirPath: string): void => {
  const dirname = path.dirname(dirPath);
  if (fs.existsSync(dirname)) {
    return;
  }
  ensureDirectoryExists(dirname);
  fs.mkdirSync(dirname);
};
