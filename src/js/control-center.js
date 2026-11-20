/**
 * CONTROL CENTER RENDERER LOGIC
 * Manages monitor selection, widget toggles, video wallpaper selection, and model rotation.
 */

document.addEventListener('DOMContentLoaded', async () => {
  let monitors = [];
  let config = {};

  // 1. Load Initial Data
  try {
    monitors = await window.api.getMonitors();
    config = await window.api.getConfig();
  } catch (err) {
    console.error('Initialization error:', err);
  }

  // 2. Populate Monitors
  const selectMon = document.getElementById('select-monitor');
  if (selectMon && monitors.length > 0) {
    selectMon.innerHTML = '';
    monitors.forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m.index;
      opt.textContent = `${m.name} (${m.orientation}, ${m.width}x${m.height}) - ${m.relativePosition}`;
      if (!m.isPrimary) opt.selected = true; // Auto-select secondary screen
      selectMon.appendChild(opt);
    });
    renderMonitorMap();
  }

  function renderMonitorMap() {
    const map = document.getElementById('monitor-map-canvas');
    if (!map || monitors.length === 0) return;
    map.innerHTML = '';

    let minX = 0, minY = 0, maxX = 0, maxY = 0;
    monitors.forEach(m => {
      minX = Math.min(minX, m.x);
      minY = Math.min(minY, m.y);
      maxX = Math.max(maxX, m.x + m.width);
      maxY = Math.max(maxY, m.y + m.height);
    });

    const totalW = maxX - minX || 1920;
    const totalH = maxY - minY || 1080;
    const scale = Math.min(320 / totalW, 110 / totalH);
    const selectedIdx = parseInt(selectMon.value, 10);

    monitors.forEach(m => {
      const box = document.createElement('div');
      box.className = `map-box ${m.index === selectedIdx ? 'active' : ''}`;
      const w = Math.round(m.width * scale);
      const h = Math.round(m.height * scale);
      const left = 20 + Math.round((m.x - minX) * scale);
      const top = 15 + Math.round((m.y - minY) * scale);

      box.style.width = `${w}px`;
      box.style.height = `${h}px`;
      box.style.left = `${left}px`;
      box.style.top = `${top}px`;

      box.innerHTML = `
        <div>${m.isPrimary ? 'MAIN' : 'SUB'}</div>
        <div style="font-size: 8px; opacity: 0.8;">${m.width}x${m.height}</div>
        <div style="font-size: 7px; color: var(--accent-cyan);">${m.orientation}</div>
      `;

      box.addEventListener('click', () => {
        selectMon.value = m.index;
        renderMonitorMap();
        saveCurrentConfig();
      });

      map.appendChild(box);
    });
  }

  selectMon.addEventListener('change', () => {
    renderMonitorMap();
    saveCurrentConfig();
  });

  // 3. Scan & Populate Local Videos
  const selectVideo = document.getElementById('select-video');
  try {
    const videos = await window.api.scanVideos();
    if (selectVideo) {
      selectVideo.innerHTML = '';
      if (videos.length > 0) {
        videos.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.path;
          opt.textContent = `${v.name} (${v.sizeMb} MB)`;
          if (v.path === config.videoPath) opt.selected = true;
          selectVideo.appendChild(opt);
        });
      } else {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Preset: Deep Ocean Aquatic Gradient';
        selectVideo.appendChild(opt);
      }
    }
  } catch (err) {
    console.error('Error scanning videos:', err);
  }

  // 4. Render Widget Customizer Picker List
  const pickerContainer = document.getElementById('widget-picker-container');
  const countBadge = document.getElementById('active-widgets-count');

  function renderWidgetPicker() {
    if (!pickerContainer) return;
    pickerContainer.innerHTML = '';

    let activeCount = 0;
    WIDGET_CATALOG.forEach(w => {
      const isActive = config.activeWidgets && config.activeWidgets.includes(w.id);
      if (isActive) activeCount++;

      const item = document.createElement('div');
      item.className = 'widget-picker-item';

      item.innerHTML = `
        <div class="widget-item-info">
          <span class="widget-item-icon">${w.icon}</span>
          <div>
            <div class="widget-item-name">${w.name}</div>
            <div class="widget-item-cat">${w.category}</div>
          </div>
        </div>
        <label class="ios-switch">
          <input type="checkbox" data-widget-id="${w.id}" ${isActive ? 'checked' : ''}>
          <span class="switch-slider"></span>
        </label>
      `;

      const checkbox = item.querySelector('input');
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!config.activeWidgets.includes(w.id)) {
            config.activeWidgets.push(w.id);
          }
        } else {
          config.activeWidgets = config.activeWidgets.filter(id => id !== w.id);
        }
        renderWidgetPicker();
        saveCurrentConfig();
      });

      pickerContainer.appendChild(item);
    });

    if (countBadge) countBadge.textContent = `${activeCount} Active`;
  }
  renderWidgetPicker();

  // 5. Model Rotator Setup
  const aiModels = ['Gemini 2.0 Flash', 'Claude 3.5 Sonnet', 'GPT-4o Mini', 'DeepSeek V3', 'Ollama Local'];
  let currentAiIdx = 0;
  const displayAi = document.getElementById('display-ai-model');

  document.getElementById('btn-rotate-models').addEventListener('click', () => {
    currentAiIdx = (currentAiIdx + 1) % aiModels.length;
    config.activeAiModel = aiModels[currentAiIdx];
    if (displayAi) displayAi.value = config.activeAiModel;
    saveCurrentConfig();
  });

  // 6. Fish Companion Selection
  const selectFish = document.getElementById('select-fish-friend');
  if (selectFish) {
    selectFish.value = config.activeCreatureModel || 'clownfish';
    selectFish.addEventListener('change', (e) => {
      config.activeCreatureModel = e.target.value;
      saveCurrentConfig();
    });
  }

  // 7. General Options
  const fpsSelect = document.getElementById('select-fps');
  const onTopCheck = document.getElementById('check-always-on-top');
  const muteCheck = document.getElementById('check-mute');
  const fitSelect = document.getElementById('select-fit');
  const speedSelect = document.getElementById('select-speed');

  if (fpsSelect) fpsSelect.value = config.targetFps || '60';
  if (onTopCheck) onTopCheck.checked = config.alwaysOnTop !== false;
  if (muteCheck) muteCheck.checked = config.videoMuted !== false;
  if (fitSelect) fitSelect.value = config.videoFit || 'cover';
  if (speedSelect) speedSelect.value = (config.videoSpeed || 1.0).toString();

  [selectVideo, fpsSelect, onTopCheck, muteCheck, fitSelect, speedSelect].forEach(el => {
    if (el) el.addEventListener('change', () => saveCurrentConfig());
  });

  async function saveCurrentConfig() {
    config.targetMonitorId = parseInt(selectMon.value, 10);
    config.targetFps = parseInt(fpsSelect.value, 10);
    config.alwaysOnTop = onTopCheck.checked;
    config.videoPath = selectVideo.value;
    config.videoMuted = muteCheck.checked;
    config.videoFit = fitSelect.value;
    config.videoSpeed = parseFloat(speedSelect.value);

    await window.api.saveConfig(config);
  }

  // 8. Launch on Secondary Screen CTA Button
  document.getElementById('btn-relaunch-hud').addEventListener('click', async () => {
    await saveCurrentConfig();
    await window.api.launchSecondary({
      monitorIndex: parseInt(selectMon.value, 10),
      alwaysOnTop: onTopCheck.checked,
    });
  });
});
