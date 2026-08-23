import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveCodexExecutable } from '../src/codex.js';

test('resolveCodexExecutable finds codex from caller PATH', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), '3things-codex-bin-'));
  const executable = path.join(dir, process.platform === 'win32' ? 'codex.cmd' : 'codex');
  fs.writeFileSync(executable, '#!/bin/sh\nexit 0\n');
  fs.chmodSync(executable, 0o755);

  assert.equal(resolveCodexExecutable({ PATH: dir }), executable);

  fs.rmSync(dir, { recursive: true, force: true });
});

test('resolveCodexExecutable returns null when codex is not on PATH', () => {
  assert.equal(resolveCodexExecutable({ PATH: '' }), null);
});
