# Changelog

All notable changes to 3Things will be documented here.

The project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.0] - 2026-10-29

- Added first-class task capture for Codex CLI, IDE, and desktop sessions through shared hook configuration.
- Added Claude Code CLI, IDE, and desktop capture with preserved `~/.claude/settings.json` configuration.
- Replaced the macOS AppleScript launcher with a temporary `.command` launcher that works from editor and desktop processes without Automation permission.

## [0.1.0] - 2026-10-28

- Initial public release of the 3Things companion CLI.
- Added symmetric Codex hook removal during `3things signoff`.
- Added input validation, Windows-safe terminal discovery, release checks, and expanded tests.
- Added community, security, privacy, attribution, and release documentation.
