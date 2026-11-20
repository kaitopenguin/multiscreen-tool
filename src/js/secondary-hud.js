/**
 * SECONDARY HUD RENDERER LOGIC
 * Coordinates the vertical-optimized Bento Grid, Fish Friend companion, Video Wallpaper,
 * and live hardware telemetry on the secondary display.
 */

document.addEventListener('DOMContentLoaded', async () => {
  let config = {};
  try {
    config = await window.api.getConfig();
  } catch (err) {
    console.error('Config fetch error:', err);
  }

  // 1. Initialize Widget Manager with selected widgets
  const widgetContainer = document.getElementById('bento-widget-container');
  const widgetMgr = new WidgetManager({
    container: widgetContainer,
    activeWidgets: config.activeWidgets || [
      'fish-tank',
      'ios-clock',
      'system-telemetry',
      'ios-weather',
      'dynamic-music',
      'arch-waybar-status',
      'macro-deck',
      'model-rotator',
    ],
    widgetSizes: config.widgetSizes || {},
    onChanged: async (activeList, sizes) => {
      config.activeWidgets = activeList;
      config.widgetSizes = sizes;
      await window.api.saveConfig(config);
    },
  });
  widgetMgr.render();

  // Set initial fish companion if present
  if (window.fishTankInstance && config.activeCreatureModel) {
    window.fishTankInstance.setCompanion(config.activeCreatureModel);
    const nameLabel = document.getElementById('fish-friend-name');
    if (nameLabel) {
      if (config.activeCreatureModel === 'koi') nameLabel.textContent = 'Kohaku Japanese Koi';
      else if (config.activeCreatureModel === 'axolotl') nameLabel.textContent = 'Lottie Pink Axolotl';
      else nameLabel.textContent = 'Nemo the Clownfish';
    }
  }

  // 2. Video Wallpaper Setup
  const videoEl = document.getElementById('bg-video');
  const overlayEl = document.getElementById('bg-overlay');

  function applyWallpaper(cfg) {
    if (!videoEl || !cfg) return;

    if (cfg.videoPath) {
      videoEl.style.display = 'block';
      const fileUrl = `file:///${cfg.videoPath.replace(/\\/g, '/')}`;
      if (videoEl.src !== fileUrl) {
        videoEl.src = fileUrl;
        videoEl.load();
        videoEl.play().catch(e => console.log('Autoplay handled:', e));
      }
    } else {
      // Fallback deep aquatic gradient
      videoEl.style.display = 'none';
      document.getElementById('bg-video-wrapper').style.background =
        'radial-gradient(circle at 50% 30%, #0d1b2a 0%, #050811 100%)';
    }

    videoEl.muted = cfg.videoMuted !== false;
    videoEl.playbackRate = cfg.videoSpeed || 1.0;
    videoEl.style.objectFit = cfg.videoFit || 'cover';

    if (overlayEl) {
      overlayEl.style.background = `rgba(5, 8, 17, ${cfg.videoOverlayOpacity || 0.42})`;
    }

    const fpsBadge = document.getElementById('badge-fps-val');
    if (fpsBadge) fpsBadge.textContent = `${cfg.targetFps || 60} FPS`;
  }
  applyWallpaper(config);

  // 3. Digital Clock Ticker
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');

    const hmEl = document.getElementById('ios-hours-mins');
    const secEl = document.getElementById('ios-seconds');
    if (hmEl) hmEl.textContent = `${hours}:${mins}`;
    if (secEl) secEl.textContent = `:${secs}`;

    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
    const dateEl = document.getElementById('ios-date-string');
    if (dateEl) dateEl.textContent = dateStr;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 4. Listen to Real-time Telemetry Updates
  window.api.onTelemetry((stats) => {
    // macOS Telemetry Gauges
    const cpuVal = document.getElementById('tel-cpu-val');
    const cpuCircle = document.getElementById('tel-cpu-circle');
    if (cpuVal) cpuVal.textContent = `${stats.cpu.usagePercent}%`;
    if (cpuCircle) {
      const offset = 201 - (201 * Math.min(100, stats.cpu.usagePercent)) / 100;
      cpuCircle.style.strokeDashoffset = offset;
    }

    const memVal = document.getElementById('tel-mem-val');
    const memCircle = document.getElementById('tel-mem-circle');
    if (memVal) memVal.textContent = `${stats.memory.percent}%`;
    if (memCircle) {
      const offset = 201 - (201 * Math.min(100, stats.memory.percent)) / 100;
      memCircle.style.strokeDashoffset = offset;
    }

    const diskVal = document.getElementById('tel-disk-val');
    const diskCircle = document.getElementById('tel-disk-circle');
    if (diskVal) diskVal.textContent = `${stats.disk.percent}%`;
    if (diskCircle) {
      const offset = 201 - (201 * Math.min(100, stats.disk.percent)) / 100;
      diskCircle.style.strokeDashoffset = offset;
    }

    // Arch Linux Waybar Status Pills
    const wbCpu = document.getElementById('wb-cpu');
    const wbMem = document.getElementById('wb-mem');
    const wbNet = document.getElementById('wb-net');
    const wbDisk = document.getElementById('wb-disk');

    if (wbCpu) wbCpu.textContent = `CPU ${stats.cpu.usagePercent}%`;
    if (wbMem) wbMem.textContent = `RAM ${stats.memory.usedGb}G`;
    if (wbNet) wbNet.textContent = `▲${stats.network.uploadKb}K ▼${stats.network.downloadKb}K`;
    if (wbDisk) wbDisk.textContent = `SSD ${stats.disk.percent}%`;
  });

  // 5. Config Sync Listener from Control Center
  window.api.onConfigUpdated((newCfg) => {
    config = newCfg;
    applyWallpaper(newCfg);
    widgetMgr.setWidgets(newCfg.activeWidgets, newCfg.widgetSizes);

    // Companion sync
    if (window.fishTankInstance && newCfg.activeCreatureModel) {
      window.fishTankInstance.setCompanion(newCfg.activeCreatureModel);
      const nameLabel = document.getElementById('fish-friend-name');
      if (nameLabel) {
        if (newCfg.activeCreatureModel === 'koi') nameLabel.textContent = 'Kohaku Japanese Koi';
        else if (newCfg.activeCreatureModel === 'axolotl') nameLabel.textContent = 'Lottie Pink Axolotl';
        else nameLabel.textContent = 'Nemo the Clownfish';
      }
    }

    const modelName = document.getElementById('hud-model-name');
    if (modelName) modelName.textContent = newCfg.activeAiModel || 'Gemini 2.0 Flash';
  });

  // 6. Navigation Buttons
  document.getElementById('btn-edit-widgets').addEventListener('click', () => {
    widgetMgr.toggleEditMode();
  });

  document.getElementById('btn-toggle-fullscreen').addEventListener('click', async () => {
    await window.api.toggleFullscreenHud();
  });
});
