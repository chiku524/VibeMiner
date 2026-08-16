# VaultL1 in VibeMiner desktop

Boing-style one-click: **select node type → Run**. VibeMiner downloads the official `vaultd` zip for your OS from the **public VibeMiner rehost** release (private vaultl1 source), then starts the role you chose.

## Binary pin

| | |
|--|--|
| **Tag** | `vaultl1-bin-v0.5.2` |
| **Code** | `VAULTL1_DEFAULT_DOWNLOAD_TAG` in `packages/shared/src/vaultl1-node.ts` |
| **Source** | [vaultl1 v0.5.2](https://github.com/chiku524/vaultl1/releases/tag/v0.5.2) |
| **Rehost** | [VibeMiner vaultl1-bin-v0.5.2](https://github.com/chiku524/VibeMiner/releases/tag/vaultl1-bin-v0.5.2) |

### Chain features in this pin

- `storage/CloseDeal` — owner closes deals; frees provider / plan capacity  
- `access/GrantAccess` with `key_wrap` / `name_hint` / `grantee_pub`  
- `access/RevokeAccess` — clears wrap after revoke  
- REST `GET /vaultl1/access/grants?grantee=` / `?owner=` / `?cid=`
- Hybrid blocks — propose when a tx arrives; empty heartbeat every 30s  
- Two-validator unstick — slim state clone + P2P keepalive

Encrypted file CRUD + share UI lives in **[vaultl1-web](https://github.com/chiku524/vaultl1-web)** (points REST at your node `:1317`). VibeMiner is the **node launcher**.

## Node types (presets)

| Type | Use when |
|------|----------|
| **LAN PC A (coordinator)** | First machine on the network — builds shared genesis after you paste B’s identity |
| **LAN PC B (joiner)** | Second machine — reveal identity for A, then import genesis and peer A |
| **Local dual — node A / B** | Two processes on **one** computer (smoke / lab) |

Default pick per OS: **LAN PC A**.

## Binary download

Zips include SHA-256 pins in shared code. First start after an upgrade re-downloads from the new tag.

Optional override (skips download), same idea as Boing:

```powershell
$env:VIBEMINER_VAULTD_EXE = "C:\Users\chiku\Projects\vaultl1\build\vaultd.exe"
```

Helper script (prefers `Projects\vaultl1\build`):

```powershell
. .\scripts\run-vibeminer-with-vaultl1.ps1
npm run desktop
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

## Upgrading from vaultl1-bin-v0.5.1

1. Install/update VibeMiner with this pin (or run desktop from this repo).
2. Stop both validators.
3. Start again so the app pulls **v0.5.2** binaries (or clear the old zip under the app nodes download cache).
4. Existing `vault-net-1` homes keep working. Both PCs must run the same pin so empty-block heartbeat and P2P keepalive match.
