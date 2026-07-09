-- Bump Boing testnet node zips to testnet-v0.1.10 (50k faucet for one-click stake validators).
-- Zip SHA256: GitHub release asset digest for testnet-v0.1.10.

UPDATE network_listings
SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.10/release-windows-x86_64.zip',
  node_binary_sha256 = '76c89f0e25069bb4462244778291c673590b818547f637af9205b1efa2ffce8e'
WHERE
  id = 'boing-devnet'
  AND (
    node_download_url LIKE '%/testnet-v0.1.0/%'
    OR node_download_url LIKE '%/testnet-v0.1.1/%'
    OR node_download_url LIKE '%/testnet-v0.1.2/%'
    OR node_download_url LIKE '%/testnet-v0.1.3/%'
    OR node_download_url LIKE '%/testnet-v0.1.4/%'
    OR node_download_url LIKE '%/testnet-v0.1.5/%'
    OR node_download_url LIKE '%/testnet-v0.1.6/%'
    OR node_download_url LIKE '%/testnet-v0.1.7/%'
    OR node_download_url LIKE '%/testnet-v0.1.8/%'
    OR node_download_url LIKE '%/testnet-v0.1.9/%'
  );

UPDATE network_listings
SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.10/release-linux-x86_64.zip',
  node_binary_sha256 = 'b576df6288d9ead28dd9ba380850e97738b7f9cf058ab95ed925293162409561'
WHERE
  id = 'boing-devnet-linux'
  AND (
    node_download_url LIKE '%/testnet-v0.1.0/%'
    OR node_download_url LIKE '%/testnet-v0.1.1/%'
    OR node_download_url LIKE '%/testnet-v0.1.2/%'
    OR node_download_url LIKE '%/testnet-v0.1.3/%'
    OR node_download_url LIKE '%/testnet-v0.1.4/%'
    OR node_download_url LIKE '%/testnet-v0.1.5/%'
    OR node_download_url LIKE '%/testnet-v0.1.6/%'
    OR node_download_url LIKE '%/testnet-v0.1.7/%'
    OR node_download_url LIKE '%/testnet-v0.1.8/%'
    OR node_download_url LIKE '%/testnet-v0.1.9/%'
  );

UPDATE network_listings
SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.10/release-macos-aarch64.zip',
  node_binary_sha256 = '5ddd479223be9a195dd6b33f60cd1001836af754720bde5766f44e0e8d7b984f'
WHERE
  id = 'boing-devnet-macos'
  AND (
    node_download_url LIKE '%/testnet-v0.1.0/%'
    OR node_download_url LIKE '%/testnet-v0.1.1/%'
    OR node_download_url LIKE '%/testnet-v0.1.2/%'
    OR node_download_url LIKE '%/testnet-v0.1.3/%'
    OR node_download_url LIKE '%/testnet-v0.1.4/%'
    OR node_download_url LIKE '%/testnet-v0.1.5/%'
    OR node_download_url LIKE '%/testnet-v0.1.6/%'
    OR node_download_url LIKE '%/testnet-v0.1.7/%'
    OR node_download_url LIKE '%/testnet-v0.1.8/%'
    OR node_download_url LIKE '%/testnet-v0.1.9/%'
  );
