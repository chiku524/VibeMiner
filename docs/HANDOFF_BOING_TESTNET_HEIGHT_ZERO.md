# Handoff pointer: Boing testnet height 0 (from PudgyMon)

Full write-up lives in the sibling Boing repo (same Cursor multi-root workspace):

**[`../boing.network/docs/HANDOFF_TESTNET_HEIGHT_ZERO_AND_VIBEMINER_PEERING.md`](../../boing.network/docs/HANDOFF_TESTNET_HEIGHT_ZERO_AND_VIBEMINER_PEERING.md)**

**TL;DR for VibeMiner:** this PC’s Boing full node on `:8545` reports ready but **`boing_chainHeight` stays 0**; bootnode `73.84.106.121:4001` is unreachable; faucet “succeeds” but balance stays 0. Two-PC (full node + remote validator) needs working peering / custom bootnodes and better height/peer health UX. Operator is stopping both nodes while fixes are applied.

**Product fixes applied (this session):** custom bootnodes UI + local tip height in node status (`NODE_RUNNING.md`). Ops still must restore a live bootnode / advancing tip.
