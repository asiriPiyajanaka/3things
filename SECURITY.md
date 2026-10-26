# Security Policy

## Supported Versions

Security fixes are applied to the latest published version of 3Things.

## Reporting a Vulnerability

Please do not open a public issue for a suspected vulnerability or accidental secret exposure.

Report it privately through [GitHub's security advisory form](https://github.com/asiriPiyajanaka/3things-mvp/security/advisories/new). Include the affected version, reproduction steps, impact, and any suggested mitigation.

You should receive an acknowledgement within seven days. Please allow time for investigation and a coordinated fix before public disclosure.

## Security Boundaries

3Things stores captured prompts and lesson history locally under `~/.3things/`. Internal Codex calls use an ephemeral session and a read-only sandbox. The project intentionally has no server, telemetry service, database, or runtime dependencies.
