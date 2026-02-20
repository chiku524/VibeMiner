-- Migration: admin role + in-platform miner balances
-- Run after schema.sql on existing DBs: wrangler d1 execute vibeminer-db --remote --file=./d1/migrations/001_admin_and_miner_balances.sql

create table if not exists admin_users (
  user_id text primary key references users(id) on delete cascade
);

create table if not exists miner_balances (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  network_id text not null,
  environment text not null check (environment in ('mainnet', 'devnet')),
  balance_raw text not null default '0',
  currency text not null,
  updated_at text default (datetime('now')) not null,
  unique(user_id, network_id, environment)
);

create index if not exists idx_miner_balances_user on miner_balances(user_id);
create index if not exists idx_miner_balances_network on miner_balances(network_id, environment);
