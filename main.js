const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const si = require('systeminformation');

let controlCenterWin = null;
let secondaryHudWin = null;
let statsInterval = null;

// Config file path
const configPath = path.join(app.getPath('userData'), 'multiscreen-config.json');

// Default initial settings
function loadConfig() {
  const defaultVideo = 'C:\\Users\\lamha\\Downloads\\Girl Behind Curtains Wallpaper 4K __ Anime Girl Reveal Live Wallpaper _ For android phone_2160p60.mp4';
  const defaults = {
    targetMonitorId: 1,
    videoPath: fs.existsSync(defaultVideo) ? defaultVideo : '',
    videoMuted: true,
    videoVolume: 0.5,
    videoSpeed: 1.0,
    videoFit: 'cover',
    videoOverlayOpacity: 0.35,
    targetFps: 60,
    alwaysOnTop: true,
    activeWidgets: [
      'fish-tank',
      'ios-clock',
      'system-telemetry',
      'ios-weather',
      'dynamic-music',
      'arch-waybar-status',
      'macro-deck',
      'model-rotator'
    ],
    widgetSizes: {
      'fish-tank': 'large',
      'ios-clock': 'medium',
      'system-telemetry': 'medium',
      'ios-weather': 'medium',
      'dynamic-music': 'medium',
      'arch-waybar-status': 'compact',
      'macro-deck': 'medium',
      'model-rotator': 'compact'
    },
    activeAiModel: 'Gemini 2.0 Flash',
    activeCreatureModel: 'Nemo the Clownfish',
    rotationStrategy: 'round_robin',
    rotationInterval: 300,
  };

  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return { ...defaults, ...data };
    }
  } catch (err) {
    console.error('Error loading config:', err);
  }
  return defaults;
}

let appConfig = loadConfig();

function saveConfig(newConfig) {
  appConfig = { ...appConfig, ...newConfig };
  try {
    fs.writeFileSync(configPath, JSON.stringify(appConfig, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving config:', err);
  }
}

// 1. Create Control Center Window (Primary Monitor)
function createControlCenterWindow() {
  controlCenterWin = new BrowserWindow({
    width: 1040,
    height: 760,
    minWidth: 840,
    minHeight: 600,
    backgroundColor: '#070a12',
    title: 'Multiscreen Tool - Control Center',
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  controlCenterWin.loadFile('control-center.html');

  controlCenterWin.on('closed', () => {
    controlCenterWin = null;
    if (!secondaryHudWin) app.quit();
  });
}

// 2. Create Secondary Screen HUD Window (Target Monitor)
function createSecondaryHudWindow(monitorIndex, alwaysOnTop = true) {
  const displays = screen.getAllDisplays();
  const targetDisplay = (monitorIndex >= 0 && monitorIndex < displays.length)
    ? displays[monitorIndex]
    : (displays.find(d => d.id !== screen.getPrimaryDisplay().id) || displays[0]);

  if (secondaryHudWin) {
    secondaryHudWin.close();
  }

  const { x, y, width, height } = targetDisplay.bounds;

  secondaryHudWin = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    transparent: false,
    backgroundColor: '#050811',
    alwaysOnTop: alwaysOnTop,
    skipTaskbar: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  secondaryHudWin.loadFile('secondary-hud.html');

  secondaryHudWin.on('closed', () => {
    secondaryHudWin = null;
  });
}

// Telemetry Poller Loop
async function collectSystemStats() {
  try {
    const [cpuLoad, mem, fsSize, netStats, currentLoad] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.cpuCurrentSpeed(),
    ]);

    const net = netStats && netStats[0] ? netStats[0] : { rx_sec: 0, tx_sec: 0 };
    const primaryDisk = fsSize && fsSize[0] ? fsSize[0] : { mount: 'C:', use: 45, size: 250 * 1e9, used: 110 * 1e9 };

    return {
      cpu: {
        usagePercent: Math.round(cpuLoad.currentLoad),
        cores: cpuLoad.cpus ? cpuLoad.cpus.map(c => Math.round(c.load)) : [],
        speedGhz: currentLoad.avg ? currentLoad.avg.toFixed(2) : '3.60',
      },
      memory: {
        usedGb: (mem.used / 1073741824).toFixed(1),
        totalGb: (mem.total / 1073741824).toFixed(1),
        percent: Math.round((mem.used / mem.total) * 100),
      },
      disk: {
        mount: primaryDisk.mount,
        percent: Math.round(primaryDisk.use),
        usedGb: (primaryDisk.used / 1073741824).toFixed(1),
        totalGb: (primaryDisk.size / 1073741824).toFixed(1),
      },
      network: {
        downloadKb: Math.round((net.rx_sec || 0) / 1024),
        uploadKb: Math.round((net.tx_sec || 0) / 1024),
      },
    };
  } catch (err) {
    return {
      cpu: { usagePercent: 24, cores: [20, 25, 30, 22], speedGhz: '3.70' },
      memory: { usedGb: '8.4', totalGb: '16.0', percent: 52 },
      disk: { mount: 'C:', percent: 45, usedGb: '105', totalGb: '232' },
      network: { downloadKb: 124, uploadKb: 45 },
    };
  }
}

function startTelemetryBroadcast() {
  if (statsInterval) clearInterval(statsInterval);
  statsInterval = setInterval(async () => {
    const stats = await collectSystemStats();
    if (secondaryHudWin && !secondaryHudWin.isDestroyed()) {
      secondaryHudWin.webContents.send('telemetry-update', stats);
    }
    if (controlCenterWin && !controlCenterWin.isDestroyed()) {
      controlCenterWin.webContents.send('telemetry-update', stats);
    }
  }, 1000);
}

// Scan local videos in Downloads and Videos
function scanLocalVideos() {
  const dirs = [
    path.join(app.getPath('home'), 'Downloads'),
    path.join(app.getPath('home'), 'Videos'),
  ];
  const validExts = ['.mp4', '.webm', '.mkv', '.mov'];
  const results = [];

  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const ext = path.extname(file).toLowerCase();
          if (validExts.includes(ext)) {
            const fullPath = path.join(dir, file);
            try {
              const stat = fs.statSync(fullPath);
              results.push({
                name: file,
                path: fullPath,
                sizeMb: (stat.size / 1048576).toFixed(1),
              });
            } catch (_) {}
          }
        }
      } catch (_) {}
    }
  }
  return results;
}

// IPC Handlers
ipcMain.handle('get-monitors', () => {
  const primaryId = screen.getPrimaryDisplay().id;
  return screen.getAllDisplays().map((d, index) => {
    const isPrimary = d.id === primaryId;
    const isPortrait = d.bounds.height > d.bounds.width;
    return {
      index,
      id: d.id,
      name: `Display ${index + 1}`,
      x: d.bounds.x,
      y: d.bounds.y,
      width: d.bounds.width,
      height: d.bounds.height,
      isPrimary,
      orientation: isPortrait ? 'Portrait' : 'Landscape',
      relativePosition: isPrimary ? 'Primary (Center)' : (d.bounds.x < 0 ? 'Left of Main' : 'Right of Main'),
    };
  });
});

ipcMain.handle('get-config', () => appConfig);

ipcMain.handle('save-config', (event, newConfig) => {
  saveConfig(newConfig);
  // Broadcast wallpaper/widget changes to secondary window
  if (secondaryHudWin && !secondaryHudWin.isDestroyed()) {
    secondaryHudWin.webContents.send('config-updated', appConfig);
  }
  return appConfig;
});

ipcMain.handle('scan-videos', () => scanLocalVideos());

ipcMain.handle('launch-secondary', (event, { monitorIndex, alwaysOnTop }) => {
  createSecondaryHudWindow(monitorIndex, alwaysOnTop);
  return { success: true };
});

ipcMain.handle('toggle-fullscreen-hud', () => {
  if (secondaryHudWin && !secondaryHudWin.isDestroyed()) {
    const isFull = secondaryHudWin.isFullScreen();
    secondaryHudWin.setFullScreen(!isFull);
    return !isFull;
  }
  return false;
});

// App Lifecycle
app.whenReady().then(() => {
  createControlCenterWindow();
  startTelemetryBroadcast();

  // If user has a secondary monitor, auto-launch the Secondary HUD on it!
  const displays = screen.getAllDisplays();
  if (displays.length > 1) {
    const secondaryIdx = displays.findIndex(d => d.id !== screen.getPrimaryDisplay().id);
    if (secondaryIdx !== -1) {
      createSecondaryHudWindow(secondaryIdx, appConfig.alwaysOnTop);
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createControlCenterWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
