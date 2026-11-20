# Multiscreen Tool v2.1 - Arch Linux Dock & Multi-Monitor Desktop Companion

A high-performance desktop companion engineered for secondary screens, portrait/vertical displays (e.g. 768x1360 portrait monitors), and multi-monitor battlestations.

Built for **zero lag**, **minimal RAM/CPU usage (<0.5%)**, and native side-docking.

---

## 🚀 What's New in v2.1

### 1. 🐧 Arch Linux & Multi-Theme System
Choose your aesthetic on the fly with instant live switching across all windows:
- **Arch Linux (Hyprland / Waybar / Catppuccin Mocha)** *(Default)*: Minimalist tiling window manager design, Waybar status capsule pills, crisp 1px borders, and monospaced telemetry fonts (`JetBrains Mono`, `Fira Code`).
- **🫧 Frutiger Aero**: Skeuomorphic glossy glass, vivid aqua/cyan gradients, specular reflection highlights, and floating water bubbles.
- **📟 Retro CRT Terminal**: Phosphor matrix green on CRT obsidian, horizontal scanline raster, ASCII brackets `[ SYS // OK ]`, and retro hacker glowing fonts.
- **🌌 Modern Slate**: Deep space dark slate, subtle frosted acrylic glass, and clean neon cyan accents.

### 2. 🪟 Side-Docking for Vertical / Secondary Screens (Treo một bên màn hình)
Dock your secondary HUD gracefully on any edge of your monitor:
- **◧ Treo bên trái (Dock Left)**: 360px wide sidebar attached to the left edge of your secondary portrait screen.
- **◨ Treo bên phải (Dock Right)**: 360px wide sidebar attached to the right edge.
- **⛶ Toàn màn hình (Full Width)**: Fills the entire display.
- **Width Customizer**: Adjust width smoothly between 280px and 500px.
- **Always on Top**: Float unobtrusively beside your IDE, browser, or terminal.

### 3. 🎬 Dedicated Independent Live Wallpaper Engine (Hình nền riêng biệt)
- Video wallpaper is completely separated into its own independent layer!
- Run wallpaper on any monitor without running widgets, or run the widget dock without heavy video decoding.
- Hardware-accelerated GPU playback for 4K 60FPS videos (`.mp4`, `.webm`, `.mkv`).
- Controls for audio mute, playback speed (`0.5x` to `1.0x`), aspect ratio fit (`cover`, `contain`), and overlay tint darkness.

### 4. ⚡ Zero-Lag Native Telemetry (Zero Child Processes)
- Replaced slow process-spawning polling with native Node.js C++ V8 APIs (`os.cpus()`, `os.totalmem()`, `os.freemem()`, `fs.statfsSync`).
- **0.0% CPU overhead**, instantaneous microsecond calculation, zero micro-stutters.

### 5. 🐟 Fish Friend Interactive Habitat
Recreated in the charming aesthetic of the viral short *"Fish food for my fish friend"*:
- **Click-to-feed**: Tap anywhere inside the tank water to drop sinking food flake particles.
- **Cute Fish AI**: The companion wiggles its fins, notices the food, darts over, opens its mouth to munch flakes with bubble bursts, and expresses cheerful heart / happy emotes (`♥`, `^w^`, `Nom!`).
- **Species**: Nemo the Clownfish, Kohaku Japanese Koi, Lottie Pink Axolotl, Puffy Pufferfish.
- Runs smoothly at 60 FPS on HTML5 Canvas with minimal CPU footprint.

### 6. 🧩 Modular Widgets Catalog
Toggle and arrange your favorite desk tools:
- **🐧 Arch Waybar Status Pill**: Real-time CPU, RAM, Disk, Net chips.
- **⏰ Typographic Digital Clock & Date**: Clean high-contrast time ticker.
- **📈 Circular Hardware Gauges**: Precision meters for CPU, Memory, and SSD.
- **⛅ Live Weather Forecast**: Current temperature, condition, and hourly forecast.
- **🎵 Music HUD & Dynamic Spectrum**: Spinning vinyl record with audio equalizer bars.
- **🎛️ Macro Deck Quick Actions**: One-tap buttons for Mute Mic, Volume, Feed Fish, and Reddit.
- **🔄 AI Model Rotator**: Gemini 2.0 Flash, Claude 3.5 Sonnet, GPT-4o Mini, DeepSeek V3, Ollama.
- **📝 Desk Scratchpad Notes**: Persistent sticky notes for quick thoughts.

---

## 💻 How to Run

### Method 1: One-Click Launcher
Double-click `Launch-Multiscreen-Tool.bat` in the project root.

### Method 2: Standalone Executable
Run the pre-built portable binary at:
```text
dist\multiscreen-tool-win32-x64\multiscreen-tool.exe
```

### Method 3: Development Mode
```bash
npm start
```

---

## 🛠️ Build & Package Standalone Windows App
```bash
npm run package
```

---

## 📜 License
MIT License. Crafted with care by kaitopenguin.
