-- Backfill node_binary_sha256 for testnet-v0.1.8 listing URLs if 007 ran when hashes were still NULL.
-- Safe to re-run (only updates rows with NULL/empty SHA on v0.1.8 URLs).
-- Apply: cd apps/web && wrangler d1 execute vibeminer-db --remote --file=./d1/migrations/008_boing_testnet_zip_sha_v0_1_8.sql

UPDATE network_listings SET
  node_binary_sha256 = '2cea7a6f093990c02bf405a20caf3b68bb59b434b69421449ab6bb4fec96a16a',
  updated_at = datetime('now')
WHERE id = 'boing-devnet'
  AND node_download_url LIKE '%/testnet-v0.1.8/%'
  AND (node_binary_sha256 IS NULL OR TRIM(COALESCE(node_binary_sha256, '')) = '');

UPDATE network_listings SET
  node_binary_sha256 = '70355e6e6c6c9f33804957df1c215a531bec0c329fe5c1fc48f3d23350bd296c',
  updated_at = datetime('now')
WHERE id = 'boing-devnet-linux'
  AND node_download_url LIKE '%/testnet-v0.1.8/%'
  AND (node_binary_sha256 IS NULL OR TRIM(COALESCE(node_binary_sha256, '')) = '');

UPDATE network_listings SET
  node_binary_sha256 = '435216299129a6bcc04d4775cf7956315246c4860bf2fd8a769df93bea7e7bbc',
  updated_at = datetime('now')
WHERE id = 'boing-devnet-macos'
  AND node_download_url LIKE '%/testnet-v0.1.8/%'
  AND (node_binary_sha256 IS NULL OR TRIM(COALESCE(node_binary_sha256, '')) = '');
