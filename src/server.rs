use axum::{
    body::Body,
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::broadcast;
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;

use crate::model_rotator::{ModelCategory, ModelItem, ModelRotator, RotatorConfig, RotatorState};
use crate::monitors::{get_all_monitors, MonitorInfo};
use crate::system_stats::{StatsCollector, SystemStats};
use crate::wallpaper::{DiscoveredVideo, VideoWallpaperConfig, WallpaperManager};
use crate::weather::{WeatherData, WeatherService};

#[derive(Clone)]
pub struct AppState {
    pub stats_collector: Arc<StatsCollector>,
    pub model_rotator: Arc<ModelRotator>,
    pub wallpaper_mgr: Arc<WallpaperManager>,
    pub weather_service: Arc<WeatherService>,
    pub ws_broadcast: broadcast::Sender<String>,
}

#[derive(Debug, Deserialize)]
pub struct LaunchRequest {
    pub monitor_id: usize,
    pub fullscreen: bool,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub fps: Option<u32>,
    pub always_on_top: bool,
    pub orientation_override: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct LaunchResponse {
    pub success: bool,
    pub message: String,
    pub target_monitor: Option<MonitorInfo>,
    pub launch_url: String,
}

#[derive(Debug, Deserialize)]
pub struct RotateRequest {
    pub category: String, // "ai", "creature", "theme"
}

#[derive(Debug, Deserialize)]
pub struct SetActiveModelRequest {
    pub model_id: String,
}

#[derive(Debug, Deserialize)]
pub struct VideoStreamQuery {
    pub path: String,
}

pub fn create_router(state: AppState) -> Router {
    let cors = CorsLayer::permissive();

    Router::new()
        .route("/api/monitors", get(handle_get_monitors))
        .route("/api/monitors/launch", post(handle_launch_display))
        .route("/api/stats", get(handle_get_stats))
        .route("/api/models", get(handle_get_models))
        .route("/api/models/rotate", post(handle_rotate_model))
        .route("/api/models/active", post(handle_set_active_model))
        .route("/api/models/config", post(handle_update_rotator_config))
        .route("/api/models/add", post(handle_add_model))
        .route("/api/wallpaper", get(handle_get_wallpaper).post(handle_update_wallpaper))
        .route("/api/wallpaper/scan", get(handle_scan_videos))
        .route("/api/video-stream", get(handle_stream_video))
        .route("/api/weather", get(handle_get_weather))
        .route("/ws", get(handle_ws_upgrade))
        .nest_service("/", ServeDir::new("static"))
        .layer(cors)
        .with_state(state)
}

async fn handle_get_monitors() -> Json<Vec<MonitorInfo>> {
    Json(get_all_monitors())
}

async fn handle_launch_display(
    State(state): State<AppState>,
    Json(req): Json<LaunchRequest>,
) -> Json<LaunchResponse> {
    let monitors = get_all_monitors();
    let target = monitors.iter().find(|m| m.id == req.monitor_id).cloned();

    if let Some(ref mon) = target {
        let width = req.width.unwrap_or(mon.width);
        let height = req.height.unwrap_or(mon.height);
        let fps = req.fps.unwrap_or(60);
        let orientation = req.orientation_override.unwrap_or_else(|| mon.orientation.clone());

        // Update wallpaper target monitor
        let mut wp_cfg = state.wallpaper_mgr.get_config();
        wp_cfg.target_monitor_id = mon.id;
        wp_cfg.target_fps = fps;
        state.wallpaper_mgr.update_config(wp_cfg);

        // Build the secondary display HUD URL with query parameters
        let display_url = format!(
            "http://localhost:8848/display.html?monitor={}&w={}&h={}&fps={}&orientation={}&fullscreen={}&ontop={}",
            mon.id, width, height, fps, orientation, req.fullscreen, req.always_on_top
        );

        // Launch directly using Windows MS Edge / default browser in app mode or popup
        let browser_cmd = format!(
            "--app={} --window-position={},{} --window-size={},{}",
            display_url, mon.x, mon.y, width, height
        );

        let opened = std::process::Command::new("msedge")
            .arg(browser_cmd)
            .spawn()
            .is_ok();

        if !opened {
            let _ = open::that(&display_url);
        }

        Json(LaunchResponse {
            success: true,
            message: format!(
                "Display HUD launched on monitor '{}' ({}, {}x{} @ {} FPS, always_on_top: {})",
                mon.name, orientation, width, height, fps, req.always_on_top
            ),
            target_monitor: Some(mon.clone()),
            launch_url: display_url,
        })
    } else {
        Json(LaunchResponse {
            success: false,
            message: format!("Monitor id {} not found", req.monitor_id),
            target_monitor: None,
            launch_url: String::new(),
        })
    }
}

async fn handle_get_stats(State(state): State<AppState>) -> Json<SystemStats> {
    Json(state.stats_collector.collect())
}

async fn handle_get_models(State(state): State<AppState>) -> Json<RotatorState> {
    Json(state.model_rotator.get_state())
}

async fn handle_rotate_model(
    State(state): State<AppState>,
    Json(req): Json<RotateRequest>,
) -> Json<ModelItem> {
    let cat = match req.category.as_str() {
        "creature" => ModelCategory::VirtualCreature,
        "theme" => ModelCategory::VisualTheme,
        _ => ModelCategory::AiCompanion,
    };
    let next_model = state.model_rotator.rotate_category(cat);

    let notify = serde_json::json!({
        "type": "model_rotated",
        "category": req.category,
        "model": next_model
    })
    .to_string();
    let _ = state.ws_broadcast.send(notify);

    Json(next_model)
}

async fn handle_set_active_model(
    State(state): State<AppState>,
    Json(req): Json<SetActiveModelRequest>,
) -> Result<Json<ModelItem>, StatusCode> {
    if let Some(item) = state.model_rotator.set_active_model(&req.model_id) {
        let notify = serde_json::json!({
            "type": "model_changed",
            "model": item
        })
        .to_string();
        let _ = state.ws_broadcast.send(notify);
        Ok(Json(item))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

async fn handle_update_rotator_config(
    State(state): State<AppState>,
    Json(cfg): Json<RotatorConfig>,
) -> StatusCode {
    state.model_rotator.update_config(cfg);
    StatusCode::OK
}

async fn handle_add_model(
    State(state): State<AppState>,
    Json(model): Json<ModelItem>,
) -> StatusCode {
    state.model_rotator.add_model(model);
    StatusCode::CREATED
}

#[derive(Serialize)]
struct WallpaperResponse {
    config: VideoWallpaperConfig,
    discovered: Vec<DiscoveredVideo>,
}

async fn handle_get_wallpaper(State(state): State<AppState>) -> Json<WallpaperResponse> {
    let config = state.wallpaper_mgr.get_config();
    let discovered = state.wallpaper_mgr.scan_local_videos();
    Json(WallpaperResponse { config, discovered })
}

async fn handle_update_wallpaper(
    State(state): State<AppState>,
    Json(cfg): Json<VideoWallpaperConfig>,
) -> Json<VideoWallpaperConfig> {
    state.wallpaper_mgr.update_config(cfg.clone());
    let notify = serde_json::json!({
        "type": "wallpaper_updated",
        "config": cfg
    })
    .to_string();
    let _ = state.ws_broadcast.send(notify);
    Json(cfg)
}

async fn handle_scan_videos(State(state): State<AppState>) -> Json<Vec<DiscoveredVideo>> {
    Json(state.wallpaper_mgr.scan_local_videos())
}

async fn handle_get_weather(
    State(state): State<AppState>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Json<WeatherData> {
    let city = params.get("city").map(|s| s.as_str());
    Json(state.weather_service.get_weather(city))
}

// Video streaming with HTTP 206 Partial Content (Range requests)
async fn handle_stream_video(
    Query(query): Query<VideoStreamQuery>,
    headers: HeaderMap,
) -> Result<Response, StatusCode> {
    let path = PathBuf::from(&query.path);
    if !path.exists() || !path.is_file() {
        return Err(StatusCode::NOT_FOUND);
    }

    let file_bytes = std::fs::read(&path).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let total_len = file_bytes.len();

    let content_type = match path.extension().and_then(|s| s.to_str()).unwrap_or("mp4") {
        "webm" => "video/webm",
        "mkv" => "video/x-matroska",
        "mov" => "video/quicktime",
        _ => "video/mp4",
    };

    if let Some(range_header) = headers.get(header::RANGE).and_then(|h| h.to_str().ok()) {
        if let Some(range_str) = range_header.strip_prefix("bytes=") {
            let parts: Vec<&str> = range_str.split('-').collect();
            let start: usize = parts[0].parse().unwrap_or(0);
            let end: usize = if parts.len() > 1 && !parts[1].is_empty() {
                parts[1].parse().unwrap_or(total_len - 1).min(total_len - 1)
            } else {
                total_len - 1
            };

            if start <= end && start < total_len {
                let chunk = file_bytes[start..=end].to_vec();
                let chunk_len = chunk.len();

                let res = Response::builder()
                    .status(StatusCode::PARTIAL_CONTENT)
                    .header(header::CONTENT_TYPE, content_type)
                    .header(header::ACCEPT_RANGES, "bytes")
                    .header(
                        header::CONTENT_RANGE,
                        format!("bytes {}-{}/{}", start, end, total_len),
                    )
                    .header(header::CONTENT_LENGTH, chunk_len)
                    .body(Body::from(chunk))
                    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

                return Ok(res);
            }
        }
    }

    let res = Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, content_type)
        .header(header::ACCEPT_RANGES, "bytes")
        .header(header::CONTENT_LENGTH, total_len)
        .body(Body::from(file_bytes))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(res)
}

async fn handle_ws_upgrade(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_ws_session(socket, state))
}

async fn handle_ws_session(mut socket: WebSocket, state: AppState) {
    let mut rx = state.ws_broadcast.subscribe();

    loop {
        tokio::select! {
            msg_res = rx.recv() => {
                if let Ok(msg_text) = msg_res {
                    if socket.send(Message::Text(msg_text)).await.is_err() {
                        break;
                    }
                }
            }
            client_msg = socket.recv() => {
                match client_msg {
                    Some(Ok(Message::Text(text))) => {
                        // Echo or handle client actions if needed
                        let _ = state.ws_broadcast.send(text);
                    }
                    Some(Ok(Message::Close(_))) | None => break,
                    _ => {}
                }
            }
        }
    }
}
