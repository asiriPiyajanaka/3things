import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
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

export function macCommandContents(command) {
  return `#!/bin/sh\nlauncher_file=$0\nrm -f -- "$launcher_file"\nexec ${command}\n`;
}

function createMacCommandFile(command) {
  const commandFile = path.join(os.tmpdir(), `3things-${process.pid}-${randomUUID()}.command`);
  fs.writeFileSync(commandFile, macCommandContents(command), { mode: 0o700 });
  return commandFile;
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
    const commandFile = createMacCommandFile(command);
    const result = spawnSync('/usr/bin/open', ['-a', 'Terminal', commandFile], {
      stdio: 'ignore',
      env: safeSubprocessEnv()
    });
    if (result.status === 0) return true;
    try { fs.rmSync(commandFile, { force: true }); } catch {}
    return false;
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
