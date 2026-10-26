# Contributing to 3Things

Thanks for helping improve 3Things.

## Before You Start

- Open an issue before making a large product or architecture change.
- Keep the project small and prefer Node.js built-ins.
- Do not add runtime dependencies without a clear reduction in overall complexity.
- Preserve the core rule: every task produces exactly three learning concepts. Do not add a configurable concept count.
- 3Things must never modify a user's project code.
- Every internal Codex call must remain read-only, ephemeral, and protected by `THREETHINGS_CHILD=1`.

## Development

Requirements:

- Node.js 22 or newer
- Codex CLI for manually exercising generated lessons

Clone the repository and run:

```bash
npm test
npm run check
```

No dependency installation is currently required because the project has zero runtime and development dependencies.

## Pull Requests

Keep pull requests focused. Include:

- a clear explanation of the behavior change
- tests for new or changed behavior
- documentation changes when commands, local data, hooks, or privacy behavior change
- confirmation that `npm test` and `npm run check` pass

By contributing, you agree that your contribution is licensed under the project's MIT License.
