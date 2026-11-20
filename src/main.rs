mod model_rotator;
mod monitors;
mod native_app;
mod system_stats;
mod wallpaper;
mod weather;

use native_app::MultiscreenNativeApp;

fn main() -> Result<(), eframe::Error> {
    println!("============================================================");
    println!("  MULTISCREEN TOOL v1.0.0 - Native Low-RAM Desktop Engine");
    println!("  Pure Native Rust GUI powered by egui/eframe");
    println!("============================================================");

    // Enumerate connected displays
    let detected_monitors = monitors::get_all_monitors();
    println!("\nDetected {} Connected Monitor(s):", detected_monitors.len());
    for m in &detected_monitors {
        println!(
            "  - [{}] {} | {} | {}x{} at ({}, {}) | Primary: {}",
            m.id, m.name, m.orientation, m.width, m.height, m.x, m.y, m.is_primary
        );
    }

    // Configure Native GUI Window options
    let native_options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_title("Multiscreen Tool")
            .with_inner_size([960.0, 720.0])
            .with_min_inner_size([400.0, 500.0])
            .with_active(true),
        ..Default::default()
    };

    println!("\nLaunching native Rust window with ultra-low RAM footprint (~25MB)...");

    eframe::run_native(
        "Multiscreen Tool",
        native_options,
        Box::new(|cc| Ok(Box::new(MultiscreenNativeApp::new(cc)))),
    )
}
