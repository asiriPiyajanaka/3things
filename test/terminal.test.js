import test from 'node:test';
import assert from 'node:assert/strict';
import { learningCommand, macCommandContents, windowsPowerShellPath } from '../src/terminal.js';

test('macOS command launcher removes itself and runs the lesson', () => {
  const script = macCommandContents("'/path with space/node' 3things");

  assert.match(script, /^#!\/bin\/sh/);
  assert.match(script, /rm -f -- "\$launcher_file"/);
  assert.match(script, /exec '\/path with space\/node' 3things/);
  assert.doesNotMatch(script, /osascript|tell application/);
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
