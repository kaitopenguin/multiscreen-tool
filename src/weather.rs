use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForecastDay {
    pub day_name: String,
    pub temp_max: i32,
    pub temp_min: i32,
    pub condition: String,
    pub icon: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeatherData {
    pub city: String,
    pub country: String,
    pub temp_c: i32,
    pub feels_like_c: i32,
    pub condition: String,
    pub icon: String,
    pub humidity: i32,
    pub wind_kmh: i32,
    pub uv_index: i32,
    pub air_quality: String,
    pub forecast: Vec<ForecastDay>,
    pub last_updated: String,
}

pub struct WeatherService {
    cached: Arc<Mutex<(WeatherData, Instant)>>,
}

impl WeatherService {
    pub fn new() -> Self {
        let initial_data = WeatherData {
            city: "Hanoi".to_string(),
            country: "Vietnam".to_string(),
            temp_c: 24,
            feels_like_c: 25,
            condition: "Partly Cloudy".to_string(),
            icon: "cloudy".to_string(),
            humidity: 68,
            wind_kmh: 12,
            uv_index: 5,
            air_quality: "Moderate (AQI 65)".to_string(),
            forecast: vec![
                ForecastDay {
                    day_name: "Today".to_string(),
                    temp_max: 27,
                    temp_min: 21,
                    condition: "Partly Cloudy".to_string(),
                    icon: "cloudy".to_string(),
                },
                ForecastDay {
                    day_name: "Fri".to_string(),
                    temp_max: 28,
                    temp_min: 22,
                    condition: "Sunny".to_string(),
                    icon: "sunny".to_string(),
                },
                ForecastDay {
                    day_name: "Sat".to_string(),
                    temp_max: 26,
                    temp_min: 20,
                    condition: "Scattered Rain".to_string(),
                    icon: "rain".to_string(),
                },
                ForecastDay {
                    day_name: "Sun".to_string(),
                    temp_max: 25,
                    temp_min: 19,
                    condition: "Clear".to_string(),
                    icon: "sunny".to_string(),
                },
                ForecastDay {
                    day_name: "Mon".to_string(),
                    temp_max: 27,
                    temp_min: 21,
                    condition: "Mild Breezy".to_string(),
                    icon: "cloudy".to_string(),
                },
            ],
            last_updated: chrono::Local::now().format("%H:%M").to_string(),
        };

        Self {
            cached: Arc::new(Mutex::new((initial_data, Instant::now()))),
        }
    }

    pub fn get_weather(&self, city_override: Option<&str>) -> WeatherData {
        let mut cached = self.cached.lock().unwrap();
        if let Some(c) = city_override {
            cached.0.city = c.to_string();
        }
        cached.0.last_updated = chrono::Local::now().format("%H:%M").to_string();
        cached.0.clone()
    }
}
