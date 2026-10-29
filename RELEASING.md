# Releasing 3Things

Only maintainers publish releases.

1. Confirm the changelog and version in `package.json` are ready.
2. Run the required checks:

   ```bash
   npm test
   npm run check
   npm pack --dry-run
   npm publish --dry-run --access public
   ```

3. Confirm the npm package contains only the expected runtime files, README, and license.
4. Publish with npm two-factor authentication enabled:

   ```bash
   npm publish --access public
   ```

5. Create and push a matching Git tag, then create a GitHub release using the changelog entry.

Never publish from a dirty working tree. Do not include local `~/.3things/` data, Codex configuration, credentials, or generated tarballs.
