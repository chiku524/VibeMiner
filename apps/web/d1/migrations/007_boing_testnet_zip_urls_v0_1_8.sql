-- Bump Boing testnet node zips to testnet-v0.1.8 (matches @vibeminer/shared + boing.network Workers).
-- Zip SHA256: same as boing.network network-listings-release-sql.mjs output for testnet-v0.1.8.
-- Apply: cd apps/web && wrangler d1 execute vibeminer-db --remote --file=./d1/migrations/007_boing_testnet_zip_urls_v0_1_8.sql

UPDATE network_listings SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.8/release-windows-x86_64.zip',
  node_command_template = 'boing-node-windows-x86_64.exe --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable',
  node_binary_sha256 = '2cea7a6f093990c02bf405a20caf3b68bb59b434b69421449ab6bb4fec96a16a',
  updated_at = datetime('now')
WHERE id = 'boing-devnet'
  AND node_download_url IS NOT NULL
  AND (
    node_download_url LIKE '%/testnet-v0.1.0/%'
    OR node_download_url LIKE '%/testnet-v0.1.1/%'
    OR node_download_url LIKE '%/testnet-v0.1.2/%'
    OR node_download_url LIKE '%/testnet-v0.1.3/%'
    OR node_download_url LIKE '%/testnet-v0.1.4/%'
    OR node_download_url LIKE '%/testnet-v0.1.5/%'
    OR node_download_url LIKE '%/testnet-v0.1.6/%'
    OR node_download_url LIKE '%/testnet-v0.1.7/%'
  );

UPDATE network_listings SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.8/release-linux-x86_64.zip',
  node_command_template = 'boing-node-linux-x86_64 --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable',
  node_binary_sha256 = '70355e6e6c6c9f33804957df1c215a531bec0c329fe5c1fc48f3d23350bd296c',
  updated_at = datetime('now')
WHERE id = 'boing-devnet-linux'
  AND node_download_url IS NOT NULL
  AND (
    node_download_url LIKE '%/testnet-v0.1.0/%'
    OR node_download_url LIKE '%/testnet-v0.1.1/%'
    OR node_download_url LIKE '%/testnet-v0.1.2/%'
    OR node_download_url LIKE '%/testnet-v0.1.3/%'
    OR node_download_url LIKE '%/testnet-v0.1.4/%'
    OR node_download_url LIKE '%/testnet-v0.1.5/%'
    OR node_download_url LIKE '%/testnet-v0.1.6/%'
    OR node_download_url LIKE '%/testnet-v0.1.7/%'
  );

UPDATE network_listings SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.8/release-macos-aarch64.zip',
  node_command_template = 'boing-node-macos-aarch64 --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable',
  node_binary_sha256 = '435216299129a6bcc04d4775cf7956315246c4860bf2fd8a769df93bea7e7bbc',
  updated_at = datetime('now')
WHERE id = 'boing-devnet-macos'
  AND node_download_url IS NOT NULL
  AND (
    node_download_url LIKE '%/testnet-v0.1.0/%'
    OR node_download_url LIKE '%/testnet-v0.1.1/%'
    OR node_download_url LIKE '%/testnet-v0.1.2/%'
    OR node_download_url LIKE '%/testnet-v0.1.3/%'
    OR node_download_url LIKE '%/testnet-v0.1.4/%'
    OR node_download_url LIKE '%/testnet-v0.1.5/%'
    OR node_download_url LIKE '%/testnet-v0.1.6/%'
    OR node_download_url LIKE '%/testnet-v0.1.7/%'
  );
