import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildHookCommand,
  installClaudeHook,
  installHook,
  removeClaudeHook,
  removeHook
} from '../src/hook.js';

test('buildHookCommand quotes node and cli paths', () => {
  const command = buildHookCommand('/path with space/node', '/app/3things/bin/3things.js');
  assert.equal(command, '"/path with space/node" "/app/3things/bin/3things.js" hook');
});

test('buildHookCommand identifies Claude Code captures', () => {
  const command = buildHookCommand('/node', '/app/3things.js', 'claude');
  assert.equal(command, '"/node" "/app/3things.js" hook --agent "claude"');
});

test('installHook replaces a stale 3Things command', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), '3things-hook-'));
  const hooksPath = path.join(dir, 'hooks.json');
  fs.writeFileSync(hooksPath, JSON.stringify({
    hooks: {
      UserPromptSubmit: [{
        hooks: [{
          type: 'command',
          command: '"/node" "/old/3things-mvp/bin/3things.js" hook',
          async: true,
          timeout: 120
        }]
      }]
    }
  }));

  const result = installHook('"/node" "/new/3things/bin/3things.js" hook', hooksPath);
  const root = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));

  assert.deepEqual(result, {
    path: hooksPath,
    added: false,
    updated: true,
    removed: 0
  });
  assert.equal(
    root.hooks.UserPromptSubmit[0].hooks[0].command,
    '"/node" "/new/3things/bin/3things.js" hook'
  );
});

test('installHook keeps one current 3Things hook and preserves unrelated hooks', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), '3things-hook-'));
  const hooksPath = path.join(dir, 'hooks.json');
  fs.writeFileSync(hooksPath, JSON.stringify({
    hooks: {
      UserPromptSubmit: [{
        hooks: [
          {
            type: 'command',
            command: '"/node" "/new/3things/bin/3things.js" hook',
            async: true,
            timeout: 120
          },
          {
            type: 'command',
            command: 'python3 ~/.codex/hooks/log_prompt.py'
          },
          {
            type: 'command',
            command: '"/node" "/old/3things-mvp/bin/3things.js" hook',
            async: true,
            timeout: 120
          }
        ]
      }]
    }
  }));

  const result = installHook('"/node" "/new/3things/bin/3things.js" hook', hooksPath);
  const root = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
  const hooks = root.hooks.UserPromptSubmit[0].hooks;

  assert.equal(result.added, false);
  assert.equal(result.updated, true);
  assert.equal(result.removed, 1);
  assert.equal(hooks.length, 2);
  assert.equal(hooks[0].command, '"/node" "/new/3things/bin/3things.js" hook');
  assert.equal(hooks[1].command, 'python3 ~/.codex/hooks/log_prompt.py');
});

test('removeHook removes 3Things hooks and preserves unrelated configuration', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), '3things-hook-remove-'));
  const hooksPath = path.join(dir, 'hooks.json');
  fs.writeFileSync(hooksPath, JSON.stringify({
    description: 'user hooks',
    hooks: {
      UserPromptSubmit: [
        {
          matcher: 'ignored-for-this-event',
          hooks: [
            { type: 'command', command: '"/node" "/app/bin/3things.js" hook' },
            { type: 'command', command: 'python3 ~/.codex/hooks/keep.py' }
          ]
        },
        {
          hooks: [{ type: 'command', command: '"/node" "C:\\old\\bin\\3things.js" hook' }]
        }
      ],
      Stop: [{ hooks: [{ type: 'command', command: 'python3 stop.py' }] }]
    }
  }));

  const result = removeHook(hooksPath);
  const root = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));

  assert.deepEqual(result, { path: hooksPath, removed: 2, updated: true });
  assert.equal(root.description, 'user hooks');
  assert.deepEqual(root.hooks.UserPromptSubmit, [{
    matcher: 'ignored-for-this-event',
    hooks: [{ type: 'command', command: 'python3 ~/.codex/hooks/keep.py' }]
  }]);
  assert.equal(root.hooks.Stop[0].hooks[0].command, 'python3 stop.py');
});

test('removeHook is a no-op when the hooks file is missing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), '3things-hook-missing-'));
  const hooksPath = path.join(dir, 'hooks.json');
  assert.deepEqual(removeHook(hooksPath), { path: hooksPath, removed: 0, updated: false });
});

test('Claude hook install and removal preserve unrelated settings', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), '3things-claude-hook-'));
  const settingsPath = path.join(dir, 'settings.json');
  fs.writeFileSync(settingsPath, JSON.stringify({
    permissions: { allow: ['Read'] },
    hooks: {
      UserPromptSubmit: [{
        hooks: [{ type: 'command', command: 'python3 keep.py' }]
      }]
    }
  }));

  const command = buildHookCommand('/node', '/app/bin/3things.js', 'claude');
  const installed = installClaudeHook(command, settingsPath);
  let root = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

  assert.equal(installed.added, true);
  assert.equal(root.permissions.allow[0], 'Read');
  assert.equal(root.hooks.UserPromptSubmit[1].hooks[0].command, command);

  const removed = removeClaudeHook(settingsPath);
  root = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  assert.equal(removed.removed, 1);
  assert.equal(root.permissions.allow[0], 'Read');
  assert.deepEqual(root.hooks.UserPromptSubmit, [{
    hooks: [{ type: 'command', command: 'python3 keep.py' }]
  }]);
});
