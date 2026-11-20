use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoWallpaperConfig {
    pub target_monitor_id: usize,
    pub video_source_type: String, // "local_file" or "preset"
    pub video_path: String,
    pub is_playing: bool,
    pub is_muted: bool,
    pub volume: f32,             // 0.0 to 1.0
    pub playback_rate: f32,      // 0.5 to 2.0
    pub aspect_ratio_mode: String, // "cover", "contain", "fill"
    pub dark_overlay_opacity: f32, // 0.0 to 0.8 for widget readability
    pub target_fps: u32,         // 30, 60, 120, 144
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredVideo {
    pub name: String,
    pub path: String,
    pub size_mb: f32,
    pub extension: String,
}

pub struct WallpaperManager {
    config: Arc<Mutex<VideoWallpaperConfig>>,
}

impl WallpaperManager {
    pub fn new() -> Self {
        // Detect if user has the downloaded anime live wallpaper in Downloads
        let downloads_video = "C:\\Users\\lamha\\Downloads\\Girl Behind Curtains Wallpaper 4K __ Anime Girl Reveal Live Wallpaper _ For android phone_2160p60.mp4";
        let default_video = if Path::new(downloads_video).exists() {
            downloads_video.to_string()
        } else {
            "preset:aquarium_4k".to_string()
        };

        let initial_config = VideoWallpaperConfig {
            target_monitor_id: 1, // Default to secondary monitor!
            video_source_type: if default_video.starts_with("preset") { "preset".to_string() } else { "local_file".to_string() },
            video_path: default_video,
            is_playing: true,
            is_muted: true,
            volume: 0.5,
            playback_rate: 1.0,
            aspect_ratio_mode: "cover".to_string(),
            dark_overlay_opacity: 0.35, // 35% dark overlay gives optimal contrast for stats
            target_fps: 60,
        };

        Self {
            config: Arc::new(Mutex::new(initial_config)),
        }
    }

    pub fn get_config(&self) -> VideoWallpaperConfig {
        self.config.lock().unwrap().clone()
    }

    pub fn update_config(&self, new_config: VideoWallpaperConfig) {
        let mut cfg = self.config.lock().unwrap();
        *cfg = new_config;
    }

    pub fn scan_local_videos(&self) -> Vec<DiscoveredVideo> {
        let mut results = Vec::new();
        let search_dirs = [
            "C:\\Users\\lamha\\Downloads",
            "C:\\Users\\lamha\\Videos",
        ];

        let valid_extensions = ["mp4", "webm", "mkv", "mov"];

        for dir in search_dirs {
            let path = PathBuf::from(dir);
            if let Ok(entries) = std::fs::read_dir(path) {
                for entry in entries.flatten() {
                    let p = entry.path();
                    if p.is_file() {
                        if let Some(ext) = p.extension().and_then(|s| s.to_str()) {
                            let ext_lower = ext.to_lowercase();
                            if valid_extensions.contains(&ext_lower.as_str()) {
                                if let Ok(meta) = entry.metadata() {
                                    let size_mb = (meta.len() as f32 / 1_048_576.0 * 10.0).round() / 10.0;
                                    results.push(DiscoveredVideo {
                                        name: entry.file_name().to_string_lossy().to_string(),
                                        path: p.to_string_lossy().to_string(),
                                        size_mb,
                                        extension: ext_lower,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        results
    }
}
