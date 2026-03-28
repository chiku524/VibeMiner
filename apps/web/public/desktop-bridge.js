/**
 * When the app runs inside Tauri 2, __TAURI__ is injected. It can appear slightly after
 * parser-created scripts in <head>, so we poll briefly then expose window.desktopAPI.
 */
(function () {
  if (typeof window === 'undefined') return;

  function buildDesktopApi() {
    var core = window.__TAURI__.core;
    var invoke = function (cmd, args) {
      return core.invoke(cmd, args || {});
    };

    window.desktopAPI = {
      isDesktop: true,
      platform: navigator.platform || '',
      versions: {},
      getAutoUpdateEnabled: function () {
        return invoke('get_auto_update_enabled');
      },
      setAutoUpdateEnabled: function (enabled) {
        return invoke('set_auto_update_enabled', { enabled: !!enabled });
      },
      getAppVersion: function () {
        return invoke('get_app_version');
      },
      getPlatform: function () {
        return invoke('get_platform');
      },
      reload: function () {
        return invoke('reload');
      },
      checkForUpdates: function () {
        return invoke('check_for_updates');
      },
      getUpdateDownloaded: function () {
        return invoke('get_update_downloaded');
      },
      getUpdateAvailableInfo: function () {
        return invoke('get_update_available_info');
      },
      openExternal: function (url) {
        return invoke('open_external', { url: url });
      },
      quitAndInstall: function () {
        return invoke('quit_and_install');
      },
      installUpdateNow: function () {
        return invoke('install_update_now');
      },
      onUpdateDownloaded: function (cb) {
        return function () {};
      },
      onUpdateAvailable: function (cb) {
        return function () {};
      },
      onUpdateProgress: function (cb) {
        return function () {};
      },
      startRealMining: function (opts) {
        // Tauri 2: command args must use the Rust parameter name (`opts`).
        return invoke('start_real_mining', { opts: opts });
      },
      stopRealMining: function (networkId, environment) {
        return invoke('stop_real_mining', { network_id: networkId, environment: environment });
      },
      getRealMiningStats: function (networkId, environment) {
        return invoke('get_real_mining_stats', { network_id: networkId, environment: environment });
      },
      isRealMining: function (networkId, environment) {
        return invoke('is_real_mining', { network_id: networkId, environment: environment });
      },
      onMinerDownloadProgress: function (cb) {
        return function () {};
      },
      startNode: function (opts) {
        return invoke('start_node', { opts: opts });
      },
      stopNode: function (networkId, environment, nodePresetId) {
        return invoke('stop_node', {
          network_id: networkId,
          environment: environment,
          node_preset_id: nodePresetId != null && nodePresetId !== '' ? nodePresetId : null,
        });
      },
      getNodeStatus: function (networkId, environment, nodePresetId) {
        return invoke('get_node_status', {
          network_id: networkId,
          environment: environment,
          node_preset_id: nodePresetId != null && nodePresetId !== '' ? nodePresetId : null,
        });
      },
      isNodeRunning: function (networkId, environment, nodePresetId) {
        return invoke('is_node_running', {
          network_id: networkId,
          environment: environment,
          node_preset_id: nodePresetId != null && nodePresetId !== '' ? nodePresetId : null,
        });
      },
      listRunningNodes: function () {
        return invoke('list_running_nodes', {});
      },
      onNodeDownloadProgress: function (cb) {
        return function () {};
      },
    };

    try {
      window.dispatchEvent(new Event('vibeminer-tauri-ready'));
    } catch (e) {
      void 0;
    }
    return true;
  }

  function tryInit() {
    if (typeof window.__TAURI__ === 'undefined' || !window.__TAURI__.core) return false;
    if (window.desktopAPI && window.desktopAPI.isDesktop) return true;
    return buildDesktopApi();
  }

  if (tryInit()) return;

  var attempts = 0;
  var maxAttempts = 400;
  var id = setInterval(function () {
    if (tryInit() || ++attempts >= maxAttempts) clearInterval(id);
  }, 10);
})();
