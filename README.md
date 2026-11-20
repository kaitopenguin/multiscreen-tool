# Multiscreen Tool v2.0 - Next-Gen Multi-Monitor & Vertical Screen Hub

A desktop companion application specifically designed for multi-monitor battlestations, ultrawide setups, and vertical displays (such as secondary 14-inch laptop LCD monitors).

## 🌟 Key Features

### 1. Fish Friend Interactive Habitat 🐟
Recreated in the charming aesthetic of *"Fish food for my fish friend"*:
- **Interactive Feeding**: Tap or click anywhere on the tank water to drop colorful food flakes.
- **Cute Fish AI**: The fish friend wiggles its fins, spots the food, displays cute emotes (`♥`, `!`, `Nom!`), opens its mouth, and rushes to eat the flakes with bubble bursts.
- **Companions**: Choose between **Nemo the Clownfish**, **Kohaku the Japanese Koi**, or **Lottie the Pink Axolotl**.
- **Living Environment**: Swaying aquatic plants, riverbed gravel pebbles, and bubbling aerator.

### 2. Customizable Widget System (iOS, macOS & Arch Linux Inspired)
Freely choose and customize which widgets appear on your secondary screen:
- **⏰ iOS 18 Standby Typographic Clock**: Large glowing time, pulsing seconds tick, and date.
- **📈 macOS Telemetry Gauges**: Real-time circular meters for CPU Load %, RAM Usage %, and SSD Storage %.
- **🐧 Arch Linux Waybar Status Pill**: Ultra-dense minimalist status bar (CPU load, RAM used, network throughput, disk).
- **⛅ Dynamic Weather Widget**: Current temperature, sky condition, humidity, wind, and forecast.
- **🎵 Dynamic Island Music HUD**: Spinning vinyl record with dynamic live audio spectrum equalizer.
- **🎛️ Mac Control Center Macro Deck**: 4 touch tiles (Mute Mic, Volume toggle, Feed Fish shortcut, Reddit HUD).
- **🔄 AI Model Rotator**: Seamlessly cycle between Gemini 2.0 Flash, Claude 3.5 Sonnet, GPT-4o Mini, DeepSeek V3, and Ollama.
- **⏳ Pomodoro Focus Timer**: 25-minute focus countdown timer with reset.
- **📝 Quick Desk Notes**: Scratchpad directly on your secondary monitor.

### 3. Live Video Wallpaper Engine
- Directly plays any local video (`.mp4`, `.webm`, `.mkv`, `.mov`) in an infinite loop.
- Supports 4K video wallpaper with GPU hardware acceleration.
- Audio mute toggle, playback speed adjustment (`0.5x` to `1.25x`), aspect fit mode (`cover`, `contain`, `fill`), and dark overlay filter for maximum widget readability.

### 4. Display Placement & Orientation Awareness
- Detects primary (`1920x1080` Landscape) and secondary (`768x1360` Portrait) screens automatically.
- Aligns secondary HUD to exact monitor bounds with **Always-on-Top** capability.

## 🚀 How to Run

### Method 1: One-Click Launcher
Double-click `Launch-Multiscreen-Tool.bat` in the project root.

### Method 2: Direct Binary Execution
Run the standalone executable located at:
```text
dist\multiscreen-tool-win32-x64\multiscreen-tool.exe
```

### Method 3: Development Mode
```bash
npm start
```

## 📦 Packaging Standalone App
```bash
npm run package
```

## 📜 License
MIT License.
