mod model_rotator;
mod monitors;
mod server;
mod system_stats;
mod wallpaper;
mod weather;

use model_rotator::ModelRotator;
use server::{create_router, AppState};
use std::sync::Arc;
use std::time::Duration;
use system_stats::StatsCollector;
use tokio::sync::broadcast;
use wallpaper::WallpaperManager;
use weather::WeatherService;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    println!("============================================================");
    println!("  MULTISCREEN TOOL v1.0.0 - Next-Gen Secondary Monitor Hub");
    println!("  Designed with Impeccable & UI/UX Pro Max Principles");
    println!("============================================================");

    // Initialize subsystems
    let stats_collector = Arc::new(StatsCollector::new());
    let model_rotator = Arc::new(ModelRotator::new());
    let wallpaper_mgr = Arc::new(WallpaperManager::new());
    let weather_service = Arc::new(WeatherService::new());
    let (ws_broadcast, _) = broadcast::channel::<String>(128);

    let state = AppState {
        stats_collector: stats_collector.clone(),
        model_rotator: model_rotator.clone(),
        wallpaper_mgr: wallpaper_mgr.clone(),
        weather_service: weather_service.clone(),
        ws_broadcast: ws_broadcast.clone(),
    };

    // Background Telemetry Broadcast Loop (every 1000ms)
    let stats_loop_collector = stats_collector.clone();
    let stats_ws_tx = ws_broadcast.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_millis(1000));
        loop {
            interval.tick().await;
            let current_stats = stats_loop_collector.collect();
            let msg = serde_json::json!({
                "type": "stats_update",
                "data": current_stats
            })
            .to_string();
            let _ = stats_ws_tx.send(msg);
        }
    });

    // Background Model Rotator Timer Check Loop (every 2000ms)
    let rotator_timer = model_rotator.clone();
    let rotator_ws_tx = ws_broadcast.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_millis(2000));
        loop {
            interval.tick().await;
            if let Some((cat, model)) = rotator_timer.check_timed_rotation() {
                let msg = serde_json::json!({
                    "type": "model_rotated",
                    "category": format!("{:?}", cat),
                    "model": model
                })
                .to_string();
                let _ = rotator_ws_tx.send(msg);
            }
        }
    });

    // Detect monitors at startup
    let detected_monitors = monitors::get_all_monitors();
    println!("\nDetected {} Connected Monitor(s):", detected_monitors.len());
    for m in &detected_monitors {
        println!(
            "  - [{}] {} | {} | {}x{} at ({}, {}) | Primary: {}",
            m.id, m.name, m.orientation, m.width, m.height, m.x, m.y, m.is_primary
        );
    }

    let router = create_router(state);
    let addr = "0.0.0.0:8848";
    println!("\nStarting Multiscreen Tool server on http://localhost:8848 ...");
    println!("Control Center Dashboard: http://localhost:8848");
    println!("Secondary Display HUD:    http://localhost:8848/display.html");

    // Automatically open Control Center in browser
    tokio::spawn(async {
        tokio::time::sleep(Duration::from_millis(800)).await;
        let _ = open::that("http://localhost:8848");
    });

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, router).await?;

    Ok(())
}
