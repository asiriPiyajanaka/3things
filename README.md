# 3Things

[![CI](https://github.com/asiriPiyajanaka/3things-mvp/actions/workflows/ci.yml/badge.svg)](https://github.com/asiriPiyajanaka/3things-mvp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/asiriPiyajanaka/3things-mvp/blob/main/LICENSE)

Learn three things from the coding work you are already doing.

3Things is a tiny companion CLI for Codex, Claude Code, and other coding agents. It captures a real development task, opens a short learning flow when useful, and teaches exactly three concepts tied to that task. Your coding agent remains your normal workflow; 3Things sits beside it.

## Install

```bash
npm install -g 3things-cli
3things init
```

Requirements:

- Node.js 22+
- Codex CLI installed and authenticated for generated lessons, even when tasks are captured from Claude Code
- macOS, Windows, or Linux with a supported graphical terminal

`3things init` asks whether to capture from Codex, Claude Code, or both, then installs the selected `UserPromptSubmit` hooks.

Codex may ask you to review and trust newly installed hooks before they run. Use `/hooks` inside Codex to inspect the 3Things hook and trust it after confirming the command points to your installed `3things` CLI. Claude Code also exposes `/hooks` for inspecting its active hook configuration.

## How It Works

```text
codex
> Add Stripe payment handling and webhook support

# Codex keeps working in the original terminal.
# 3Things can open a separate lesson terminal.

What do you want to learn today?
> Backend - payment state belongs behind the client
  Architecture - model asynchronous payment state
  Security - verify webhook authenticity

Pick what you want to understand:
> 1. Payment idempotency - prevent duplicate financial effects
  2. Webhook reconciliation - provider events become durable truth
  3. Payment state machines - model pending through settlement
  All 3
```

The learning flow is always:

1. Choose a learning area.
2. Receive exactly three relevant concepts.
3. Choose one concept or all three.
4. Read a compact lesson.

## Commands

```bash
3things init
3things
3things capture
3things config
3things interests
3things area
3things history
3things again
3things status
3things on
3things off
3things reset
3things signoff
```

`3things signoff` removes installed 3Things hooks from Codex and Claude Code, then deletes local 3Things data. It preserves unrelated hooks and settings in both products.

`3things` with no subcommand uses the latest captured task.

`3things capture` accepts a task from any coding agent. Pipe plain text or JSON, or pass `--prompt`, `--agent`, and `--cwd`.

```bash
printf '%s' "Fix stale auth token refresh" | 3things capture --agent custom --cwd "$PWD"
```

JSON input is also supported:

```bash
printf '%s' '{"agent":"custom","prompt":"Fix stale auth token refresh","cwd":"/path/to/repo"}' | 3things capture
```

## Trigger Modes

3Things can be configured with:

- `smart` - launch only when the task has useful learning value.
- `every` - launch for every captured task.
- `manual` - capture tasks but only teach when you run `3things`.

Automatic launch can be paused and resumed:

```bash
3things off
3things on
```

## Terminal Modes

Lessons can open in:

- `new` - a new learning terminal for each lesson.
- `single` - one active learning terminal; new eligible tasks wait until the current lesson is done.

Change this with:

```bash
3things config
```

## Codex Integration

`3things init` adds a `UserPromptSubmit` entry to `~/.codex/hooks.json` and preserves existing hook configuration. The installed hook command points directly to Node and the installed 3Things CLI so it does not depend on shell `PATH` lookup.

The same user-level Codex configuration is used by local Codex sessions in the CLI, VS Code extension, and desktop app. If one of those clients was already open during setup, start a new chat or restart/reload the client before testing.

Codex treats user-managed hooks as commands that should be reviewed before use. After initialization, open `/hooks` in Codex and trust the 3Things hook if the command matches the installed Node and `3things` paths you expect.

Internal Codex calls are read-only and ephemeral:

```text
codex exec --ephemeral --sandbox read-only
```

They also set:

```text
THREETHINGS_CHILD=1
```

That prevents recursive hook launches from 3Things' own Codex calls.

To remove the integration, run `3things signoff` before uninstalling the npm package. This prevents a stale hook from pointing to a CLI that no longer exists.

## Claude Code Integration

When selected during setup, 3Things adds a `UserPromptSubmit` entry to `~/.claude/settings.json` and preserves unrelated Claude settings and hooks. Claude Code uses the hook across its CLI, VS Code extension, and desktop app for local coding sessions.

The captured task is labeled `claude`, but lesson generation still uses the locally authenticated Codex CLI. To change enabled integrations later, run:

```bash
3things config
```

## Test the Integrations

First verify the lesson-terminal launcher independently of an agent:

```bash
3things capture --agent smoke-test --prompt "Design retry handling with idempotency"
```

With trigger mode set to `every`, a new lesson terminal should open. With `smart`, use a concrete engineering task rather than a greeting or trivial command.

Then test each selected agent:

1. Open a new Codex or Claude Code chat in the CLI, VS Code extension, or desktop app.
2. Check `/hooks` and confirm the 3Things `UserPromptSubmit` hook is active. Codex requires explicit trust for new or changed hooks.
3. Submit a concrete task such as `Add idempotent retry handling to the payment worker`.
4. Run `3things status` in a terminal. The latest task should show `[codex]` or `[claude]`, and the lesson terminal should open according to your trigger mode.

On macOS, 3Things opens a temporary `.command` file through Terminal. This avoids AppleScript Automation permission problems when the hook originates from VS Code or a desktop app.

## Local Data

3Things stores its local state under:

```text
~/.3things/
  config.json
  latest-task.json
  learning-session.json
  pending-task.json
  smart-decision.json
  history.jsonl
  topic-offers.jsonl
  tasks/
```

Captured task prompts are stored locally so manual mode and newly opened lesson terminals have a reliable handoff. Avoid using 3Things with prompts containing secrets you would not want persisted locally.

Task files, lesson history, and recent topic offers do not expire automatically. They remain on the machine until you run `3things signoff` or remove `~/.3things/` yourself. Files are created with user-only permissions where the operating system supports them.

Lesson generation sends the captured task to your locally authenticated Codex CLI. Codex runs with an ephemeral session and a read-only project sandbox. 3Things has no server, database, analytics, or telemetry, and it never modifies project code.

To remove local 3Things state:

```bash
3things signoff
```

## Uninstall

```bash
3things signoff
npm uninstall -g 3things-cli
```

Run `signoff` first so the Codex and Claude Code hooks are removed while the CLI is still installed.

## License and Attribution

3Things is released under the [MIT License](https://github.com/asiriPiyajanaka/3things-mvp/blob/main/LICENSE).

Copyright (c) 2026 [asiriPiyajanaka](https://github.com/asiriPiyajanaka). When redistributing copies or substantial portions of 3Things, keep the copyright and license notice, including the project link. Attribution does not imply endorsement.

Contributions are welcome. See the [contribution guide](https://github.com/asiriPiyajanaka/3things-mvp/blob/main/CONTRIBUTING.md) and [code of conduct](https://github.com/asiriPiyajanaka/3things-mvp/blob/main/CODE_OF_CONDUCT.md). Please report security issues using the [security policy](https://github.com/asiriPiyajanaka/3things-mvp/blob/main/SECURITY.md).

## Development

```bash
npm test
npm run check
```
