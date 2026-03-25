/**
 * @deprecated Use `scripts/build-brand-assets.cjs` (npm run generate-brand-assets / prebuild).
 * Kept so older docs/commands that invoke this file still work.
 */
require('child_process').execSync(`node "${require('path').join(__dirname, 'build-brand-assets.cjs')}"`, {
  stdio: 'inherit',
});
