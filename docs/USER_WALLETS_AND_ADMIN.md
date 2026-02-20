# User wallets and admin

## User in-platform wallets

Each **miner account** has an in-platform balance per network:

- **miner_balances** table: `user_id`, `network_id`, `environment`, `balance_raw`, `currency`, `updated_at`.
- Mining rewards are credited to these balances (when pool integration is wired).
- When a miner **withdraws to their own external wallet**, they request a payout from their in-platform balance; a **withdrawal fee** (see [Fees](/fees)) is applied and the rest is sent to their address. The fee goes to the platform wallet.

So: **each user effectively has their own user wallet within the platform** (per network). They receive rewards there and pay a fee when withdrawing to an external wallet.

## Platform wallet and fees

- **Listing fees** (mainnet network registration) and **withdrawal fees** (miner payouts) are sent to the **platform wallet** (addresses on /fees and in the admin dashboard).
- The app **does not store or use seed phrases or private keys**. Deposit and withdrawal of funds from the platform wallet is done by you via your wallet app or exchange (e.g. Coinbase Wallet) — not inside the app.

## Admin account

- **Admin** is a role: any user whose `user_id` is listed in the **admin_users** table can access the **admin dashboard** at `/dashboard/admin`.
- To make yourself admin after signing up:
  1. Get your user id (e.g. from the session API or DB).
  2. Run: `insert into admin_users (user_id) values ('<your-user-id>');`
  3. Sign in again (or refresh); you’ll see **Admin** in the nav and can open the admin dashboard.

The admin dashboard shows platform stats (user count, network listings) and the platform wallet addresses. Further controls (user list, fee reports, etc.) can be added there. Admin does **not** require storing a seed or private key in the app.
