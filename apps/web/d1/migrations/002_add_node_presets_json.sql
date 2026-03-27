-- Multiple node run modes per listing (validator, full node, etc.)
--
-- Re-running this file with `wrangler d1 execute ... --file=...` fails if the column
-- already exists (duplicate column). For an idempotent apply, use:
--   npm run db:ensure-node-presets-json -w vibeminer-web
--   npm run db:ensure-node-presets-json:local -w vibeminer-web   # local dev DB
alter table network_listings add column node_presets_json text;
