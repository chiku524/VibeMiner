# VaultL1 in VibeMiner desktop

Boing-style one-click: **select node type → Run**. VibeMiner downloads the official `vaultd` zip for your OS from the **public VibeMiner rehost** release (private vaultl1 source), then starts the role you chose.

## Binary pin

| | |
|--|--|
| **Tag** | `vaultl1-bin-v0.6.3` |
| **Code** | `VAULTL1_DEFAULT_DOWNLOAD_TAG` in `packages/shared/src/vaultl1-node.ts` |
| **Source** | [vaultl1 v0.6.3](https://github.com/chiku524/vaultl1/releases/tag/v0.6.3) |
| **Rehost** | [VibeMiner vaultl1-bin-v0.6.3](https://github.com/chiku524/VibeMiner/releases/tag/vaultl1-bin-v0.6.3) |

Publishing a `vaultl1-bin-*` tag must **not** run the desktop installer workflow. That job only listens for `v1.2.3`-style tags (`v[0-9]*`).

### Chain features in this pin

- `storage/CloseDeal` — owner closes deals; frees provider / plan capacity  
- `access/GrantAccess` with `key_wrap` / `name_hint` / `grantee_pub`  
- `access/RevokeAccess` — clears wrap after revoke  
- REST `GET /vaultl1/access/grants?grantee=` / `?owner=` / `?cid=`
- Hybrid blocks — propose when a tx arrives; empty heartbeat every 30s  
- Two-validator unstick — slim state clone + P2P keepalive  
- REST faucet `GET/POST /vaultl1/faucet` (default key `alice`)  
- Explorer history `GET /vaultl1/blocks`, `/vaultl1/txs/{hash}`, `/vaultl1/bank/accounts`
- Light headers + bank Merkle proofs vs `app_hash`
- P2P hello version (a 0.5.x binary is dropped by 0.6.x)
- `vaultd query net --peer` to compare two validators

Encrypted file CRUD + share UI lives in **[vaultl1-web](https://github.com/chiku524/vaultl1-web)** (points REST at your node `:1317`). Devnet faucet: **[vaultl1-explorer](https://vaultl1-explorer.vercel.app/#/faucet)**. VibeMiner is the **node launcher**.

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

## Upgrading from vaultl1-bin-v0.6.2

1. Stop both validators.
2. Start again so the app pulls **v0.6.3** (or set `VIBEMINER_VAULTD_EXE` to a v0.6.3 binary). No re-genesis.
3. This pin drops mempool txs that cannot apply, so a stuck proof cannot spam empty LAN blocks.

## Upgrading from vaultl1-bin-v0.5.3

1. Install/update VibeMiner with this pin (or run desktop from this repo).
2. Stop both validators.
3. **Re-genesis.** v0.6.0 changed `app_hash`. Old `vault-net-1` homes from v0.5.x will not agree with this pin. Delete the node data dirs (or pick fresh homes) and run PC B identity → PC A genesis → PC B import again.
4. Start again so the app pulls **v0.6.3** binaries (or clear the old zip under the app nodes download cache).
5. Both PCs must run the same pin. Confirm with `vaultd query net --peer http://OTHER:1317`.
