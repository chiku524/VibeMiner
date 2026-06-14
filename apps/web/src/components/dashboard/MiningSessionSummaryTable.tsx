'use client';

import type { BlockchainNetwork, MiningSessionMining } from '@vibeminer/shared';
import { sessionListKey } from '@vibeminer/shared';

type SessionRow = {
  session: MiningSessionMining;
  network: BlockchainNetwork;
};

type MiningSessionSummaryTableProps = {
  rows: SessionRow[];
  formatDuration: (ms: number) => string;
};

export function MiningSessionSummaryTable({ rows, formatDuration }: MiningSessionSummaryTableProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mt-4 space-y-3 sm:hidden">
        {rows.map(({ session, network }) => {
          const elapsed = session.startedAt ? Date.now() - session.startedAt : 0;
          return (
            <div
              key={sessionListKey(session)}
              className="rounded-xl border border-white/10 bg-surface-900/50 p-4"
            >
              <p className="font-medium text-white">{network.name}</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-xs text-gray-500">Hashrate</dt>
                  <dd className="font-mono text-accent-cyan">{session.hashrate} H/s</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Shares</dt>
                  <dd className="font-mono text-gray-300">{session.shares}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Est. earnings</dt>
                  <dd className="font-mono text-accent-emerald">
                    {session.estimatedEarnings} {network.symbol}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Uptime</dt>
                  <dd className="font-mono text-gray-400">{formatDuration(elapsed)}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>

      <div className="mt-4 hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-gray-500">
              <th className="pb-2 pr-3 font-medium">Network</th>
              <th className="pb-2 pr-3 font-medium">Hashrate</th>
              <th className="pb-2 pr-3 font-medium">Shares</th>
              <th className="pb-2 pr-3 font-medium">Est. earnings</th>
              <th className="pb-2 font-medium">Uptime</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ session, network }) => {
              const elapsed = session.startedAt ? Date.now() - session.startedAt : 0;
              return (
                <tr key={sessionListKey(session)} className="border-b border-white/5">
                  <td className="py-2.5 pr-3 font-medium text-white">{network.name}</td>
                  <td className="py-2.5 pr-3 font-mono text-accent-cyan">{session.hashrate} H/s</td>
                  <td className="py-2.5 pr-3 font-mono text-gray-300">{session.shares}</td>
                  <td className="py-2.5 pr-3 font-mono text-accent-emerald">
                    {session.estimatedEarnings} {network.symbol}
                  </td>
                  <td className="py-2.5 font-mono text-gray-400">{formatDuration(elapsed)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
