/**
 * CAELESTIA SHELL - SECONDARY HUD CONTROLLER
 * Hyprland floating island design, Omarchy 7 themes, Btop telemetry, zero-lag 60fps.
 */

document.addEventListener('DOMContentLoaded', async () => {
  let config = {};
  try {
    config = await window.api.getConfig();
  } catch (err) {
    console.error('Config fetch error:', err);
  }

  // 1. Theme Management (7 Omarchy Themes)
  const validThemes = ['catppuccin', 'tokyonight', 'amberbyte', 'blueberry', 'rosepine', 'gruvbox', 'nordic'];
  function applyTheme(themeName) {
    // Map legacy names if any
    let active = themeName;
    if (active === 'arch') active = 'catppuccin';
    if (active === 'retro') active = 'amberbyte';
    if (active === 'modern' || active === 'frutiger') active = 'blueberry';
    if (!validThemes.includes(active)) active = 'catppuccin';

    document.body.className = `theme-${active}`;

    const themeSelect = document.getElementById('hud-theme-select');
    if (themeSelect) themeSelect.value = active;

    const brandTag = document.getElementById('header-brand-tag');
    if (brandTag) {
      const titles = {
        catppuccin: 'ARCH // SHERBET',
        tokyonight: 'ARCH // TOKYO',
        amberbyte: 'ARCH // AMBER',
        blueberry: 'ARCH // BLUEBERRY',
        rosepine: 'ARCH // ROSE',
        gruvbox: 'ARCH // GRUVBOX',
        nordic: 'ARCH // NORDIC',
      };
      brandTag.textContent = titles[active] || 'ARCH // CAELESTIA';
    }
  }
  applyTheme(config.theme || 'catppuccin');

  const themeSelect = document.getElementById('hud-theme-select');
  if (themeSelect) {
    themeSelect.addEventListener('change', async (e) => {
      const selected = e.target.value;
      applyTheme(selected);
      await window.api.setTheme(selected);
    });
  }

  // 2. Docking Side Controls
  const btnDockLeft = document.getElementById('btn-dock-left');
  const btnDockRight = document.getElementById('btn-dock-right');
  const btnDockFull = document.getElementById('btn-dock-full');

  if (btnDockLeft) btnDockLeft.addEventListener('click', () => window.api.setDockMode('left'));
  if (btnDockRight) btnDockRight.addEventListener('click', () => window.api.setDockMode('right'));
  if (btnDockFull) btnDockFull.addEventListener('click', () => window.api.setDockMode('full'));

  // 3. Initialize Modular Widget Manager
  const widgetContainer = document.getElementById('bento-widget-container');
  const widgetMgr = new WidgetManager({
    container: widgetContainer,
    activeWidgets: config.activeWidgets || [
      'arch-waybar-status',
      'ios-clock',
      'fish-tank',
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

  // Set initial fish companion
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
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
    const dateEl = document.getElementById('ios-date-string');
    if (dateEl) dateEl.textContent = dateStr;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 5. Telemetry Updates (Native C++ V8 Engine)
  window.api.onTelemetry((stats) => {
    // Top Waybar Quick Chips
    const hdrCpu = document.getElementById('hdr-cpu-chip');
    const hdrMem = document.getElementById('hdr-mem-chip');
    if (hdrCpu) hdrCpu.textContent = ` ${stats.cpu.usagePercent}%`;
    if (hdrMem) hdrMem.textContent = `󰍛 ${stats.memory.usedGb}G`;

    // Btop Horizontal Progress Bars
    const cpuVal = document.getElementById('tel-cpu-val');
    const cpuBar = document.getElementById('tel-cpu-bar');
    if (cpuVal) cpuVal.textContent = `${stats.cpu.usagePercent}% (${stats.cpu.speedGhz} GHz)`;
    if (cpuBar) cpuBar.style.width = `${Math.min(100, Math.max(0, stats.cpu.usagePercent))}%`;

    const memVal = document.getElementById('tel-mem-val');
    const memBar = document.getElementById('tel-mem-bar');
    if (memVal) memVal.textContent = `${stats.memory.usedGb}G / ${stats.memory.totalGb}G (${stats.memory.percent}%)`;
    if (memBar) memBar.style.width = `${Math.min(100, Math.max(0, stats.memory.percent))}%`;

    const diskVal = document.getElementById('tel-disk-val');
    const diskBar = document.getElementById('tel-disk-bar');
    if (diskVal) diskVal.textContent = `${stats.disk.usedGb}G / ${stats.disk.totalGb}G (${stats.disk.percent}%)`;
    if (diskBar) diskBar.style.width = `${Math.min(100, Math.max(0, stats.disk.percent))}%`;

    // Arch Waybar Status Cluster
    const wbCpu = document.getElementById('wb-cpu');
    const wbMem = document.getElementById('wb-mem');
    const wbNet = document.getElementById('wb-net');
    const wbDisk = document.getElementById('wb-disk');

    if (wbCpu) wbCpu.textContent = ` ${stats.cpu.usagePercent}%`;
    if (wbMem) wbMem.textContent = `󰍛 ${stats.memory.usedGb}G`;
    if (wbNet) wbNet.textContent = `󰖩 ▲${stats.network.uploadKb}K ▼${stats.network.downloadKb}K`;
    if (wbDisk) wbDisk.textContent = `󰋊 ${stats.disk.percent}%`;
  });

  // 6. Config Sync Listener
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
        else if (newCfg.activeCreatureModel === 'axolotl') nameLabel.textContent = 'Lottie the Pink Axolotl';
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
