-- Bump Boing testnet node zips from pre-QA tags (testnet-v0.1.0–v0.1.2) to testnet-v0.1.4.
-- Matches website/migrations/2026-03-30-network-listings-boing-testnet-v0-1-4.sql (SHA256 of each zip).
--
-- Apply to VibeMiner production D1:
--   cd apps/web && wrangler d1 execute vibeminer-db --remote --file=./d1/migrations/003_boing_testnet_zip_urls_v0_1_4.sql
-- Local:
--   wrangler d1 execute vibeminer-db --local --file=./d1/migrations/003_boing_testnet_zip_urls_v0_1_4.sql

UPDATE network_listings SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.4/release-windows-x86_64.zip',
  node_command_template = 'boing-node-windows-x86_64.exe --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable',
  node_binary_sha256 = '50898a02f3cba1effe0c91a6f0ea48d3eed62ab87b7aeb3ebb653b30a1248f65',
  updated_at = datetime('now')
WHERE id = 'boing-devnet'
  AND node_download_url IS NOT NULL
  AND (
    node_download_url LIKE '%/testnet-v0.1.0/%'
    OR node_download_url LIKE '%/testnet-v0.1.1/%'
    OR node_download_url LIKE '%/testnet-v0.1.2/%'
  );

UPDATE network_listings SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.4/release-linux-x86_64.zip',
  node_command_template = 'boing-node-linux-x86_64 --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable',
  node_binary_sha256 = 'a96987461201f00d618afad5a494b52837663f90f6d9d3d5c097b6843cad17ab',
  updated_at = datetime('now')
WHERE id = 'boing-devnet-linux'
  AND node_download_url IS NOT NULL
  AND (
    node_download_url LIKE '%/testnet-v0.1.0/%'
    OR node_download_url LIKE '%/testnet-v0.1.1/%'
    OR node_download_url LIKE '%/testnet-v0.1.2/%'
  );

UPDATE network_listings SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.4/release-macos-aarch64.zip',
  node_command_template = 'boing-node-macos-aarch64 --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable',
  node_binary_sha256 = '26fd3477dfead760b3a04d5449173cbb7468286f33a51eec09d07d96982c0718',
  updated_at = datetime('now')
WHERE id = 'boing-devnet-macos'
  AND node_download_url IS NOT NULL
  AND (
    node_download_url LIKE '%/testnet-v0.1.0/%'
    OR node_download_url LIKE '%/testnet-v0.1.1/%'
    OR node_download_url LIKE '%/testnet-v0.1.2/%'
  );
