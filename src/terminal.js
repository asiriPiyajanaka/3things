import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { safeSubprocessEnv } from './subprocess-env.js';

const cliPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../bin/3things.js');

function posixShellQuote(value) {
  return `'${String(value).replaceAll(/'/g, `'"'"'`)}'`;
}

function powerShellQuote(value) {
  return `'${String(value).replaceAll(/'/g, "''")}'`;
}

export function learningCommand(
  eventFile,
  { platform = process.platform, nodePath = process.execPath, targetCliPath = cliPath } = {}
) {
  const quote = platform === 'win32' ? powerShellQuote : posixShellQuote;
  const prefix = platform === 'win32' ? '& ' : '';
  return `${prefix}${quote(nodePath)} ${quote(targetCliPath)} learn --event ${quote(eventFile)}`;
}

export function macTerminalScript(command) {
  const escaped = command.replaceAll(/\\/g, '\\\\').replaceAll(/"/g, '\\"');
  return `tell application "Terminal"\nactivate\ndo script "${escaped}"\nend tell`;
}

function commandExists(name) {
  const checker = process.platform === 'win32' ? 'where' : 'which';
  return spawnSync(checker, [name], { stdio: 'ignore', env: safeSubprocessEnv() }).status === 0;
}

export function windowsPowerShellPath(baseEnv = process.env) {
  const systemRoot = baseEnv.SystemRoot || baseEnv.SYSTEMROOT || baseEnv.WINDIR || 'C:\\Windows';
  return path.win32.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
}

function spawnDetached(executable, args) {
  const child = spawn(executable, args, { detached: true, stdio: 'ignore', env: safeSubprocessEnv() });
  child.once('error', () => {});
  child.unref();
}

export function openLearningTerminal(eventFile) {
  const command = learningCommand(eventFile);

  if (process.platform === 'darwin') {
    const script = macTerminalScript(command);
    spawnDetached('osascript', ['-e', script]);
    return true;
  }

  if (process.platform === 'win32') {
    spawnDetached(windowsPowerShellPath(), ['-NoProfile', '-NoExit', '-Command', command]);
    return true;
  }

  const candidates = [
    ['x-terminal-emulator', ['-e', 'bash', '-lc', `${command}; exec bash`]],
    ['gnome-terminal', ['--', 'bash', '-lc', `${command}; exec bash`]],
    ['konsole', ['-e', 'bash', '-lc', `${command}; exec bash`]],
    ['xterm', ['-e', 'bash', '-lc', `${command}; exec bash`]]
  ];

  for (const [terminal, args] of candidates) {
    if (!commandExists(terminal)) continue;
    spawnDetached(terminal, args);
    return true;
  }

  return false;
}
