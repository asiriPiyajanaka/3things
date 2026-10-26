import fs from 'node:fs';
import path from 'node:path';
import { codexHooksPath } from './paths.js';

export function buildHookCommand(nodePath, cliPath) {
  const quote = (v) => `"${String(v).replaceAll(/\\/g, '\\\\').replaceAll(/"/g, '\\"')}"`;
  return `${quote(nodePath)} ${quote(cliPath)} hook`;
}

function is3ThingsHook(hook) {
  return hook?.type === 'command' &&
    typeof hook.command === 'string' &&
    hook.command.includes('3things') &&
    hook.command.endsWith(' hook');
}

export function installHook(command, hooksPath = codexHooksPath) {
  fs.mkdirSync(path.dirname(hooksPath), { recursive: true });
  let root = {};
  if (fs.existsSync(hooksPath)) {
    try { root = JSON.parse(fs.readFileSync(hooksPath, 'utf8')); }
    catch { throw new Error(`Cannot parse existing ${hooksPath}. Fix it before installing 3Things.`); }
  }
  root.hooks ||= {};
  root.hooks.UserPromptSubmit ||= [];

  let found = false;
  let updated = false;
  let removed = 0;
  for (const group of root.hooks.UserPromptSubmit) {
    if (!Array.isArray(group.hooks)) continue;
    const hooks = [];
    for (const hook of group.hooks) {
      if (!is3ThingsHook(hook)) {
        hooks.push(hook);
        continue;
      }
      if (found) {
        removed += 1;
        updated = true;
        continue;
      }
      found = true;
      const nextHook = {
        ...hook,
        type: 'command',
        command,
        async: true,
        timeout: 120
      };
      updated ||= JSON.stringify(nextHook) !== JSON.stringify(hook);
      hooks.push(nextHook);
    }
    group.hooks = hooks;
  }

  if (!found) {
    root.hooks.UserPromptSubmit.push({
      hooks: [{
        type: 'command',
        command,
        async: true,
        timeout: 120
      }]
    });
  }

  root.hooks.UserPromptSubmit = root.hooks.UserPromptSubmit.filter((group) =>
    !Array.isArray(group.hooks) || group.hooks.length > 0
  );

  fs.writeFileSync(hooksPath, `${JSON.stringify(root, null, 2)}\n`);
  return { path: hooksPath, added: !found, updated, removed };
}
