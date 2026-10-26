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
    /(?:^|[\\/])3things\.js["']?\s+hook$/.test(hook.command.trim());
}

function readHooksFile(hooksPath) {
  if (!fs.existsSync(hooksPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
  } catch {
    throw new Error(`Cannot parse existing ${hooksPath}. Fix it before changing 3Things hooks.`);
  }
}

function writeHooksFile(hooksPath, root) {
  fs.mkdirSync(path.dirname(hooksPath), { recursive: true });
  fs.writeFileSync(hooksPath, `${JSON.stringify(root, null, 2)}\n`);
}

export function installHook(command, hooksPath = codexHooksPath) {
  fs.mkdirSync(path.dirname(hooksPath), { recursive: true });
  const root = readHooksFile(hooksPath) || {};
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

  writeHooksFile(hooksPath, root);
  return { path: hooksPath, added: !found, updated, removed };
}

export function removeHook(hooksPath = codexHooksPath) {
  const root = readHooksFile(hooksPath);
  const groups = root?.hooks?.UserPromptSubmit;
  if (!root || !Array.isArray(groups)) {
    return { path: hooksPath, removed: 0, updated: false };
  }

  let removed = 0;
  const nextGroups = [];
  for (const group of groups) {
    if (!Array.isArray(group?.hooks)) {
      nextGroups.push(group);
      continue;
    }
    const hooks = group.hooks.filter((hook) => {
      if (!is3ThingsHook(hook)) return true;
      removed += 1;
      return false;
    });
    if (hooks.length > 0) nextGroups.push({ ...group, hooks });
  }

  if (removed === 0) {
    return { path: hooksPath, removed, updated: false };
  }

  if (nextGroups.length > 0) root.hooks.UserPromptSubmit = nextGroups;
  else delete root.hooks.UserPromptSubmit;
  writeHooksFile(hooksPath, root);
  return { path: hooksPath, removed, updated: true };
}
