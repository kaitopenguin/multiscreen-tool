/**
 * WIDGET MANAGEMENT ENGINE
 * Complete widget catalog, customization, sizing, and dynamic rendering.
 * Inspired by iOS 18, macOS Sonoma, Android Material You, and Arch Linux Waybar.
 */

const WIDGET_CATALOG = [
  {
    id: 'fish-tank',
    name: 'Fish Friend Habitat 🐟',
    category: 'Creature Companion',
    description: 'Charming desktop fish companion with feeding interaction and gentle aquatic physics.',
    icon: '🐠',
    defaultSize: 'large',
    sizesAvailable: ['medium', 'large', 'full'],
  },
  {
    id: 'ios-clock',
    name: 'iOS 18 Standby Clock',
    category: 'Time & Date',
    description: 'Large typographic glowing clock with seconds tick and calendar date.',
    icon: '⏰',
    defaultSize: 'medium',
    sizesAvailable: ['small', 'medium'],
  },
  {
    id: 'system-telemetry',
    name: 'Hardware Telemetry (macOS)',
    category: 'System Performance',
    description: 'Precision circular gauges for CPU, RAM, GPU, and SSD storage.',
    icon: '📈',
    defaultSize: 'medium',
    sizesAvailable: ['medium', 'large'],
  },
  {
    id: 'arch-waybar-status',
    name: 'Arch Linux Waybar Status Pill',
    category: 'Telemetry Pill',
    description: 'Ultra-dense minimalist status pill inspired by Hyprland and Waybar.',
    icon: '🐧',
    defaultSize: 'compact',
    sizesAvailable: ['compact'],
  },
  {
    id: 'ios-weather',
    name: 'Dynamic iOS Weather',
    category: 'Weather & Sky',
    description: 'Animated sky gradients, live temperature, humidity, wind, and 5-day forecast.',
    icon: '⛅',
    defaultSize: 'medium',
    sizesAvailable: ['medium', 'large'],
  },
  {
    id: 'dynamic-music',
    name: 'Dynamic Island Music HUD',
    category: 'Media & Audio',
    description: 'Spinning vinyl record player with live dynamic audio spectrum equalizer.',
    icon: '🎵',
    defaultSize: 'medium',
    sizesAvailable: ['medium'],
  },
  {
    id: 'macro-deck',
    name: 'Mac Control Center Macro Deck',
    category: 'Quick Actions',
    description: 'Stream Deck style touch tiles: Mute Mic, Volume, Screenshot, Task Manager.',
    icon: '🎛️',
    defaultSize: 'medium',
    sizesAvailable: ['medium'],
  },
  {
    id: 'model-rotator',
    name: 'AI Model Rotator HUD',
    category: 'AI Assistant',
    description: 'Rotate and switch between Gemini, Claude, GPT-4o, DeepSeek, and Ollama.',
    icon: '🔄',
    defaultSize: 'compact',
    sizesAvailable: ['compact', 'medium'],
  },
  {
    id: 'pomodoro',
    name: 'Focus Pomodoro Timer',
    category: 'Productivity',
    description: '25-minute focus session with circular countdown progress and audio chime.',
    icon: '⏳',
    defaultSize: 'compact',
    sizesAvailable: ['compact', 'medium'],
  },
  {
    id: 'quick-notes',
    name: 'Quick Desk Sticky Notes',
    category: 'Productivity',
    description: 'Persistent markdown scratchpad directly on your secondary screen.',
    icon: '📝',
    defaultSize: 'medium',
    sizesAvailable: ['medium', 'large'],
  },
];

class WidgetManager {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('bento-widget-container');
    this.activeWidgets = options.activeWidgets || [
      'fish-tank',
      'ios-clock',
      'system-telemetry',
      'ios-weather',
      'dynamic-music',
      'arch-waybar-status',
      'macro-deck',
      'model-rotator',
    ];
    this.widgetSizes = options.widgetSizes || {};
    this.onChanged = options.onChanged || (() => {});
    this.isEditMode = false;
  }

  setWidgets(activeList, sizes = {}) {
    this.activeWidgets = activeList;
    this.widgetSizes = sizes;
    this.render();
  }

  addWidget(id) {
    if (!this.activeWidgets.includes(id)) {
      this.activeWidgets.push(id);
      this.render();
      this.onChanged(this.activeWidgets, this.widgetSizes);
    }
  }

  removeWidget(id) {
    this.activeWidgets = this.activeWidgets.filter(w => w !== id);
    this.render();
    this.onChanged(this.activeWidgets, this.widgetSizes);
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    const cards = document.querySelectorAll('.widget-card');
    cards.forEach(card => {
      card.classList.toggle('edit-mode', this.isEditMode);
    });
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    this.activeWidgets.forEach((id) => {
      const def = WIDGET_CATALOG.find(w => w.id === id);
      if (!def) return;

      const size = this.widgetSizes[id] || def.defaultSize;
      const el = document.createElement('div');
      el.className = `widget-card widget-size-${size} ${this.isEditMode ? 'edit-mode' : ''}`;
      el.setAttribute('data-widget-id', id);

      // Delete badge in edit mode
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'widget-delete-btn';
      deleteBtn.innerHTML = '✕';
      deleteBtn.title = 'Remove Widget';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeWidget(id);
      });
      el.appendChild(deleteBtn);

      // Render Widget Content
      const content = this.renderWidgetTemplate(id);
      el.appendChild(content);

      this.container.appendChild(el);
    });

    // Re-initialize dynamic widgets
    this.initDynamicWidgets();
  }

  renderWidgetTemplate(id) {
    const wrapper = document.createElement('div');
    wrapper.className = 'widget-inner-content';

    switch (id) {
      case 'fish-tank':
        wrapper.innerHTML = `
          <div class="fish-tank-widget-wrapper">
            <div class="widget-header-row">
              <div class="widget-title-pill">
                <span>🐟</span>
                <span id="fish-friend-name">Nemo the Clownfish</span>
              </div>
              <div class="fish-feed-prompt">Tap water to drop flakes</div>
            </div>
            <div class="fish-tank-viewport">
              <canvas id="fish-tank-canvas"></canvas>
            </div>
          </div>
        `;
        break;

      case 'ios-clock':
        wrapper.innerHTML = `
          <div class="ios-clock-widget">
            <div class="ios-clock-time">
              <span id="ios-hours-mins">12:00</span><span id="ios-seconds" class="ios-secs">:00</span>
            </div>
            <div id="ios-date-string" class="ios-clock-date">WEDNESDAY, NOVEMBER 20</div>
          </div>
        `;
        break;

      case 'system-telemetry':
        wrapper.innerHTML = `
          <div class="telemetry-widget-card">
            <div class="widget-header-row">
              <span class="widget-label">SYSTEM TELEMETRY</span>
              <span class="status-dot-live">● LIVE</span>
            </div>
            <div class="telemetry-gauges-row">
              <div class="gauge-col">
                <svg viewBox="0 0 76 76" class="circle-gauge">
                  <circle cx="38" cy="38" r="32" class="gauge-track"></circle>
                  <circle id="tel-cpu-circle" cx="38" cy="38" r="32" class="gauge-fill gauge-cyan"></circle>
                </svg>
                <div id="tel-cpu-val" class="gauge-center-text">24%</div>
                <div class="gauge-sub-label">CPU</div>
              </div>
              <div class="gauge-col">
                <svg viewBox="0 0 76 76" class="circle-gauge">
                  <circle cx="38" cy="38" r="32" class="gauge-track"></circle>
                  <circle id="tel-mem-circle" cx="38" cy="38" r="32" class="gauge-fill gauge-purple"></circle>
                </svg>
                <div id="tel-mem-val" class="gauge-center-text">52%</div>
                <div class="gauge-sub-label">RAM</div>
              </div>
              <div class="gauge-col">
                <svg viewBox="0 0 76 76" class="circle-gauge">
                  <circle cx="38" cy="38" r="32" class="gauge-track"></circle>
                  <circle id="tel-disk-circle" cx="38" cy="38" r="32" class="gauge-fill gauge-emerald"></circle>
                </svg>
                <div id="tel-disk-val" class="gauge-center-text">45%</div>
                <div class="gauge-sub-label">SSD</div>
              </div>
            </div>
          </div>
        `;
        break;

      case 'arch-waybar-status':
        wrapper.innerHTML = `
          <div class="arch-waybar-card">
            <span class="waybar-chip chip-blue">🐧 ARCH</span>
            <span class="waybar-chip" id="wb-cpu">CPU 24%</span>
            <span class="waybar-chip" id="wb-mem">RAM 8.4G</span>
            <span class="waybar-chip chip-green" id="wb-net">▲45K ▼124K</span>
            <span class="waybar-chip chip-purple" id="wb-disk">SSD 45%</span>
          </div>
        `;
        break;

      case 'ios-weather':
        wrapper.innerHTML = `
          <div class="ios-weather-card">
            <div class="weather-top">
              <div>
                <div class="weather-city">Hanoi, Vietnam</div>
                <div class="weather-big-temp" id="weather-temp">24°</div>
              </div>
              <div class="weather-condition-col">
                <div class="weather-condition-text" id="weather-cond">Partly Cloudy</div>
                <div class="weather-high-low">H: 28° · L: 21°</div>
              </div>
            </div>
            <div class="weather-chips-strip" id="weather-forecast-strip">
              <div class="mini-forecast-chip"><div>Now</div><div class="chip-temp">24°</div></div>
              <div class="mini-forecast-chip"><div>14:00</div><div class="chip-temp">26°</div></div>
              <div class="mini-forecast-chip"><div>16:00</div><div class="chip-temp">25°</div></div>
              <div class="mini-forecast-chip"><div>18:00</div><div class="chip-temp">23°</div></div>
              <div class="mini-forecast-chip"><div>20:00</div><div class="chip-temp">22°</div></div>
            </div>
          </div>
        `;
        break;

      case 'dynamic-music':
        wrapper.innerHTML = `
          <div class="dynamic-music-card">
            <div class="music-vinyl-record" id="vinyl-disc">
              <div class="vinyl-groove"></div>
              <div class="vinyl-center-art"></div>
            </div>
            <div class="music-meta-col">
              <div class="music-song-title">Lofi Synthwave Sunset</div>
              <div class="music-artist-name">Kaito Penguin · Desktop Radio</div>
              <div class="audio-spectrum-bars" id="music-spectrum-bars">
                <!-- Dynamically generated bars -->
              </div>
            </div>
          </div>
        `;
        break;

      case 'macro-deck':
        wrapper.innerHTML = `
          <div class="macro-deck-card">
            <div class="macro-deck-title">CONTROL CENTER</div>
            <div class="macro-tiles-grid">
              <button class="macro-tile" onclick="alert('Microphone Muted')">
                <span class="tile-icon">🎤</span>
                <span>Mute Mic</span>
              </button>
              <button class="macro-tile" onclick="alert('Audio Muted')">
                <span class="tile-icon">🔊</span>
                <span>Volume</span>
              </button>
              <button class="macro-tile" id="tile-feed-fish">
                <span class="tile-icon">🐟</span>
                <span>Feed Fish</span>
              </button>
              <button class="macro-tile" onclick="window.open('https://reddit.com/r/battlestations')">
                <span class="tile-icon">🌐</span>
                <span>Reddit</span>
              </button>
            </div>
          </div>
        `;
        break;

      case 'model-rotator':
        wrapper.innerHTML = `
          <div class="model-rotator-card">
            <div class="rotator-header">
              <span class="rotator-tag">AI ROTATOR</span>
              <button class="btn-rotate-mini" id="btn-quick-rotate-hud">↻ Rotate</button>
            </div>
            <div class="rotator-active-model" id="hud-model-name">Gemini 2.0 Flash</div>
            <div class="rotator-strategy-note">Round-Robin Rotation Active</div>
          </div>
        `;
        break;

      case 'pomodoro':
        wrapper.innerHTML = `
          <div class="pomodoro-card">
            <div class="pomodoro-time" id="pomo-display">25:00</div>
            <div class="pomodoro-controls">
              <button class="pomo-btn" id="pomo-toggle">Start Focus</button>
              <button class="pomo-btn pomo-reset" id="pomo-reset">Reset</button>
            </div>
          </div>
        `;
        break;

      case 'quick-notes':
        wrapper.innerHTML = `
          <div class="quick-notes-card">
            <div class="widget-header-row">
              <span class="widget-label">DESK NOTES</span>
              <span>📌</span>
            </div>
            <textarea class="notes-textarea" placeholder="Type quick scratch notes here..."></textarea>
          </div>
        `;
        break;
    }

    return wrapper;
  }

  initDynamicWidgets() {
    // 1. Initialize Fish Tank if present
    const fishCanvas = document.getElementById('fish-tank-canvas');
    if (fishCanvas) {
      window.fishTankInstance = new FishFriendTank('fish-tank-canvas');
      const feedBtn = document.getElementById('tile-feed-fish');
      if (feedBtn) {
        feedBtn.addEventListener('click', () => {
          if (window.fishTankInstance) {
            window.fishTankInstance.dropFood(
              window.fishTankInstance.width * 0.5,
              window.fishTankInstance.height * 0.3
            );
          }
        });
      }
    }

    // 2. Initialize spectrum bars if present
    const specContainer = document.getElementById('music-spectrum-bars');
    if (specContainer) {
      specContainer.innerHTML = '';
      for (let i = 0; i < 20; i++) {
        const bar = document.createElement('div');
        bar.className = 'spectrum-bar';
        specContainer.appendChild(bar);
      }
      this.animateSpectrum();
    }
  }

  animateSpectrum() {
    let phase = 0;
    const update = () => {
      phase += 0.08;
      const bars = document.querySelectorAll('.spectrum-bar');
      bars.forEach((bar, i) => {
        const h = (Math.sin(phase + i * 0.4) * 0.5 + 0.5) * 20 + 4;
        bar.style.height = `${h}px`;
      });
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }
}
