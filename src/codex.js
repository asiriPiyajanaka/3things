import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { codexChildEnv } from './subprocess-env.js';

function tempFile(name) {
  return path.join(os.tmpdir(), `3things-${process.pid}-${Date.now()}-${name}`);
}

export function codexAvailable(executable = resolveCodexExecutable()) {
  if (!executable) return false;
  const result = spawnSync(executable, ['--version'], { encoding: 'utf8', env: codexChildEnv() });
  return result.status === 0;
}

export function resolveCodexExecutable(baseEnv = process.env) {
  const pathValue = baseEnv.PATH || baseEnv.Path || '';
  for (const dir of pathValue.split(path.delimiter).filter(Boolean)) {
    const candidate = path.resolve(dir, process.platform === 'win32' ? 'codex.cmd' : 'codex');
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch {}
  }
  return null;
}

function codexCommand(configuredExecutable = null) {
  return configuredExecutable || resolveCodexExecutable() || 'codex';
}

export function runCodex(prompt, { cwd = process.cwd(), model = null, schema = null, codexExecutable = null } = {}) {
  const outputFile = tempFile('output.txt');
  const args = codexExecArgs({ cwd, model, schema, outputFile });

  const result = spawnSync(codexCommand(codexExecutable), args, {
    input: prompt,
    encoding: 'utf8',
    env: codexChildEnv(),
    maxBuffer: 10 * 1024 * 1024
  });

  const output = readOutputFile(outputFile);

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`Codex learning call failed${detail ? `: ${detail.slice(-800)}` : ''}`);
  }

  return output;
}

function codexExecArgs({ cwd, model, schema, outputFile }) {
  const args = [
    'exec',
    '--ephemeral',
    '--sandbox', 'read-only',
    '--skip-git-repo-check',
    '--output-last-message', outputFile,
    '--cd', cwd
  ];
  if (model) args.push('--model', model);
  if (schema) args.push('--output-schema', schema);
  args.push('-');
  return args;
}

function readOutputFile(outputFile) {
  let output = '';
  if (fs.existsSync(outputFile)) {
    output = fs.readFileSync(outputFile, 'utf8').trim();
    fs.rmSync(outputFile, { force: true });
  }
  return output;
}

export function runCodexAsync(prompt, { cwd = process.cwd(), model = null, schema = null, codexExecutable = null } = {}) {
  const outputFile = tempFile('output.txt');
  const args = codexExecArgs({ cwd, model, schema, outputFile });

  return new Promise((resolve, reject) => {
    const child = spawn(codexCommand(codexExecutable), args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: codexChildEnv()
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (status) => {
      const output = readOutputFile(outputFile);
      if (status !== 0) {
        const detail = (stderr || stdout || '').trim();
        reject(new Error(`Codex learning call failed${detail ? `: ${detail.slice(-800)}` : ''}`));
        return;
      }
      resolve(output);
    });
    child.stdin.end(prompt);
  });
}

export function runCodexJson(prompt, options = {}) {
  const raw = runCodex(prompt, options);
  try {
    return JSON.parse(raw);
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (fenced) return JSON.parse(fenced);
    throw new Error(`Codex returned invalid JSON: ${raw.slice(0, 300)}`);
  }
}

export async function runCodexJsonAsync(prompt, options = {}) {
  const raw = await runCodexAsync(prompt, options);
  try {
    return JSON.parse(raw);
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (fenced) return JSON.parse(fenced);
    throw new Error(`Codex returned invalid JSON: ${raw.slice(0, 300)}`);
  }
}
