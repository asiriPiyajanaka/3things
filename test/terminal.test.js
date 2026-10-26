import test from 'node:test';
import assert from 'node:assert/strict';
import { learningCommand, macTerminalScript, windowsPowerShellPath } from '../src/terminal.js';

test('macTerminalScript activates Terminal before running lesson command', () => {
  const script = macTerminalScript('/path with "quote"/node 3things');

  assert.match(script, /tell application "Terminal"/);
  assert.match(script, /activate/);
  assert.match(script, /do script/);
  assert.match(script, /\\"quote\\"/);
});

test('windowsPowerShellPath resolves independently of PATH', () => {
  assert.equal(
    windowsPowerShellPath({ SystemRoot: 'C:\\Windows' }),
    'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
  );
});

test('learningCommand uses the PowerShell call operator and escapes apostrophes', () => {
  const command = learningCommand("C:\\task's\\event.json", {
    platform: 'win32',
    nodePath: 'C:\\Program Files\\nodejs\\node.exe',
    targetCliPath: "C:\\Users\\Asiri's App\\3things.js"
  });

  assert.equal(
    command,
    "& 'C:\\Program Files\\nodejs\\node.exe' 'C:\\Users\\Asiri''s App\\3things.js' learn --event 'C:\\task''s\\event.json'"
  );
});
