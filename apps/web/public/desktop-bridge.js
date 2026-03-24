/**
 * When the app runs inside Tauri 2, __TAURI__ is injected. This script runs early
 * and exposes window.desktopAPI — invoke handlers live in apps/tauri/src-tauri.
 */
(function () {
  if (typeof window === 'undefined' || typeof window.__TAURI__ === 'undefined') return;
  var core = window.__TAURI__.core;
  var invoke = function (cmd, args) {
    return core.invoke(cmd, args || {});
  };

  window.desktopAPI = {
    isDesktop: true,
    platform: navigator.platform || '',
    versions: {},
    getAutoUpdateEnabled: function () { return invoke('get_auto_update_enabled'); },
    setAutoUpdateEnabled: function (enabled) { return invoke('set_auto_update_enabled', { enabled: !!enabled }); },
    getAppVersion: function () { return invoke('get_app_version'); },
    reload: function () { return invoke('reload'); },
    checkForUpdates: function () { return invoke('check_for_updates'); },
    getUpdateDownloaded: function () { return invoke('get_update_downloaded'); },
    getUpdateAvailableInfo: function () { return invoke('get_update_available_info'); },
    openExternal: function (url) { return invoke('open_external', { url: url }); },
    quitAndInstall: function () { return invoke('quit_and_install'); },
    installUpdateNow: function () { return invoke('install_update_now'); },
    onUpdateDownloaded: function (cb) { /* Tauri events: stub for now */ return function () {}; },
    onUpdateAvailable: function (cb) { return function () {}; },
    onUpdateProgress: function (cb) { return function () {}; },
    startRealMining: function (opts) { return invoke('start_real_mining', opts); },
    stopRealMining: function (networkId, environment) { return invoke('stop_real_mining', { network_id: networkId, environment: environment }); },
    getRealMiningStats: function (networkId, environment) { return invoke('get_real_mining_stats', { network_id: networkId, environment: environment }); },
    isRealMining: function (networkId, environment) { return invoke('is_real_mining', { network_id: networkId, environment: environment }); },
    onMinerDownloadProgress: function (cb) { return function () {}; },
    startNode: function (opts) { return invoke('start_node', opts); },
    stopNode: function (networkId, environment) { return invoke('stop_node', { network_id: networkId, environment: environment }); },
    getNodeStatus: function (networkId, environment) { return invoke('get_node_status', { network_id: networkId, environment: environment }); },
    isNodeRunning: function (networkId, environment) { return invoke('is_node_running', { network_id: networkId, environment: environment }); },
    onNodeDownloadProgress: function (cb) { return function () {}; }
  };
})();
