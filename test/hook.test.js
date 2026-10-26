import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildHookCommand, installHook } from '../src/hook.js';

test('buildHookCommand quotes node and cli paths', () => {
  const command = buildHookCommand('/path with space/node', '/app/3things/bin/3things.js');
  assert.equal(command, '"/path with space/node" "/app/3things/bin/3things.js" hook');
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
