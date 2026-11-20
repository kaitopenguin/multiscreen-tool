use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use sysinfo::{CpuRefreshKind, Disks, Networks, RefreshKind, System};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuData {
    pub usage_percent: f32,
    pub brand: String,
    pub core_count: usize,
    pub core_usages: Vec<f32>,
    pub frequency_mhz: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryData {
    pub used_gb: f32,
    pub total_gb: f32,
    pub percent: f32,
    pub swap_used_gb: f32,
    pub swap_total_gb: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskData {
    pub name: String,
    pub mount_point: String,
    pub used_gb: f32,
    pub total_gb: f32,
    pub percent: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkData {
    pub download_speed_kb: f32,
    pub upload_speed_kb: f32,
    pub total_received_mb: f64,
    pub total_transmitted_mb: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemStats {
    pub timestamp: i64,
    pub uptime_secs: u64,
    pub cpu: CpuData,
    pub memory: MemoryData,
    pub disks: Vec<DiskData>,
    pub network: NetworkData,
    pub process_count: usize,
}

pub struct StatsCollector {
    sys: Arc<Mutex<System>>,
    disks: Arc<Mutex<Disks>>,
    networks: Arc<Mutex<Networks>>,
    last_network_check: Arc<Mutex<Instant>>,
}

impl StatsCollector {
    pub fn new() -> Self {
        let mut sys = System::new_with_specifics(
            RefreshKind::everything()
                .with_cpu(CpuRefreshKind::everything()),
        );
        sys.refresh_all();
        let disks = Disks::new_with_refreshed_list();
        let networks = Networks::new_with_refreshed_list();

        Self {
            sys: Arc::new(Mutex::new(sys)),
            disks: Arc::new(Mutex::new(disks)),
            networks: Arc::new(Mutex::new(networks)),
            last_network_check: Arc::new(Mutex::new(Instant::now())),
        }
    }

    pub fn collect(&self) -> SystemStats {
        let mut sys = self.sys.lock().unwrap();
        sys.refresh_cpu_all();
        sys.refresh_memory();
        sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

        let cpus = sys.cpus();
        let core_usages: Vec<f32> = cpus.iter().map(|c| c.cpu_usage()).collect();
        let cpu_brand = cpus
            .first()
            .map(|c| c.brand().trim().to_string())
            .unwrap_or_else(|| "Unknown CPU".to_string());
        let freq = cpus.first().map(|c| c.frequency()).unwrap_or(0);
        let global_usage = sys.global_cpu_usage();

        let total_mem = sys.total_memory() as f32 / 1_073_741_824.0;
        let used_mem = sys.used_memory() as f32 / 1_073_741_824.0;
        let mem_percent = if total_mem > 0.0 {
            (used_mem / total_mem) * 100.0
        } else {
            0.0
        };

        let total_swap = sys.total_swap() as f32 / 1_073_741_824.0;
        let used_swap = sys.used_swap() as f32 / 1_073_741_824.0;

        // Disks
        let mut disks = self.disks.lock().unwrap();
        disks.refresh();
        let mut disk_data = Vec::new();
        for disk in disks.iter() {
            let total = disk.total_space() as f32 / 1_073_741_824.0;
            let available = disk.available_space() as f32 / 1_073_741_824.0;
            let used = (total - available).max(0.0);
            let pct = if total > 0.0 { (used / total) * 100.0 } else { 0.0 };
            disk_data.push(DiskData {
                name: disk.name().to_string_lossy().to_string(),
                mount_point: disk.mount_point().to_string_lossy().to_string(),
                used_gb: (used * 10.0).round() / 10.0,
                total_gb: (total * 10.0).round() / 10.0,
                percent: (pct * 10.0).round() / 10.0,
            });
        }

        // Networks
        let mut networks = self.networks.lock().unwrap();
        networks.refresh();
        let mut last_check = self.last_network_check.lock().unwrap();
        let elapsed = last_check.elapsed().as_secs_f32().max(0.1);
        *last_check = Instant::now();

        let mut received_bytes = 0u64;
        let mut transmitted_bytes = 0u64;
        let mut total_rx = 0u64;
        let mut total_tx = 0u64;

        for (_name, net) in networks.iter() {
            received_bytes += net.received();
            transmitted_bytes += net.transmitted();
            total_rx += net.total_received();
            total_tx += net.total_transmitted();
        }

        let dl_kb = (received_bytes as f32 / 1024.0) / elapsed;
        let ul_kb = (transmitted_bytes as f32 / 1024.0) / elapsed;

        SystemStats {
            timestamp: chrono::Utc::now().timestamp_millis(),
            uptime_secs: System::uptime(),
            cpu: CpuData {
                usage_percent: (global_usage * 10.0).round() / 10.0,
                brand: cpu_brand,
                core_count: cpus.len(),
                core_usages,
                frequency_mhz: freq,
            },
            memory: MemoryData {
                used_gb: (used_mem * 100.0).round() / 100.0,
                total_gb: (total_mem * 100.0).round() / 100.0,
                percent: (mem_percent * 10.0).round() / 10.0,
                swap_used_gb: (used_swap * 100.0).round() / 100.0,
                swap_total_gb: (total_swap * 100.0).round() / 100.0,
            },
            disks: disk_data,
            network: NetworkData {
                download_speed_kb: (dl_kb * 10.0).round() / 10.0,
                upload_speed_kb: (ul_kb * 10.0).round() / 10.0,
                total_received_mb: ((total_rx as f64 / 1_048_576.0) * 10.0).round() / 10.0,
                total_transmitted_mb: ((total_tx as f64 / 1_048_576.0) * 10.0).round() / 10.0,
            },
            process_count: sys.processes().len(),
        }
    }
}
