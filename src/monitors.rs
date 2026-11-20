use serde::{Deserialize, Serialize};
use std::mem::size_of;
use std::sync::Mutex;
use windows_sys::Win32::Foundation::{BOOL, LPARAM, RECT};
use windows_sys::Win32::Graphics::Gdi::{
    EnumDisplayMonitors, GetMonitorInfoW, HDC, HMONITOR, MONITORINFOEXW,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorInfo {
    pub id: usize,
    pub name: String,
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
    pub is_primary: bool,
    pub orientation: String, // "Landscape" or "Portrait"
    pub refresh_rate: u32,
    pub aspect_ratio: String,
    pub relative_position: String, // e.g. "Left of Main Display", "Primary (Center)"
}

static MONITORS: Mutex<Vec<MonitorInfo>> = Mutex::new(Vec::new());

unsafe extern "system" fn monitor_enum_proc(
    hmonitor: HMONITOR,
    _hdc: HDC,
    _rect: *mut RECT,
    _lparam: LPARAM,
) -> BOOL {
    let mut info: MONITORINFOEXW = std::mem::zeroed();
    info.monitorInfo.cbSize = size_of::<MONITORINFOEXW>() as u32;

    if GetMonitorInfoW(hmonitor, &mut info as *mut _ as *mut _) != 0 {
        let name_utf16: Vec<u16> = info
            .szDevice
            .iter()
            .take_while(|&&c| c != 0)
            .copied()
            .collect();
        let name = String::from_utf16_lossy(&name_utf16);

        let x = info.monitorInfo.rcMonitor.left;
        let y = info.monitorInfo.rcMonitor.top;
        let width = (info.monitorInfo.rcMonitor.right - info.monitorInfo.rcMonitor.left).abs();
        let height = (info.monitorInfo.rcMonitor.bottom - info.monitorInfo.rcMonitor.top).abs();
        let is_primary = (info.monitorInfo.dwFlags & 1) != 0;

        let orientation = if width >= height {
            "Landscape".to_string()
        } else {
            "Portrait".to_string()
        };

        let aspect_ratio = format!("{}:{}", width / gcd(width, height), height / gcd(width, height));

        if let Ok(mut list) = MONITORS.lock() {
            let id = list.len();
            list.push(MonitorInfo {
                id,
                name,
                x,
                y,
                width,
                height,
                is_primary,
                orientation,
                refresh_rate: 60,
                aspect_ratio,
                relative_position: "Center".to_string(),
            });
        }
    }

    1 // Continue enumeration
}

fn gcd(mut a: i32, mut b: i32) -> i32 {
    while b != 0 {
        let t = b;
        b = a % b;
        a = t;
    }
    if a <= 0 { 1 } else { a }
}

pub fn get_all_monitors() -> Vec<MonitorInfo> {
    if let Ok(mut list) = MONITORS.lock() {
        list.clear();
    }

    unsafe {
        EnumDisplayMonitors(std::ptr::null_mut(), std::ptr::null(), Some(monitor_enum_proc), 0);
    }

    if let Ok(mut list) = MONITORS.lock() {
        let primary_x = list.iter().find(|m| m.is_primary).map(|m| m.x).unwrap_or(0);
        let primary_y = list.iter().find(|m| m.is_primary).map(|m| m.y).unwrap_or(0);

        for m in list.iter_mut() {
            if m.is_primary {
                m.relative_position = "Primary (Center)".to_string();
            } else if m.x < primary_x {
                m.relative_position = "Left of Main Display".to_string();
            } else if m.x > primary_x {
                m.relative_position = "Right of Main Display".to_string();
            } else if m.y < primary_y {
                m.relative_position = "Above Main Display".to_string();
            } else if m.y > primary_y {
                m.relative_position = "Below Main Display".to_string();
            }
        }

        list.clone()
    } else {
        Vec::new()
    }
}
