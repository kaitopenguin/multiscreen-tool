/**
 * SECONDARY DISPLAY HUD LOGIC
 * Coordinates Video Wallpaper, Aquarium physics, Telemetry, and Model Rotation.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const targetFps = parseInt(urlParams.get('fps'), 10) || 60;
  const orientationParam = urlParams.get('orientation') || 'Portrait';

  // Set FPS Badge
  const badgeFps = document.getElementById('badge-fps');
  if (badgeFps) badgeFps.textContent = `${targetFps} FPS`;

  const badgeOrientation = document.getElementById('badge-orientation');
  if (badgeOrientation) badgeOrientation.textContent = orientationParam.toUpperCase();

  // Adjust bento grid layout based on orientation
  const bentoContainer = document.getElementById('bento-container');
  if (orientationParam.toLowerCase() === 'landscape' || window.innerWidth > window.innerHeight) {
    bentoContainer.className = 'bento-grid bento-landscape';
  } else {
    bentoContainer.className = 'bento-grid bento-portrait';
  }

  // 1. Initialize Aquarium Physics Simulation
  const aquarium = new AquariumEngine('aquarium-canvas');
  aquarium.setFps(targetFps);

  // 2. Initialize Audio Visualizer
  new AudioVisualizer('visualizer-bars', 24);

  // 3. Initialize Live Telemetry Client via WebSocket
  const telemetry = new TelemetryManager({
    onModelRotated: (msg) => {
      console.log('Model rotated event received:', msg);
      if (msg.model) {
        const nameEl = document.getElementById('hud-active-model-name');
        if (nameEl) nameEl.textContent = msg.model.name;

        // If creature rotated, update aquarium species
        if (msg.category === 'creature' || msg.category === 'VirtualCreature') {
          if (msg.model.id.includes('koi')) aquarium.setSpecies('koi');
          else if (msg.model.id.includes('jellyfish')) aquarium.setSpecies('jellyfish');
          else if (msg.model.id.includes('axolotl')) aquarium.setSpecies('axolotl');
          else aquarium.setSpecies('neko');
        }
      }
    },
    onWallpaperUpdated: (cfg) => {
      applyWallpaperConfig(cfg);
    },
  });

  // 4. Video Wallpaper Loader
  const videoEl = document.getElementById('wallpaper-video');
  const overlayEl = document.getElementById('wallpaper-overlay');

  function applyWallpaperConfig(cfg) {
    if (!videoEl || !cfg) return;

    if (cfg.video_path && !cfg.video_path.startsWith('preset')) {
      const streamUrl = `/api/video-stream?path=${encodeURIComponent(cfg.video_path)}`;
      if (videoEl.src !== window.location.origin + streamUrl) {
        videoEl.src = streamUrl;
        videoEl.load();
        videoEl.play().catch(e => console.log('Autoplay handled:', e));
      }
    } else {
      // Fallback synthetic animated gradient when no video selected
      videoEl.style.display = 'none';
      document.getElementById('wallpaper-video-container').style.background =
        'radial-gradient(circle at 50% 50%, #0d1b2a 0%, #070a12 100%)';
    }

    videoEl.muted = cfg.is_muted;
    videoEl.playbackRate = cfg.playback_rate || 1.0;
    videoEl.style.objectFit = cfg.aspect_ratio_mode || 'cover';

    if (overlayEl) {
      overlayEl.style.background = `rgba(7, 10, 18, ${cfg.dark_overlay_opacity || 0.35})`;
    }
  }

  // Fetch initial wallpaper config
  try {
    const res = await fetch('/api/wallpaper');
    const data = await res.json();
    applyWallpaperConfig(data.config);
  } catch (err) {
    console.error('Failed to load initial wallpaper:', err);
  }

  // 5. Digital Clock & Date Tick
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');

    const hmEl = document.getElementById('clock-hours-mins');
    const secEl = document.getElementById('clock-secs');
    if (hmEl) hmEl.textContent = `${hours}:${mins}`;
    if (secEl) secEl.textContent = `:${secs}`;

    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dateStr = `${days[now.getDay()]} · ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    const dateEl = document.getElementById('clock-date-str');
    if (dateEl) dateEl.textContent = dateStr;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // 6. Live Weather Loader
  async function loadWeather() {
    try {
      const res = await fetch('/api/weather');
      const data = await res.json();

      document.getElementById('weather-city').textContent = `${data.city}, ${data.country}`;
      document.getElementById('weather-temp').textContent = `${data.temp_c}°C`;
      document.getElementById('weather-condition').textContent = data.condition;
      document.getElementById('weather-hum').textContent = `${data.humidity}%`;
      document.getElementById('weather-wind').textContent = `${data.wind_kmh} km/h`;

      const forecastRow = document.getElementById('weather-forecast-row');
      if (forecastRow) {
        forecastRow.innerHTML = '';
        data.forecast.forEach(f => {
          const chip = document.createElement('div');
          chip.className = 'forecast-chip';
          chip.innerHTML = `
            <div style="font-weight: 600; color: #fff;">${f.day_name}</div>
            <div style="color: var(--accent-cyan); font-family: var(--font-mono); margin: 2px 0;">${f.temp_max}°</div>
            <div style="color: var(--text-muted); font-size: 9px;">${f.condition}</div>
          `;
          forecastRow.appendChild(chip);
        });
      }
    } catch (err) {
      console.error('Weather load error:', err);
    }
  }
  loadWeather();

  // 7. Fullscreen Toggle
  document.getElementById('btn-toggle-fullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
    } else {
      document.exitFullscreen().catch(e => console.log(e));
    }
  });

  // 8. Quick Rotate button on HUD
  document.getElementById('btn-hud-rotate').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/models/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'ai' }),
      });
      const next = await res.json();
      document.getElementById('hud-active-model-name').textContent = next.name;
    } catch (err) {
      console.error('Rotate error:', err);
    }
  });

  // 9. Macro Pad Feed Fish Button
  const feedBtn = document.getElementById('macro-feed-fish');
  if (feedBtn) {
    feedBtn.addEventListener('click', () => {
      aquarium.feed(window.innerWidth / 2, window.innerHeight / 3);
    });
  }
});
