# VaultL1 in VibeMiner desktop

One-click **PC A / PC B** (and same-PC dual) for [VaultL1](https://github.com/chiku524/vaultl1) via the **Run nodes** dashboard entry **VaultL1 (LAN)**.

## Binary

VibeMiner does **not** ship `vaultd`. Build or set the path:

```powershell
# From vaultl1 repo
go build -o build/vaultd.exe ./cmd/vaultd

# Point VibeMiner at it (then start the desktop app from the same shell)
$env:VIBEMINER_VAULTD_EXE = "C:\Users\you\Desktop\Jackal\vaultl1\build\vaultd.exe"
npm run desktop
```

Helpers: `scripts/run-vibeminer-with-vaultl1.ps1` / `.cmd`.

Auto-discovery also checks `~/Desktop/Jackal/vaultl1/build/vaultd(.exe)` and `PATH`.

## LAN two PCs (recommended)

1. **PC B** — Run nodes → VaultL1 → **PC B (LAN joiner)**. Leave genesis empty → run once. Copy `address=` / `pubkey=` from the error/identity panel to PC A.
2. **PC A** — **PC A (LAN coordinator)**. Fill **PC B LAN IP**, address, pubkey → Run. Note `genesis-shared.json` path from success logs / node home.
3. **PC B** — Paste path (or JSON) of `genesis-shared.json`, set **PC A LAN IP**, Run.
4. Both must stay online (equal power → 2/3 quorum). Open **TCP 26656** both ways.

Ports: P2P `26656`, RPC `26657`, REST `1317`.

## Same PC (local dual)

1. Start **Local dual — node A**
2. Start **Local dual — node B** (A prepares shared genesis + B keys under the app node cache)

Node B uses alt ports: P2P `26666`, RPC `26667`, REST `1327`.

## Never share private keys

Only exchange **address + pubkey** and **genesis-shared.json**. Each machine keeps its own keyring under the app data dir (`nodes/…`).
