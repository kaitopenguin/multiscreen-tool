use eframe::egui;
use egui::{
    pos2, vec2, Color32, FontId, Rect, Rounding, Sense, Stroke, Ui,
};
use std::time::Instant;

use crate::model_rotator::{ModelCategory, ModelRotator};
use crate::monitors::{get_all_monitors, MonitorInfo};
use crate::system_stats::{StatsCollector, SystemStats};
use crate::wallpaper::WallpaperManager;
use crate::weather::WeatherService;

// Creature particle in native aquarium
#[derive(Clone)]
struct NativeCreature {
    x: f32,
    y: f32,
    vx: f32,
    vy: f32,
    size: f32,
    angle: f32,
    speed: f32,
    tail_phase: f32,
    pulse_phase: f32,
    species: String,
}

#[derive(Clone)]
struct FoodPellet {
    x: f32,
    y: f32,
    vy: f32,
    radius: f32,
    life: u32,
}

#[derive(Clone)]
struct Bubble {
    x: f32,
    y: f32,
    r: f32,
    speed: f32,
    wobble: f32,
}

pub struct MultiscreenNativeApp {
    stats_collector: StatsCollector,
    model_rotator: ModelRotator,
    wallpaper_mgr: WallpaperManager,
    weather_service: WeatherService,
    monitors: Vec<MonitorInfo>,
    selected_monitor_id: usize,
    target_fps: u32,
    always_on_top: bool,
    active_tab: AppTab,

    // Animation & Aquarium state
    creatures: Vec<NativeCreature>,
    foods: Vec<FoodPellet>,
    bubbles: Vec<Bubble>,
    last_frame: Instant,
    last_stats_refresh: Instant,
    cached_stats: SystemStats,
    audio_phase: f32,
    vinyl_angle: f32,
    pomodoro_secs: u32,
    pomodoro_running: bool,
}

#[derive(PartialEq)]
enum AppTab {
    ControlCenter,
    SecondaryDisplayHud,
}

impl MultiscreenNativeApp {
    pub fn new(_cc: &eframe::CreationContext<'_>) -> Self {
        let stats_collector = StatsCollector::new();
        let cached_stats = stats_collector.collect();
        let model_rotator = ModelRotator::new();
        let wallpaper_mgr = WallpaperManager::new();
        let weather_service = WeatherService::new();
        let monitors = get_all_monitors();

        // Default to secondary monitor if available
        let selected_monitor_id = monitors
            .iter()
            .find(|m| !m.is_primary)
            .map(|m| m.id)
            .unwrap_or(0);

        // Initialize 7 swimming creatures
        let mut creatures = Vec::new();
        for i in 0..7 {
            creatures.push(NativeCreature {
                x: 100.0 + (i as f32 * 60.0),
                y: 120.0 + (i as f32 * 40.0),
                vx: 1.2,
                vy: 0.5,
                size: 26.0 + (i as f32 * 2.0),
                angle: 0.0,
                speed: 1.4 + (i as f32 * 0.1),
                tail_phase: i as f32,
                pulse_phase: i as f32 * 0.5,
                species: if i % 2 == 0 { "koi".to_string() } else { "jellyfish".to_string() },
            });
        }

        // Initialize bubbles
        let mut bubbles = Vec::new();
        for i in 0..20 {
            bubbles.push(Bubble {
                x: 30.0 + (i as f32 * 25.0),
                y: 50.0 + (i as f32 * 20.0),
                r: 2.0 + (i as f32 % 3.0),
                speed: 0.8 + ((i % 4) as f32 * 0.3),
                wobble: i as f32,
            });
        }

        Self {
            stats_collector,
            model_rotator,
            wallpaper_mgr,
            weather_service,
            monitors,
            selected_monitor_id,
            target_fps: 60,
            always_on_top: true,
            active_tab: AppTab::ControlCenter,
            creatures,
            foods: Vec::new(),
            bubbles,
            last_frame: Instant::now(),
            last_stats_refresh: Instant::now(),
            cached_stats,
            audio_phase: 0.0,
            vinyl_angle: 0.0,
            pomodoro_secs: 25 * 60,
            pomodoro_running: false,
        }
    }

    fn update_physics(&mut self, bounds: Rect) {
        let dt = self.last_frame.elapsed().as_secs_f32().min(0.05);
        self.last_frame = Instant::now();

        // Update Bubbles
        for b in &mut self.bubbles {
            b.y -= b.speed * 60.0 * dt;
            b.wobble += 3.0 * dt;
            b.x += b.wobble.sin() * 0.5;
            if b.y < bounds.min.y {
                b.y = bounds.max.y;
                b.x = bounds.min.x + (b.x * 13.0) % bounds.width();
            }
        }

        // Update Food Pellets
        self.foods.retain_mut(|f| {
            f.y += f.vy * 60.0 * dt;
            f.life = f.life.saturating_sub(1);
            f.y < bounds.max.y && f.life > 0
        });

        // Update Creatures
        for c in &mut self.creatures {
            // Chase food if available
            if !self.foods.is_empty() {
                let mut closest_idx = None;
                let mut min_d = 400.0f32;
                for (idx, f) in self.foods.iter().enumerate() {
                    let d = ((f.x - c.x).powi(2) + (f.y - c.y).powi(2)).sqrt();
                    if d < min_d {
                        min_d = d;
                        closest_idx = Some(idx);
                    }
                }

                if let Some(target_idx) = closest_idx {
                    let f = &self.foods[target_idx];
                    let target_angle = (f.y - c.y).atan2(f.x - c.x);
                    c.angle += (target_angle - c.angle) * 0.08;
                    c.vx = c.angle.cos() * (c.speed * 1.5);
                    c.vy = c.angle.sin() * (c.speed * 1.5);

                    if min_d < c.size * 0.7 {
                        self.foods.remove(target_idx);
                    }
                }
            } else {
                c.vx = c.angle.cos() * c.speed;
                c.vy = c.angle.sin() * c.speed;
            }

            c.x += c.vx * 60.0 * dt;
            c.y += c.vy * 60.0 * dt;
            c.tail_phase += 8.0 * dt;
            c.pulse_phase += 2.0 * dt;

            // Bounce on boundaries
            if c.x < bounds.min.x + c.size || c.x > bounds.max.x - c.size {
                c.vx = -c.vx;
                c.angle = c.vy.atan2(c.vx);
            }
            if c.y < bounds.min.y + c.size || c.y > bounds.max.y - c.size {
                c.vy = -c.vy;
                c.angle = c.vy.atan2(c.vx);
            }
        }

        // Update audio & vinyl
        self.audio_phase += 4.0 * dt;
        self.vinyl_angle += 1.8 * dt;

        // Refresh hardware stats every 1 second
        if self.last_stats_refresh.elapsed().as_secs() >= 1 {
            self.cached_stats = self.stats_collector.collect();
            self.last_stats_refresh = Instant::now();
        }
    }
}

impl eframe::App for MultiscreenNativeApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        // Request repaint for smooth 60/120 FPS animation
        ctx.request_repaint();

        // Configure Impeccable dark visuals
        let mut visuals = egui::Visuals::dark();
        visuals.panel_fill = Color32::from_rgb(7, 10, 18);
        visuals.window_fill = Color32::from_rgba_premultiplied(17, 24, 39, 230);
        visuals.window_stroke = Stroke::new(1.0, Color32::from_rgba_premultiplied(255, 255, 255, 20));
        ctx.set_visuals(visuals);

        // Top Navigation Header
        egui::TopBottomPanel::top("top_header")
            .frame(egui::Frame::none().fill(Color32::from_rgb(11, 16, 28)).inner_margin(12.0))
            .show(ctx, |ui| {
                ui.horizontal(|ui| {
                    ui.label(
                        egui::RichText::new("MULTISCREEN TOOL")
                            .font(FontId::proportional(16.0))
                            .strong()
                            .color(Color32::from_rgb(0, 242, 254)),
                    );

                    ui.label(
                        egui::RichText::new("NATIVE RUST CORE")
                            .font(FontId::monospace(10.0))
                            .color(Color32::from_rgb(148, 163, 184)),
                    );

                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                        if ui.selectable_label(self.active_tab == AppTab::SecondaryDisplayHud, "Secondary HUD").clicked() {
                            self.active_tab = AppTab::SecondaryDisplayHud;
                        }
                        if ui.selectable_label(self.active_tab == AppTab::ControlCenter, "Control Center").clicked() {
                            self.active_tab = AppTab::ControlCenter;
                        }
                    });
                });
            });

        // Main Central Content
        egui::CentralPanel::default().show(ctx, |ui| {
            match self.active_tab {
                AppTab::ControlCenter => self.render_control_center(ui),
                AppTab::SecondaryDisplayHud => self.render_secondary_hud(ui),
            }
        });
    }
}

impl MultiscreenNativeApp {
    fn render_control_center(&mut self, ui: &mut Ui) {
        egui::ScrollArea::vertical().show(ui, |ui| {
            ui.add_space(8.0);

            // Row 1: Monitors setup & Layout Map
            ui.group(|ui| {
                ui.heading(egui::RichText::new("Display Setup & Layout Map").color(Color32::WHITE));
                ui.label(
                    egui::RichText::new("Detected displays and desktop spatial arrangement")
                        .color(Color32::from_rgb(148, 163, 184))
                        .size(11.0),
                );
                ui.add_space(8.0);

                // Visual Monitor Map
                let (rect, _response) = ui.allocate_exact_size(vec2(ui.available_width(), 100.0), Sense::hover());
                let painter = ui.painter_at(rect);
                painter.rect_filled(rect, Rounding::same(6.0), Color32::from_rgb(4, 7, 13));
                painter.rect_stroke(rect, Rounding::same(6.0), Stroke::new(1.0, Color32::from_rgb(30, 41, 59)));

                for m in &self.monitors {
                    let is_target = m.id == self.selected_monitor_id;
                    let mon_w = if m.orientation == "Portrait" { 45.0 } else { 90.0 };
                    let mon_h = if m.orientation == "Portrait" { 75.0 } else { 55.0 };
                    let center_x = rect.center().x + if m.is_primary { 50.0 } else { -50.0 };
                    let center_y = rect.center().y;
                    let m_rect = Rect::from_center_size(pos2(center_x, center_y), vec2(mon_w, mon_h));

                    let border_color = if is_target {
                        Color32::from_rgb(0, 242, 254)
                    } else if m.is_primary {
                        Color32::from_rgb(138, 43, 226)
                    } else {
                        Color32::from_rgb(60, 75, 100)
                    };

                    painter.rect_filled(m_rect, Rounding::same(4.0), Color32::from_rgb(15, 23, 42));
                    painter.rect_stroke(m_rect, Rounding::same(4.0), Stroke::new(2.0, border_color));

                    painter.text(
                        m_rect.center(),
                        egui::Align2::CENTER_CENTER,
                        format!("{}\n{}x{}", if m.is_primary { "MAIN" } else { "SUB" }, m.width, m.height),
                        FontId::monospace(9.0),
                        Color32::WHITE,
                    );
                }

                ui.add_space(8.0);
                ui.horizontal(|ui| {
                    ui.label("Target Screen:");
                    for m in &self.monitors {
                        if ui.selectable_label(self.selected_monitor_id == m.id, format!("Display {} ({})", m.id + 1, m.orientation)).clicked() {
                            self.selected_monitor_id = m.id;
                        }
                    }
                });

                ui.horizontal(|ui| {
                    ui.label("Target FPS:");
                    for fps in [30, 60, 120, 144] {
                        if ui.selectable_label(self.target_fps == fps, format!("{} FPS", fps)).clicked() {
                            self.target_fps = fps;
                        }
                    }
                    ui.checkbox(&mut self.always_on_top, "Always on Top");
                });

                ui.add_space(4.0);
                if ui.button(egui::RichText::new("🚀 Switch to Secondary Screen HUD").strong().color(Color32::BLACK)).clicked() {
                    self.active_tab = AppTab::SecondaryDisplayHud;
                }
            });

            ui.add_space(14.0);

            // Row 2: Model Rotation Framework
            ui.group(|ui| {
                ui.horizontal(|ui| {
                    ui.heading(egui::RichText::new("Model Rotation Framework").color(Color32::WHITE));
                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                        if ui.button("↻ Rotate Active Model").clicked() {
                            let next = self.model_rotator.rotate_category(ModelCategory::AiCompanion);
                            println!("Rotated AI to: {}", next.name);
                        }
                    });
                });

                let state = self.model_rotator.get_state();
                let active_ai = state.models.iter().find(|m| m.id == state.active_ai_model_id);
                if let Some(ai) = active_ai {
                    ui.label(egui::RichText::new(format!("Active AI Model: {}", ai.name)).strong().color(Color32::from_rgb(0, 242, 254)));
                    ui.label(egui::RichText::new(&ai.description).size(11.0).color(Color32::from_rgb(148, 163, 184)));
                }

                ui.add_space(4.0);
                let active_creature = state.models.iter().find(|m| m.id == state.active_creature_id);
                if let Some(c) = active_creature {
                    ui.label(egui::RichText::new(format!("Active Habitat Creature: {}", c.name)).strong().color(Color32::from_rgb(192, 132, 252)));
                }
            });

            ui.add_space(14.0);

            // Row 3: Video Wallpaper Config
            ui.group(|ui| {
                ui.heading(egui::RichText::new("Video Wallpaper Engine").color(Color32::WHITE));
                let cfg = self.wallpaper_mgr.get_config();
                ui.label(egui::RichText::new(format!("Current Video: {}", cfg.video_path)).monospace().size(11.0));
                let discovered = self.wallpaper_mgr.scan_local_videos();
                ui.label(egui::RichText::new(format!("Scanned {} video files in Downloads/Videos", discovered.len())).size(11.0).color(Color32::from_rgb(16, 185, 129)));
            });
        });
    }

    fn render_secondary_hud(&mut self, ui: &mut Ui) {
        let full_rect = ui.available_rect_before_wrap();
        self.update_physics(full_rect);

        // 1. Paint Aquarium Canvas Background (Creatures, Food, Bubbles)
        let (rect, response) = ui.allocate_exact_size(ui.available_size(), Sense::click());
        let painter = ui.painter_at(rect);

        // Dark water background
        painter.rect_filled(rect, Rounding::ZERO, Color32::from_rgb(5, 8, 17));

        // Click to feed fish
        if response.clicked() {
            if let Some(mouse_pos) = response.hover_pos() {
                for i in 0..4 {
                    self.foods.push(FoodPellet {
                        x: mouse_pos.x + ((i as f32 - 1.5) * 8.0),
                        y: mouse_pos.y + ((i as f32 - 1.5) * 6.0),
                        vy: 1.0 + (i as f32 * 0.2),
                        radius: 3.0,
                        life: 300,
                    });
                }
            }
        }

        // Draw Bubbles
        for b in &self.bubbles {
            painter.circle_filled(pos2(b.x, b.y), b.r, Color32::from_rgba_premultiplied(255, 255, 255, 40));
            painter.circle_stroke(pos2(b.x, b.y), b.r, Stroke::new(0.8, Color32::from_rgb(0, 242, 254)));
        }

        // Draw Food Pellets
        for f in &self.foods {
            painter.circle_filled(pos2(f.x, f.y), f.radius, Color32::from_rgb(245, 158, 11));
        }

        // Draw Swimming Creatures (Koi & Jellyfish)
        for c in &self.creatures {
            if c.species == "koi" {
                // Koi Body
                let angle = c.angle;
                let head = pos2(c.x + angle.cos() * c.size * 0.5, c.y + angle.sin() * c.size * 0.5);
                let tail_wiggle = (c.tail_phase).sin() * 8.0;
                let tail = pos2(
                    c.x - angle.cos() * c.size * 0.8 + (-angle.sin() * tail_wiggle),
                    c.y - angle.sin() * c.size * 0.8 + (angle.cos() * tail_wiggle),
                );

                painter.circle_filled(pos2(c.x, c.y), c.size * 0.45, Color32::WHITE);
                painter.circle_filled(head, c.size * 0.35, Color32::from_rgb(239, 68, 68)); // red head
                painter.line_segment([pos2(c.x, c.y), tail], Stroke::new(c.size * 0.3, Color32::WHITE));
            } else {
                // Bioluminescent Jellyfish
                let pulse = 1.0 + (c.pulse_phase).sin() * 0.15;
                painter.circle_filled(pos2(c.x, c.y), c.size * 0.4 * pulse, Color32::from_rgba_premultiplied(0, 242, 254, 120));
                painter.circle_stroke(pos2(c.x, c.y), c.size * 0.4 * pulse, Stroke::new(1.5, Color32::from_rgb(0, 242, 254)));

                // Tentacles
                for t in -2..=2 {
                    let tx = c.x + (t as f32 * 4.0);
                    let wave = ((c.tail_phase + t as f32).sin()) * 4.0;
                    painter.line_segment(
                        [pos2(tx, c.y + 6.0), pos2(tx + wave, c.y + 24.0)],
                        Stroke::new(1.0, Color32::from_rgb(138, 43, 226)),
                    );
                }
            }
        }

        // 2. Foreground HUD Overlays (Digital Clock, Hardware Gauges, Stream Deck)
        let hud_origin = rect.min + vec2(16.0, 16.0);
        let now = chrono::Local::now();

        // Digital Cyber Clock Card
        let clock_rect = Rect::from_min_size(hud_origin, vec2(rect.width() - 32.0, 75.0));
        painter.rect_filled(clock_rect, Rounding::same(10.0), Color32::from_rgba_premultiplied(12, 17, 29, 210));
        painter.rect_stroke(clock_rect, Rounding::same(10.0), Stroke::new(1.0, Color32::from_rgba_premultiplied(255, 255, 255, 30)));

        painter.text(
            pos2(clock_rect.center().x, clock_rect.min.y + 24.0),
            egui::Align2::CENTER_CENTER,
            now.format("%H:%M:%S").to_string(),
            FontId::monospace(32.0),
            Color32::WHITE,
        );
        painter.text(
            pos2(clock_rect.center().x, clock_rect.min.y + 54.0),
            egui::Align2::CENTER_CENTER,
            now.format("%A · %B %d, %Y").to_string().to_uppercase(),
            FontId::proportional(11.0),
            Color32::from_rgb(148, 163, 184),
        );

        // Hardware Telemetry Gauges Row
        let gauge_y = clock_rect.max.y + 12.0;
        let gauge_rect = Rect::from_min_size(pos2(hud_origin.x, gauge_y), vec2(rect.width() - 32.0, 95.0));
        painter.rect_filled(gauge_rect, Rounding::same(10.0), Color32::from_rgba_premultiplied(12, 17, 29, 210));
        painter.rect_stroke(gauge_rect, Rounding::same(10.0), Stroke::new(1.0, Color32::from_rgba_premultiplied(255, 255, 255, 30)));

        // CPU Metric
        let col_w = gauge_rect.width() / 3.0;
        let cpu_cx = gauge_rect.min.x + col_w * 0.5;
        let cy = gauge_rect.center().y;
        painter.circle_stroke(pos2(cpu_cx, cy - 6.0), 22.0, Stroke::new(4.0, Color32::from_rgb(30, 41, 59)));
        painter.circle_stroke(pos2(cpu_cx, cy - 6.0), 22.0, Stroke::new(4.0, Color32::from_rgb(0, 242, 254)));
        painter.text(pos2(cpu_cx, cy - 6.0), egui::Align2::CENTER_CENTER, format!("{}%", self.cached_stats.cpu.usage_percent.round() as i32), FontId::monospace(12.0), Color32::WHITE);
        painter.text(pos2(cpu_cx, cy + 24.0), egui::Align2::CENTER_CENTER, "CPU LOAD", FontId::proportional(10.0), Color32::from_rgb(148, 163, 184));

        // RAM Metric
        let mem_cx = gauge_rect.min.x + col_w * 1.5;
        painter.circle_stroke(pos2(mem_cx, cy - 6.0), 22.0, Stroke::new(4.0, Color32::from_rgb(30, 41, 59)));
        painter.circle_stroke(pos2(mem_cx, cy - 6.0), 22.0, Stroke::new(4.0, Color32::from_rgb(138, 43, 226)));
        painter.text(pos2(mem_cx, cy - 6.0), egui::Align2::CENTER_CENTER, format!("{}%", self.cached_stats.memory.percent.round() as i32), FontId::monospace(12.0), Color32::WHITE);
        painter.text(pos2(mem_cx, cy + 24.0), egui::Align2::CENTER_CENTER, "RAM USAGE", FontId::proportional(10.0), Color32::from_rgb(148, 163, 184));

        // Network Metric
        let net_cx = gauge_rect.min.x + col_w * 2.5;
        painter.circle_stroke(pos2(net_cx, cy - 6.0), 22.0, Stroke::new(4.0, Color32::from_rgb(30, 41, 59)));
        painter.circle_stroke(pos2(net_cx, cy - 6.0), 22.0, Stroke::new(4.0, Color32::from_rgb(16, 185, 129)));
        let dl_str = if self.cached_stats.network.download_speed_kb >= 1024.0 {
            format!("{:.1}M", self.cached_stats.network.download_speed_kb / 1024.0)
        } else {
            format!("{}K", self.cached_stats.network.download_speed_kb.round() as i32)
        };
        painter.text(pos2(net_cx, cy - 6.0), egui::Align2::CENTER_CENTER, dl_str, FontId::monospace(11.0), Color32::WHITE);
        painter.text(pos2(net_cx, cy + 24.0), egui::Align2::CENTER_CENTER, "NET SPEED", FontId::proportional(10.0), Color32::from_rgb(148, 163, 184));

        // Audio Equalizer Spectrum Bars Card
        let eq_y = gauge_rect.max.y + 12.0;
        let eq_rect = Rect::from_min_size(pos2(hud_origin.x, eq_y), vec2(rect.width() - 32.0, 50.0));
        painter.rect_filled(eq_rect, Rounding::same(10.0), Color32::from_rgba_premultiplied(12, 17, 29, 210));
        painter.rect_stroke(eq_rect, Rounding::same(10.0), Stroke::new(1.0, Color32::from_rgba_premultiplied(255, 255, 255, 30)));

        let bar_count = 22;
        let bar_w = (eq_rect.width() - 32.0) / bar_count as f32;
        for i in 0..bar_count {
            let h = ((self.audio_phase + i as f32 * 0.4).sin() * 12.0 + 16.0).max(4.0);
            let bx = eq_rect.min.x + 16.0 + (i as f32 * bar_w);
            let by = eq_rect.max.y - 12.0;
            painter.line_segment([pos2(bx, by), pos2(bx, by - h)], Stroke::new(bar_w * 0.65, Color32::from_rgb(0, 242, 254)));
        }

        // Bottom Tip: Click to feed
        painter.text(
            pos2(rect.center().x, rect.max.y - 20.0),
            egui::Align2::CENTER_CENTER,
            "💧 Tap or Click anywhere in the aquarium to drop food",
            FontId::proportional(11.0),
            Color32::from_rgb(148, 163, 184),
        );
    }
}
