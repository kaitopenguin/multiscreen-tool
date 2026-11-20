# Multiscreen Tool v2.2 - Caelestia Shell & Omarchy Linux Desktop Companion

An ultra-aesthetic, zero-lag desktop companion for multi-monitor setups and portrait/vertical screens (e.g. 768x1360 secondary displays), inspired by **Caelestia Shell** (Quickshell / Hyprland) and the **7 Omarchy Desktop Ricing Themes**.

---

## 🎨 Inspired by the Linux Ricing Community

### 1. 🌌 Caelestia Shell Aesthetic (Hyprland / Wayland)
- **Floating Island Architecture**: Clean, floating panels with subtle margins (`gaps_in`, `gaps_out`), `16px - 22px` rounded squircle corners, and soft ambient backdrop blur (`backdrop-filter: blur(28px) saturate(180%)`).
- **Waybar Capsule Pills**: Arch Linux logo pill `󰣇 ARCH`, active workspace indicators, and micro-stat chips (` 14%`, `󰍛 8.4G`, `󰖩 ▲24K ▼140K`, `󰋊 46%`).
- **Btop Hardware Progress Bars**: Horizontal sleek gradient bars for CPU, RAM, and SSD storage.
- **Caelestia Music Player**: Album art with colored shadow bloom, track title, artist, and live animated cava spectrum bars.
- **Aesthetic Clock & Date**: Bold typographic hours/minutes with glowing seconds tick and date chip.

### 2. 🎨 The 7 Omarchy Desktop Themes
Switch instantly between all 7 authentic Linux ricing themes from Omarchy:
1. **Catppuccin Sherbet** *(Default)*: Warm pastel mocha, soft peach accents, lavender mauve, and sky blue.
2. **Tokyo Night**: Deep midnight indigo, electric blue, vivid magenta highlights, and neon cyan.
3. **Amberbyte**: Phosphor amber glowing on obsidian, retro cyberpunk technical terminal.
4. **Blueberry**: Electric sapphire and neon cyan on deep navy slate.
5. **Rose Pine**: Muted rose gold, pine green, and foam cyan on cozy dusky purple.
6. **Gruvbox Material**: Earthy warm dark, retro orange, sage green, and warm cream.
7. **Nordic Frost**: Polar night slate, frost cyan, and aurora green.

### 3. 🪟 Side-Docking (Treo một bên màn hình)
- **◧ Treo bên trái (Dock Left)**: Neo thanh tiện ích 360px sát mép trái màn hình phụ.
- **◨ Treo bên phải (Dock Right)**: Neo thanh tiện ích sát mép phải.
- **⛶ Toàn màn hình (Full Width)**: Mở rộng phủ toàn bộ màn hình phụ.
- Tùy chỉnh độ rộng (280px - 500px) và tùy chọn **Always-on-Top**.

### 4. 🐟 Fish Friend Habitat ("Fish food for my fish friend")
- **Interactive Feeding**: Click or tap anywhere in the water to drop sinking food flake particles.
- **Cute Fish AI**: The companion spots flakes, displays cheerful emotes (`♥`, `^w^`, `Nom!`), dashes over, opens its mouth to eat with bubble bursts.
- **Selectable Companions**: Lottie the Pink Axolotl, Nemo the Clownfish, Kohaku Japanese Koi, Puffy Pufferfish.

### 5. 🎬 Dedicated Live Wallpaper Engine
- Completely decoupled independent layer behind all windows.
- Run wallpaper on any monitor without running widgets, or run the widget dock without heavy video decoding.
- Hardware-accelerated GPU playback for 4K 60FPS videos (`.mp4`, `.webm`, `.mkv`).

### 6. ⚡ Zero-Lag Native Telemetry Engine
- Powered 100% by Node.js C++ V8 native APIs (`os.cpus()`, `os.totalmem()`, `os.freemem()`, `fs.statfsSync`).
- **0.0% CPU overhead, 0 child processes, microsecond precision**.

---

## 🚀 How to Launch & Run

### Method 1: One-Click Launcher (Khởi động tức thì)
Double-click `Launch-Multiscreen-Tool.bat` in the project root. It automatically detects and launches the standalone binary or local electron engine.

### Method 2: Direct Binary Execution
Run the standalone portable executable at:
```text
dist\multiscreen-tool-win32-x64\multiscreen-tool.exe
```

### Method 3: Command Line
```bash
npm start
```

---

## 📜 License
MIT License. Crafted with care by kaitopenguin.
