/**
 * CONTROL CENTER APP LOGIC
 * Manages monitor selection, video wallpaper settings, model rotation, and display launching.
 */

document.addEventListener('DOMContentLoaded', async () => {
  let detectedMonitors = [];
  let currentWallpaperConfig = null;
  let rotatorState = null;

  // 1. Fetch & Render Monitors
  async function loadMonitors() {
    try {
      const res = await fetch('/api/monitors');
      detectedMonitors = await res.json();

      const countBadge = document.getElementById('detected-count-badge');
      if (countBadge) countBadge.textContent = `${detectedMonitors.length} Screens Connected`;

      const selectMon = document.getElementById('select-target-monitor');
      selectMon.innerHTML = '';

      detectedMonitors.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `[Display ${m.id + 1}] ${m.name} (${m.orientation}, ${m.width}x${m.height}) - ${m.relative_position}`;
        // Prefer secondary monitor by default
        if (!m.is_primary) opt.selected = true;
        selectMon.appendChild(opt);
      });

      renderMonitorMap();
    } catch (err) {
      console.error('Failed to load monitors:', err);
    }
  }

  // Draw interactive visual layout of screens
  function renderMonitorMap() {
    const map = document.getElementById('monitor-map');
    if (!map || detectedMonitors.length === 0) return;
    map.innerHTML = '';

    // Calculate bounding box for normalization
    let minX = 0, minY = 0, maxX = 0, maxY = 0;
    detectedMonitors.forEach((m) => {
      minX = Math.min(minX, m.x);
      minY = Math.min(minY, m.y);
      maxX = Math.max(maxX, m.x + m.width);
      maxY = Math.max(maxY, m.y + m.height);
    });

    const totalWidth = maxX - minX || 1920;
    const totalHeight = maxY - minY || 1080;
    const scale = Math.min(380 / totalWidth, 140 / totalHeight);

    const selectMon = document.getElementById('select-target-monitor');
    const selectedId = parseInt(selectMon.value, 10);

    detectedMonitors.forEach((m) => {
      const box = document.createElement('div');
      box.className = `monitor-box ${m.is_primary ? 'primary' : ''} ${m.id === selectedId ? 'active' : ''}`;
      
      const w = Math.round(m.width * scale);
      const h = Math.round(m.height * scale);
      const left = 20 + Math.round((m.x - minX) * scale);
      const top = 20 + Math.round((m.y - minY) * scale);

      box.style.width = `${w}px`;
      box.style.height = `${h}px`;
      box.style.left = `${left}px`;
      box.style.top = `${top}px`;

      box.innerHTML = `
        <div style="font-weight: 700; font-size: 10px;">${m.is_primary ? 'MAIN' : 'SUB'}</div>
        <div style="font-size: 9px; opacity: 0.8;">${m.width}x${m.height}</div>
        <div style="font-size: 8px; color: var(--accent-cyan);">${m.orientation}</div>
      `;

      box.addEventListener('click', () => {
        selectMon.value = m.id;
        renderMonitorMap();
      });

      map.appendChild(box);
    });
  }

  // 2. Fetch & Render Video Wallpapers
  async function loadWallpaperSettings() {
    try {
      const res = await fetch('/api/wallpaper');
      const data = await res.json();
      currentWallpaperConfig = data.config;

      // Populate discovered video files
      const selectVid = document.getElementById('select-video-file');
      selectVid.innerHTML = '';

      if (data.discovered && data.discovered.length > 0) {
        data.discovered.forEach((v) => {
          const opt = document.createElement('option');
          opt.value = v.path;
          opt.textContent = `${v.name} (${v.size_mb} MB)`;
          if (v.path === currentWallpaperConfig.video_path) opt.selected = true;
          selectVid.appendChild(opt);
        });
      } else {
        const opt = document.createElement('option');
        opt.value = 'preset:aquarium_4k';
        opt.textContent = 'Preset: Deep Ocean Aquarium Loop';
        selectVid.appendChild(opt);
      }

      document.getElementById('input-custom-video-path').value = currentWallpaperConfig.video_path;
      document.getElementById('select-video-fit').value = currentWallpaperConfig.aspect_ratio_mode;
      document.getElementById('select-video-speed').value = currentWallpaperConfig.playback_rate.toString();
      document.getElementById('slider-overlay').value = Math.round(currentWallpaperConfig.dark_overlay_opacity * 100);
      document.getElementById('label-overlay-pct').textContent = `${Math.round(currentWallpaperConfig.dark_overlay_opacity * 100)}%`;
      document.getElementById('toggle-video-mute').checked = currentWallpaperConfig.is_muted;
    } catch (err) {
      console.error('Failed to load wallpaper:', err);
    }
  }

  // 3. Fetch & Render Model Rotator
  async function loadModelRotator() {
    try {
      const res = await fetch('/api/models');
      rotatorState = await res.json();

      const activeAi = rotatorState.models.find(m => m.id === rotatorState.active_ai_model_id);
      if (activeAi) {
        document.getElementById('active-ai-name').textContent = activeAi.name;
        document.getElementById('active-ai-desc').textContent = activeAi.description;
      }

      const activeCreature = rotatorState.models.find(m => m.id === rotatorState.active_creature_id);
      if (activeCreature) {
        document.getElementById('active-creature-name').textContent = activeCreature.name;
        document.getElementById('active-creature-desc').textContent = activeCreature.description;
      }

      document.getElementById('select-strategy').value = rotatorState.config.strategy;
      document.getElementById('select-interval').value = rotatorState.config.rotation_interval_secs.toString();
    } catch (err) {
      console.error('Failed to load models:', err);
    }
  }

  // Event Listeners for Model Rotation
  document.getElementById('btn-rotate-ai').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/models/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'ai' }),
      });
      const next = await res.json();
      document.getElementById('active-ai-name').textContent = next.name;
      document.getElementById('active-ai-desc').textContent = next.description;
    } catch (err) {
      alert('Error rotating AI model: ' + err);
    }
  });

  document.getElementById('btn-rotate-creature').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/models/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'creature' }),
      });
      const next = await res.json();
      document.getElementById('active-creature-name').textContent = next.name;
      document.getElementById('active-creature-desc').textContent = next.description;
    } catch (err) {
      alert('Error rotating creature model: ' + err);
    }
  });

  // Apply Video Button
  document.getElementById('btn-apply-video').addEventListener('click', async () => {
    const customPath = document.getElementById('input-custom-video-path').value.trim();
    const selectPath = document.getElementById('select-video-file').value;
    const finalPath = customPath || selectPath;

    const overlay = parseInt(document.getElementById('slider-overlay').value, 10) / 100;
    const fit = document.getElementById('select-video-fit').value;
    const speed = parseFloat(document.getElementById('select-video-speed').value);
    const muted = document.getElementById('toggle-video-mute').checked;
    const targetMon = parseInt(document.getElementById('select-target-monitor').value, 10);

    const payload = {
      target_monitor_id: targetMon,
      video_source_type: 'local_file',
      video_path: finalPath,
      is_playing: true,
      is_muted: muted,
      volume: 0.5,
      playback_rate: speed,
      aspect_ratio_mode: fit,
      dark_overlay_opacity: overlay,
      target_fps: parseInt(document.getElementById('select-fps').value, 10) || 60,
    };

    try {
      await fetch('/api/wallpaper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      alert('Video wallpaper applied successfully!');
    } catch (err) {
      alert('Failed to save wallpaper: ' + err);
    }
  });

  // Slider change listener
  document.getElementById('slider-overlay').addEventListener('input', (e) => {
    document.getElementById('label-overlay-pct').textContent = `${e.target.value}%`;
  });

  document.getElementById('select-video-file').addEventListener('change', (e) => {
    document.getElementById('input-custom-video-path').value = e.target.value;
  });

  document.getElementById('select-target-monitor').addEventListener('change', () => {
    renderMonitorMap();
  });

  // Launch Fullscreen CTA Button
  document.getElementById('btn-launch-fullscreen').addEventListener('click', async () => {
    const targetMonId = parseInt(document.getElementById('select-target-monitor').value, 10);
    const fps = parseInt(document.getElementById('select-fps').value, 10);
    const onTop = document.getElementById('toggle-always-on-top').checked;
    const orientation = document.getElementById('select-orientation').value;
    const resValue = document.getElementById('select-resolution').value;

    let width = null;
    let height = null;
    if (resValue !== 'native') {
      const parts = resValue.split('x');
      if (parts.length === 2) {
        width = parseInt(parts[0], 10);
        height = parseInt(parts[1], 10);
      }
    }

    const payload = {
      monitor_id: targetMonId,
      fullscreen: true,
      width,
      height,
      fps,
      always_on_top: onTop,
      orientation_override: orientation === 'auto' ? null : orientation,
    };

    try {
      const res = await fetch('/api/monitors/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        console.log('Launched successfully:', data.message);
      } else {
        alert('Launch failed: ' + data.message);
      }
    } catch (err) {
      alert('Error launching display: ' + err);
    }
  });

  // Quick Preview Button
  document.getElementById('btn-quick-preview').addEventListener('click', () => {
    window.open('/display.html', '_blank', 'width=768,height=960');
  });

  // Initialize
  await loadMonitors();
  await loadWallpaperSettings();
  await loadModelRotator();
});
