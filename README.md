# Multiscreen Tool

A high-performance secondary display utility written in Rust.

## Highlights
- **Multi-Monitor Awareness**: Detects all attached screens, geometry coordinates, orientations (Portrait & Landscape), and refresh rates via Windows Win32 APIs.
- **Dynamic Live Video Wallpaper**: Assign and loop video backdrops (MP4, WebM, MKV, MOV) to any designated monitor with hardware acceleration, audio controls, and custom overlay filters.
- **Hardware Telemetry HUD**: Real-time CPU, RAM, GPU, storage, and network bandwidth meters powered by `sysinfo`.
- **Virtual Aquatic & Pet Habitat**: Interactive HTML5 canvas ecosystem featuring simulated koi fish, jellyfish, axolotls, water ripple dynamics, and click-to-feed mechanics.
- **Pluggable Model Rotation Engine**: Easily switch and rotate between AI companions, interactive creatures, and visual themes using Round-Robin, timed intervals, or manual controls.
- **Secondary Screen Extras**: Dynamic audio spectrum equalizer, media HUD with vinyl disc animation, quick macro pads, and weather forecast widgets.
- **Window Management**: Borderless fullscreen positioning, target FPS adjustment (30/60/120/144 FPS), and Always-on-Top overlay modes.

## Architecture
- **Language**: Rust (Edition 2021)
- **Backend**: Axum, Tokio, Windows-Sys, Sysinfo
- **Frontend**: Lightweight vanilla HTML5/CSS3/Canvas with Impeccable dark aesthetics and responsive bento grid reflow.

## Getting Started

### Prerequisites
- Rust & Cargo (1.80+)
- Windows 10/11

### Build & Run
```bash
cargo run
```
The application will launch the Control Center at `http://localhost:8848` and allow one-click launching of the secondary screen HUD.

## License
MIT License.
