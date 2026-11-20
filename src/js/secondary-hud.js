/**
 * SECONDARY HUD - DOCKED SIDEBAR CONTROLLER
 * Supports Arch Linux, Frutiger Aero, Retro CRT, and Modern themes.
 * Zero-lag 60fps rendering, live Waybar status pills, dock-left/dock-right controls.
 */

document.addEventListener('DOMContentLoaded', async () => {
  let config = {};
  try {
    config = await window.api.getConfig();
  } catch (err) {
    console.error('Config fetch error:', err);
  }

  // 1. Theme Initialization
  function applyTheme(themeName) {
    const valid = ['arch', 'frutiger', 'retro', 'modern'];
    const active = valid.includes(themeName) ? themeName : 'arch';
    document.body.className = `theme-${active}`;

    const themeSelect = document.getElementById('hud-theme-select');
    if (themeSelect) themeSelect.value = active;

    const brandTag = document.getElementById('header-brand-tag');
    if (brandTag) {
      if (active === 'arch') brandTag.textContent = 'ARCH // WAYBAR';
      else if (active === 'frutiger') brandTag.textContent = 'FRUTIGER AERO';
      else if (active === 'retro') brandTag.textContent = 'RETRO // CRT';
      else brandTag.textContent = 'MODERN SLATE';
    }
  }
  applyTheme(config.theme || 'arch');

  // Theme Dropdown listener
  const themeSelect = document.getElementById('hud-theme-select');
  if (themeSelect) {
    themeSelect.addEventListener('change', async (e) => {
      const selected = e.target.value;
      applyTheme(selected);
      await window.api.setTheme(selected);
    });
  }

  // 2. Docking Controls
  const btnDockLeft = document.getElementById('btn-dock-left');
  const btnDockRight = document.getElementById('btn-dock-right');
  const btnDockFull = document.getElementById('btn-dock-full');

  if (btnDockLeft) {
    btnDockLeft.addEventListener('click', async () => {
      await window.api.setDockMode('left');
    });
  }
  if (btnDockRight) {
    btnDockRight.addEventListener('click', async () => {
      await window.api.setDockMode('right');
    });
  }
  if (btnDockFull) {
    btnDockFull.addEventListener('click', async () => {
      await window.api.setDockMode('full');
    });
  }

  // 3. Initialize Modular Widget Manager
  const widgetContainer = document.getElementById('bento-widget-container');
  const widgetMgr = new WidgetManager({
    container: widgetContainer,
    activeWidgets: config.activeWidgets || [
      'arch-waybar-status',
      'fish-tank',
      'ios-clock',
      'system-telemetry',
      'ios-weather',
      'dynamic-music',
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

  // Set initial companion model
  if (window.fishTankInstance && config.activeCreatureModel) {
    window.fishTankInstance.setCompanion(config.activeCreatureModel);
  }

  // 4. Digital Clock Ticker
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

  // 5. Telemetry Updates
  window.api.onTelemetry((stats) => {
    // Header mini chips
    const hdrCpu = document.getElementById('hdr-cpu-chip');
    const hdrMem = document.getElementById('hdr-mem-chip');
    if (hdrCpu) hdrCpu.textContent = ` ${stats.cpu.usagePercent}%`;
    if (hdrMem) hdrMem.textContent = ` ${stats.memory.usedGb}G`;

    // Circular Telemetry Gauges (macOS style)
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

  // 6. Config Updated Listener from Control Center
  window.api.onConfigUpdated((newCfg) => {
    config = newCfg;
    if (newCfg.theme) applyTheme(newCfg.theme);
    if (newCfg.activeWidgets) {
      widgetMgr.setWidgets(newCfg.activeWidgets, newCfg.widgetSizes);
    }
    if (window.fishTankInstance && newCfg.activeCreatureModel) {
      window.fishTankInstance.setCompanion(newCfg.activeCreatureModel);
      const nameLabel = document.getElementById('fish-friend-name');
      if (nameLabel) {
        if (newCfg.activeCreatureModel === 'koi') nameLabel.textContent = 'Kohaku Japanese Koi';
        else if (newCfg.activeCreatureModel === 'axolotl') nameLabel.textContent = 'Lottie Pink Axolotl';
        else if (newCfg.activeCreatureModel === 'puffer') nameLabel.textContent = 'Puffy Pufferfish';
        else nameLabel.textContent = 'Nemo the Clownfish';
      }
    }
    const modelName = document.getElementById('hud-model-name');
    if (modelName) modelName.textContent = newCfg.activeAiModel || 'Gemini 2.0 Flash';
  });

  // 7. Edit mode toggle button
  const btnEdit = document.getElementById('btn-edit-widgets');
  if (btnEdit) {
    btnEdit.addEventListener('click', () => {
      widgetMgr.toggleEditMode();
    });
  }
});
