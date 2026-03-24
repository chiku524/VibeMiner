/**
 * Tauri injects __TAURI__; public/desktop-bridge.js maps invoke() commands to window.desktopAPI.
 */
export {};

type DesktopUpdatePhase = 'downloading' | 'installing';

type DesktopUpdateAvailableInfo = {
  latestVersion: string;
  releasePageUrl: string;
  directDownloadUrl: string;
};

declare global {
  interface Window {
    /** Tauri desktop shell: IPC surface for settings, mining, nodes, updates. */
    desktopAPI?: {
      isDesktop?: boolean;
      platform?: string;
      versions?: Record<string, string>;
      getAutoUpdateEnabled: () => Promise<boolean>;
      setAutoUpdateEnabled: (enabled: boolean) => Promise<boolean>;
      getAppVersion: () => Promise<string>;
      reload?: () => Promise<void>;
      checkForUpdates?: () => Promise<{
        updateAvailable: boolean;
        latestVersion?: string | null;
        releasePageUrl?: string;
        directDownloadUrl?: string;
        error?: boolean;
        message?: string;
      }>;
      getUpdateDownloaded?: () => Promise<boolean>;
      getUpdateAvailableInfo?: () => Promise<DesktopUpdateAvailableInfo | null>;
      openExternal?: (url: string) => Promise<void>;
      quitAndInstall?: () => Promise<void>;
      installUpdateNow?: () => Promise<{ ok: boolean; error?: string }>;
      onUpdateDownloaded?: (callback: () => void) => void;
      onUpdateAvailable?: (callback: (info: DesktopUpdateAvailableInfo) => void) => void;
      onUpdateProgress?: (
        callback: (payload: { phase: DesktopUpdatePhase }) => void
      ) => void | (() => void);
      startRealMining?: (opts: {
        network: {
          id: string;
          poolUrl: string;
          poolPort: number;
          algorithm?: string;
          environment?: string;
        };
        walletAddress: string;
      }) => Promise<{ ok: boolean; error?: string }>;
      stopRealMining?: (networkId: string, environment: string) => void;
      getRealMiningStats?: (
        networkId: string,
        environment: string
      ) => Promise<{ hashrate: number; shares: number } | null>;
      isRealMining?: (networkId: string, environment: string) => Promise<boolean>;
      startNode?: (opts: { network: Record<string, unknown> }) => Promise<{ ok: boolean; error?: string }>;
      stopNode?: (networkId: string, environment: string) => void;
      getNodeStatus?: (
        networkId: string,
        environment: string
      ) => Promise<{ status?: string; isActive?: boolean } | null>;
      isNodeRunning?: (networkId: string, environment: string) => Promise<boolean>;
      onMinerDownloadProgress?: (cb: unknown) => () => void;
      onNodeDownloadProgress?: (cb: unknown) => () => void;
    };
  }
}
