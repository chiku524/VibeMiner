-- Bump Boing testnet node zips to testnet-v0.1.9 (DEX discovery RPC + current main; matches @vibeminer/shared + boing.network Workers).
-- Zip SHA256: GitHub release asset digest for testnet-v0.1.9.

UPDATE network_listings
SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.9/release-windows-x86_64.zip',
  node_binary_sha256 = '0e5c9d42a603dbaf4471feb4ea367f89146bd21b11dde4b5b70cc430997fff37'
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
  );

UPDATE network_listings
SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.9/release-linux-x86_64.zip',
  node_binary_sha256 = '037807bd7cf57b1049d82739f764567f1ea55bb6852b6680917e833c865e6514'
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
  );

UPDATE network_listings
SET
  node_download_url = 'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.9/release-macos-aarch64.zip',
  node_binary_sha256 = 'a5830f7d492917cb830a7d7a69e254fff382c038fa6a97cb26d60ed67ea1dc8b'
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
  );
