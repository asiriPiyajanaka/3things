# 3Things

Learn three things from the coding work you are already doing.

3Things is a tiny companion CLI for Codex and other coding agents. It captures a real development task, opens a short learning flow when useful, and teaches exactly three concepts tied to that task. Codex remains your normal workflow; 3Things sits beside it.

## Install

```bash
npm install -g 3things-cli
3things init
```

Requirements:

- Node.js 20+
- Codex CLI installed and authenticated for generated lessons

`3things init` configures 3Things and installs a Codex `UserPromptSubmit` hook so normal Codex prompts can be captured automatically.

Codex may ask you to review and trust newly installed hooks before they run. Use `/hooks` inside Codex to inspect the 3Things hook and trust it after confirming the command points to your installed `3things` CLI.

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
  tasks/
```

Captured task prompts are stored locally so manual mode and newly opened lesson terminals have a reliable handoff. Avoid using 3Things with prompts containing secrets you would not want persisted locally.

To remove local 3Things state:

```bash
3things signoff
```

## Development

```bash
npm test
npm run check
```
