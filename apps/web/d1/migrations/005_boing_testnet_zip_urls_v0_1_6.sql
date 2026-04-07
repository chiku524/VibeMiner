-- Bump Boing testnet node zips to testnet-v0.1.6 (faucet fix; matches @vibeminer/shared + boing.network Workers).
-- Apply: cd apps/web && wrangler d1 execute vibeminer-db --remote --file=./d1/migrations/005_boing_testnet_zip_urls_v0_1_6.sql

UPDATE network_listings SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.6/release-windows-x86_64.zip',
  node_command_template = 'boing-node-windows-x86_64.exe --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable',
  node_binary_sha256 = '05de30c7bcd256f13549fa66bacf6a4072362c53b300ce912b03bc8c34185d1e',
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
  );

UPDATE network_listings SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.6/release-linux-x86_64.zip',
  node_command_template = 'boing-node-linux-x86_64 --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable',
  node_binary_sha256 = '5c7587c7c38ed75bc7ed35736a8a4111bf927dd60f3f2b8eb59dcd8d8ebf8032',
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
  );

UPDATE network_listings SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.6/release-macos-aarch64.zip',
  node_command_template = 'boing-node-macos-aarch64 --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable',
  node_binary_sha256 = 'b9561483bfd26017302e3745072183e58536bdb9ef50b6ab5324f83fd9a3ed44',
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
  );
