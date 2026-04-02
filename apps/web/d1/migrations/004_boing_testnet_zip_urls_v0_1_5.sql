-- Bump Boing testnet node zips to testnet-v0.1.5 (matches boing.network release + @vibeminer/shared defaults).
-- Matches website/migrations/2026-04-02-network-listings-boing-testnet-v0-1-5.sql (SHA256 of each zip).
--
-- Apply to VibeMiner production D1:
--   cd apps/web && wrangler d1 execute vibeminer-db --remote --file=./d1/migrations/004_boing_testnet_zip_urls_v0_1_5.sql

UPDATE network_listings SET
  node_download_url = 'https://github.com/chiku524/boing.network/releases/download/testnet-v0.1.5/release-windows-x86_64.zip',
  node_command_template = 'boing-node-windows-x86_64.exe --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable',
  node_binary_sha256 = '9d5f9abf5872721b9c435e69ccbe539ad3105e677dc6927f713f905cd00ae7bf',
  updated_at = datetime('now')
WHERE id = 'boing-devnet'
  AND node_download_url IS NOT NULL
  AND (
    node_download_url LIKE '%/testnet-v0.1.0/%'
    OR node_download_url LIKE '%/testnet-v0.1.1/%'
    OR node_download_url LIKE '%/testnet-v0.1.2/%'
    OR node_download_url LIKE '%/testnet-v0.1.3/%'
    OR node_download_url LIKE '%/testnet-v0.1.4/%'
  );

UPDATE network_listings SET
  node_download_url = 'https://github.com/chiku524/boing.network/releases/download/testnet-v0.1.5/release-linux-x86_64.zip',
  node_command_template = 'boing-node-linux-x86_64 --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable',
  node_binary_sha256 = 'd502e00dc4c97a2e2223c868d8ec3c5ac087d4c17e2eaf20f0f9d21636090dfa',
  updated_at = datetime('now')
WHERE id = 'boing-devnet-linux'
  AND node_download_url IS NOT NULL
  AND (
    node_download_url LIKE '%/testnet-v0.1.0/%'
    OR node_download_url LIKE '%/testnet-v0.1.1/%'
    OR node_download_url LIKE '%/testnet-v0.1.2/%'
    OR node_download_url LIKE '%/testnet-v0.1.3/%'
    OR node_download_url LIKE '%/testnet-v0.1.4/%'
  );

UPDATE network_listings SET
  node_download_url = 'https://github.com/chiku524/boing.network/releases/download/testnet-v0.1.5/release-macos-aarch64.zip',
  node_command_template = 'boing-node-macos-aarch64 --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable',
  node_binary_sha256 = '2a7ce8f3df050dfbc336edd0b943c3a558a0be32ec8bd273b5ff66be899c399c',
  updated_at = datetime('now')
WHERE id = 'boing-devnet-macos'
  AND node_download_url IS NOT NULL
  AND (
    node_download_url LIKE '%/testnet-v0.1.0/%'
    OR node_download_url LIKE '%/testnet-v0.1.1/%'
    OR node_download_url LIKE '%/testnet-v0.1.2/%'
    OR node_download_url LIKE '%/testnet-v0.1.3/%'
    OR node_download_url LIKE '%/testnet-v0.1.4/%'
  );
