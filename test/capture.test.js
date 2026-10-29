import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { safeSubprocessEnv } from '../src/subprocess-env.js';

function isolatedHomeEnv(home) {
  return safeSubprocessEnv(process.env, {
    HOME: home,
    USERPROFILE: home
  });
}

test('capture command saves a generic agent task', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), '3things-capture-'));
  const stateDir = path.join(home, '.3things');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, 'config.json'), JSON.stringify({
    enabled: true,
    trigger: 'manual',
    learningTerminalMode: 'new'
  }));

  const result = spawnSync(process.execPath, [
    'bin/3things.js',
    'capture',
    '--agent', 'custom-agent',
    '--cwd', process.cwd(),
    '--prompt', 'Fix retry handling'
  ], {
    cwd: process.cwd(),
    env: isolatedHomeEnv(home),
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const task = JSON.parse(fs.readFileSync(path.join(stateDir, 'latest-task.json'), 'utf8'));
  assert.equal(task.agent, 'custom-agent');
  assert.equal(task.prompt, 'Fix retry handling');

  fs.rmSync(home, { recursive: true, force: true });
});

test('capture command rejects JSON without a prompt', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), '3things-capture-invalid-'));
  const result = spawnSync(process.execPath, ['bin/3things.js', 'capture'], {
    cwd: process.cwd(),
    env: isolatedHomeEnv(home),
    input: '{"agent":"custom-agent"}',
    encoding: 'utf8'
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /No task prompt provided/);
  assert.equal(fs.existsSync(path.join(home, '.3things', 'latest-task.json')), false);
  fs.rmSync(home, { recursive: true, force: true });
});

test('hook command accepts the current UserPromptSubmit payload', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), '3things-hook-command-'));
  const stateDir = path.join(home, '.3things');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, 'config.json'), JSON.stringify({
    enabled: true,
    trigger: 'manual'
  }));

  const result = spawnSync(process.execPath, ['bin/3things.js', 'hook'], {
    cwd: process.cwd(),
    env: isolatedHomeEnv(home),
    input: JSON.stringify({
      hook_event_name: 'UserPromptSubmit',
      prompt: 'Explain the retry boundary',
      cwd: process.cwd(),
      session_id: 'session-1',
      turn_id: 'turn-1',
      model: 'test-model'
    }),
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const task = JSON.parse(fs.readFileSync(path.join(stateDir, 'latest-task.json'), 'utf8'));
  assert.equal(task.agent, 'codex');
  assert.equal(task.prompt, 'Explain the retry boundary');
  assert.equal(task.sessionId, 'session-1');
  assert.equal(task.turnId, 'turn-1');
  fs.rmSync(home, { recursive: true, force: true });
});

test('hook command records Claude Code as the source agent', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), '3things-claude-hook-command-'));
  const stateDir = path.join(home, '.3things');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, 'config.json'), JSON.stringify({
    enabled: true,
    trigger: 'manual'
  }));

  const result = spawnSync(process.execPath, ['bin/3things.js', 'hook', '--agent', 'claude'], {
    cwd: process.cwd(),
    env: isolatedHomeEnv(home),
    input: JSON.stringify({
      hook_event_name: 'UserPromptSubmit',
      prompt: 'Explain this retry boundary',
      cwd: process.cwd(),
      session_id: 'claude-session'
    }),
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const task = JSON.parse(fs.readFileSync(path.join(stateDir, 'latest-task.json'), 'utf8'));
  assert.equal(task.agent, 'claude');
  assert.equal(task.sessionId, 'claude-session');
  fs.rmSync(home, { recursive: true, force: true });
});

test('signoff removes local state and only the 3Things hook', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), '3things-signoff-'));
  const stateDir = path.join(home, '.3things');
  const codexDir = path.join(home, '.codex');
  const claudeDir = path.join(home, '.claude');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(codexDir, { recursive: true });
  fs.mkdirSync(claudeDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, 'config.json'), '{}');
  fs.writeFileSync(path.join(codexDir, 'hooks.json'), JSON.stringify({
    hooks: {
      UserPromptSubmit: [{
        hooks: [
          { type: 'command', command: '"/node" "/app/bin/3things.js" hook' },
          { type: 'command', command: 'python3 keep.py' }
        ]
      }]
    }
  }));
  fs.writeFileSync(path.join(claudeDir, 'settings.json'), JSON.stringify({
    permissions: { allow: ['Read'] },
    hooks: {
      UserPromptSubmit: [{
        hooks: [
          { type: 'command', command: '"/node" "/app/bin/3things.js" hook --agent "claude"' },
          { type: 'command', command: 'python3 keep-claude.py' }
        ]
      }]
    }
  }));

  const result = spawnSync(process.execPath, ['bin/3things.js', 'signoff'], {
    cwd: process.cwd(),
    env: isolatedHomeEnv(home),
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(stateDir), false);
  const hooks = JSON.parse(fs.readFileSync(path.join(codexDir, 'hooks.json'), 'utf8'));
  assert.deepEqual(hooks.hooks.UserPromptSubmit[0].hooks, [
    { type: 'command', command: 'python3 keep.py' }
  ]);
  const claudeSettings = JSON.parse(fs.readFileSync(path.join(claudeDir, 'settings.json'), 'utf8'));
  assert.deepEqual(claudeSettings.permissions, { allow: ['Read'] });
  assert.deepEqual(claudeSettings.hooks.UserPromptSubmit[0].hooks, [
    { type: 'command', command: 'python3 keep-claude.py' }
  ]);
  fs.rmSync(home, { recursive: true, force: true });
});
