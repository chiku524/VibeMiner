-- Bump Boing testnet node zips to testnet-v0.1.7 (consensus round after persistence; matches @vibeminer/shared + boing.network).
-- Apply: cd apps/web && wrangler d1 execute vibeminer-db --remote --file=./d1/migrations/006_boing_testnet_zip_urls_v0_1_7.sql

UPDATE network_listings SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.7/release-windows-x86_64.zip',
  node_command_template = 'boing-node-windows-x86_64.exe --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable',
  node_binary_sha256 = '9dd69565e8d4225fb9bb229e11d6acbbaeab1d4a395d9efeb2346fc6c1144111',
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
  );

UPDATE network_listings SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.7/release-linux-x86_64.zip',
  node_command_template = 'boing-node-linux-x86_64 --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable',
  node_binary_sha256 = 'd7f394301f17dcef5c59e08d8fda2a269b5880e8af0601ade96a4c905b47d2db',
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
  );

UPDATE network_listings SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.7/release-macos-aarch64.zip',
  node_command_template = 'boing-node-macos-aarch64 --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001,/ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable',
  node_binary_sha256 = '3fd1fa44fe22c7c4b399426afebeea74df999107772dffb1a4a62ba810d4f378',
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
  );
