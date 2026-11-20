const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getMonitors: () => ipcRenderer.invoke('get-monitors'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (cfg) => ipcRenderer.invoke('save-config', cfg),
  scanVideos: () => ipcRenderer.invoke('scan-videos'),
  launchSecondary: (options) => ipcRenderer.invoke('launch-secondary', options),
  toggleFullscreenHud: () => ipcRenderer.invoke('toggle-fullscreen-hud'),
  onTelemetry: (callback) => {
    ipcRenderer.on('telemetry-update', (event, data) => callback(data));
  },
  onConfigUpdated: (callback) => {
    ipcRenderer.on('config-updated', (event, data) => callback(data));
  },
});
