import fs from 'node:fs';
import path from 'node:path';

const FIXED_PATH_DIRS = Object.freeze([
  '/usr/bin',
  '/bin',
  '/usr/sbin',
  '/sbin',
  '/usr/local/bin',
  '/opt/homebrew/bin'
]);

function windowsPath(baseEnv) {
  const systemRoot = baseEnv.SystemRoot || baseEnv.SYSTEMROOT || baseEnv.WINDIR || 'C:\\Windows';
  return [
    path.win32.join(systemRoot, 'System32'),
    path.win32.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0')
  ].join(path.win32.delimiter);
}

function isExistingUnwritableDirectory(dir) {
  try {
    if (!fs.statSync(dir).isDirectory()) return false;
    fs.accessSync(dir, fs.constants.W_OK);
    return false;
  } catch (error) {
    return error?.code === 'EACCES' || error?.code === 'EPERM';
  }
}

export function fixedExecutablePath(baseEnv = process.env, platform = process.platform) {
  if (platform === 'win32') return windowsPath(baseEnv);
  const dirs = FIXED_PATH_DIRS.filter(isExistingUnwritableDirectory);
  const safeDirs = dirs.length ? dirs : ['/usr/bin', '/bin', '/usr/sbin', '/sbin'];
  return safeDirs.join(path.delimiter);
}

export function safeSubprocessEnv(baseEnv = process.env, extra = {}) {
  const merged = { ...baseEnv, ...extra };
  const env = {};
  for (const [key, value] of Object.entries(merged)) {
    if (key.toUpperCase() !== 'PATH') env[key] = value;
  }
  env.PATH = fixedExecutablePath(merged);
  return env;
}

export function codexChildEnv(baseEnv = process.env) {
  const env = safeSubprocessEnv(baseEnv);
  env.THREETHINGS_CHILD = '1';
  return env;
}
