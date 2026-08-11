# VaultL1 in VibeMiner desktop

Boing-style one-click: **select node type → Run**. VibeMiner downloads the official `vaultd` zip for your OS from [vaultl1 releases](https://github.com/chiku524/vaultl1/releases), then starts the role you chose.

## Node types (presets)

| Type | Use when |
|------|----------|
| **LAN PC A (coordinator)** | First machine on the network — builds shared genesis after you paste B’s identity |
| **LAN PC B (joiner)** | Second machine — reveal identity for A, then import genesis and peer A |
| **Local dual — node A / B** | Two processes on **one** computer (smoke / lab) |

Default pick per OS: **LAN PC A**.

## Binary download

Pinned public assets: VibeMiner release tag `vaultl1-bin-v0.5.0` (see `VAULTL1_DEFAULT_DOWNLOAD_TAG` in `packages/shared/src/vaultl1-node.ts`). Source builds can come from vaultl1; the desktop must use a **public** zip URL.

Optional override (skips download), same idea as Boing:

```powershell
$env:VIBEMINER_VAULTD_EXE = "C:\path\to\vaultd.exe"
```

## LAN two PCs

1. **PC B** — Run nodes → VaultL1 → **LAN PC B** for your OS. Leave genesis empty → Run (downloads vaultd). Copy `address=` / `pubkey=` from the message.
2. **PC A** — **LAN PC A**. Fill B’s LAN IP + address + pubkey → Run.
3. **PC B** — Paste path or JSON of `genesis-shared.json` from A, set A’s LAN IP → Run again.
4. Both stay online; firewall **TCP 26656**.

Ports: P2P `26656`, RPC `26657`, REST `1317`.

## Same PC (local dual)

1. **Local dual — node A** (then **node B**).  
2. Node B uses alt ports: P2P `26666`, RPC `26667`, REST `1327`.

## Never share private keys

Only exchange **address + pubkey** and **genesis-shared.json**.
