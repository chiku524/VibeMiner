'use client';

import Link from 'next/link';
import { useDesktopCheck } from '@/hooks/useIsDesktop';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BrandMark } from '@/components/BrandMark';

export default function LicensesPage() {
  const { isDesktop, hasChecked } = useDesktopCheck();

  return (
    <>
      {hasChecked && !isDesktop && (
        <header className="sticky top-0 z-10 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/home" className="flex items-center gap-2 font-display text-lg font-semibold">
              <BrandMark className="h-6 w-6 shrink-0" />
              <span className="bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">
                VibeMiner
              </span>
            </Link>
            <Link href="/home" className="text-sm text-gray-400 transition hover:text-white">← Back home</Link>
          </div>
        </header>
      )}

      <main className={`min-h-screen bg-surface-950 bg-grid ${hasChecked && !isDesktop ? 'pt-14' : 'pt-6'}`}>
        <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-8 sm:px-6">
          <Breadcrumbs
            crumbs={[
              { label: 'Home', href: '/home' },
              { label: 'Licenses' },
            ]}
          />
          <h1 className="mt-6 font-display text-2xl font-bold sm:text-3xl">Licenses</h1>
          <p className="mt-1 text-gray-400">
            Open-source and third-party software used by VibeMiner.
          </p>

          <div className="mt-10 space-y-10">
            <section className="rounded-xl border border-white/10 bg-surface-900/30 p-6">
              <h2 className="font-display text-lg font-semibold text-white">VibeMiner</h2>
              <p className="mt-2 text-sm text-gray-400">
                The VibeMiner application (UI, logic, and integration code) is developed by VibeMiner contributors.
                See the project repository for license terms.
              </p>
              <a
                href="https://github.com/chiku524/VibeMiner"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-accent-cyan hover:underline"
              >
                github.com/chiku524/VibeMiner →
              </a>
            </section>

            <section className="rounded-xl border border-white/10 bg-surface-900/30 p-6">
              <h2 className="font-display text-lg font-semibold text-white">Third-party software</h2>

              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="font-medium text-white">XMRig</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    VibeMiner bundles <strong>XMRig</strong> for CPU mining (Monero, Raptoreum). XMRig is licensed under the{' '}
                    <strong>GNU General Public License v3.0 (GPL-3.0)</strong>.
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-400">
                    <li>
                      <strong>Source code:</strong>{' '}
                      <a
                        href="https://github.com/xmrig/xmrig"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-cyan hover:underline"
                      >
                        github.com/xmrig/xmrig
                      </a>
                    </li>
                    <li><strong>License:</strong> GPL-3.0</li>
                    <li><strong>Copyright:</strong> XMRig project and contributors</li>
                  </ul>
                  <p className="mt-2 text-xs text-gray-500">
                    VibeMiner distributes the unmodified official XMRig release. The GPL-3.0 text is included with
                    the desktop distribution alongside third-party miner components.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-surface-900/30 p-6">
              <h2 className="font-display text-lg font-semibold text-white">GNU General Public License v3.0</h2>
              <p className="mt-2 text-sm text-gray-400">
                The full GPL-3.0 license text is available from the Free Software Foundation:
              </p>
              <a
                href="https://www.gnu.org/licenses/gpl-3.0.html"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-accent-cyan hover:underline"
              >
                gnu.org/licenses/gpl-3.0.html →
              </a>
            </section>
          </div>

          <p className="mt-12 text-center text-xs text-gray-500">
            <Link href="/home" className="text-accent-cyan hover:underline">
              ← Back to VibeMiner
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
