use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::time::Instant;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ModelCategory {
    #[serde(rename = "ai")]
    AiCompanion,
    #[serde(rename = "creature")]
    VirtualCreature,
    #[serde(rename = "theme")]
    VisualTheme,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum RotationStrategy {
    #[serde(rename = "round_robin")]
    RoundRobin,
    #[serde(rename = "timed")]
    Timed,
    #[serde(rename = "failover")]
    Failover,
    #[serde(rename = "manual")]
    Manual,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelItem {
    pub id: String,
    pub name: String,
    pub category: ModelCategory,
    pub provider: String,     // e.g. "Google", "Anthropic", "OpenAI", "DeepSeek", "Ollama", "Aquarium"
    pub endpoint_or_tag: String, // model ID or sprite sheet / 3D model tag
    pub description: String,
    pub enabled: bool,
    pub latency_ms: u32,
    pub total_calls: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RotatorConfig {
    pub strategy: RotationStrategy,
    pub rotation_interval_secs: u64,
    pub auto_rotate_on_chat: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RotatorState {
    pub active_ai_model_id: String,
    pub active_creature_id: String,
    pub active_theme_id: String,
    pub config: RotatorConfig,
    pub models: Vec<ModelItem>,
    pub last_rotation_timestamp: i64,
}

pub struct ModelRotator {
    state: Arc<Mutex<RotatorState>>,
    last_timed_rotation: Arc<Mutex<Instant>>,
}

impl ModelRotator {
    pub fn new() -> Self {
        let initial_models = vec![
            // --- AI Models ---
            ModelItem {
                id: "gemini-2.0-flash".to_string(),
                name: "Gemini 2.0 Flash".to_string(),
                category: ModelCategory::AiCompanion,
                provider: "Google".to_string(),
                endpoint_or_tag: "gemini-2.0-flash".to_string(),
                description: "Sub-second multimodal responses, ideal for real-time dashboard companion".to_string(),
                enabled: true,
                latency_ms: 180,
                total_calls: 0,
            },
            ModelItem {
                id: "claude-3-5-sonnet".to_string(),
                name: "Claude 3.5 Sonnet".to_string(),
                category: ModelCategory::AiCompanion,
                provider: "Anthropic".to_string(),
                endpoint_or_tag: "claude-3-5-sonnet-20241022".to_string(),
                description: "Top-tier reasoning and coding assistant on secondary screen".to_string(),
                enabled: true,
                latency_ms: 450,
                total_calls: 0,
            },
            ModelItem {
                id: "gpt-4o-mini".to_string(),
                name: "GPT-4o Mini".to_string(),
                category: ModelCategory::AiCompanion,
                provider: "OpenAI".to_string(),
                endpoint_or_tag: "gpt-4o-mini".to_string(),
                description: "Fast, cost-efficient conversational companion".to_string(),
                enabled: true,
                latency_ms: 220,
                total_calls: 0,
            },
            ModelItem {
                id: "deepseek-v3".to_string(),
                name: "DeepSeek V3".to_string(),
                category: ModelCategory::AiCompanion,
                provider: "DeepSeek".to_string(),
                endpoint_or_tag: "deepseek-chat".to_string(),
                description: "High-intelligence open reasoning model".to_string(),
                enabled: true,
                latency_ms: 320,
                total_calls: 0,
            },
            ModelItem {
                id: "ollama-local".to_string(),
                name: "Ollama Local (Llama 3.2)".to_string(),
                category: ModelCategory::AiCompanion,
                provider: "Local Ollama".to_string(),
                endpoint_or_tag: "llama3.2:latest".to_string(),
                description: "100% offline, private on-device LLM model".to_string(),
                enabled: true,
                latency_ms: 95,
                total_calls: 0,
            },
            // --- Virtual Creature Models ---
            ModelItem {
                id: "creature-koi".to_string(),
                name: "Japanese Nishikigoi".to_string(),
                category: ModelCategory::VirtualCreature,
                provider: "Aquatic".to_string(),
                endpoint_or_tag: "koi_gold_white".to_string(),
                description: "Graceful spotted koi fish swimming with realistic water drag physics".to_string(),
                enabled: true,
                latency_ms: 0,
                total_calls: 0,
            },
            ModelItem {
                id: "creature-axolotl".to_string(),
                name: "Pink Axolotl".to_string(),
                category: ModelCategory::VirtualCreature,
                provider: "Terrarium".to_string(),
                endpoint_or_tag: "axolotl_lucistic".to_string(),
                description: "Cute floating amphibian with dynamic feathery gill physics".to_string(),
                enabled: true,
                latency_ms: 0,
                total_calls: 0,
            },
            ModelItem {
                id: "creature-jellyfish".to_string(),
                name: "Bioluminescent Jellyfish".to_string(),
                category: ModelCategory::VirtualCreature,
                provider: "Deep Sea".to_string(),
                endpoint_or_tag: "jellyfish_aurora".to_string(),
                description: "Pulsating translucent bell with bioluminescent tentacle trails".to_string(),
                enabled: true,
                latency_ms: 0,
                total_calls: 0,
            },
            ModelItem {
                id: "creature-neko".to_string(),
                name: "Cyber Neko Companion".to_string(),
                category: ModelCategory::VirtualCreature,
                provider: "Desktop Pet".to_string(),
                endpoint_or_tag: "cyber_cat_pixel".to_string(),
                description: "Interactive cybernetic cat walking along widget edges".to_string(),
                enabled: true,
                latency_ms: 0,
                total_calls: 0,
            },
            ModelItem {
                id: "creature-dragon".to_string(),
                name: "Miniature Cyber Dragon".to_string(),
                category: ModelCategory::VirtualCreature,
                provider: "Fantasy".to_string(),
                endpoint_or_tag: "dragon_neon".to_string(),
                description: "Glowing serpentine dragon gliding through the background".to_string(),
                enabled: true,
                latency_ms: 0,
                total_calls: 0,
            },
            // --- Visual Themes ---
            ModelItem {
                id: "theme-cyberpunk".to_string(),
                name: "Cyberpunk HUD".to_string(),
                category: ModelCategory::VisualTheme,
                provider: "Impeccable UI".to_string(),
                endpoint_or_tag: "neon_slate".to_string(),
                description: "Dark slate `#090d16` with neon cyan `#00f2fe` and purple glow".to_string(),
                enabled: true,
                latency_ms: 0,
                total_calls: 0,
            },
            ModelItem {
                id: "theme-aquarium".to_string(),
                name: "Deep Ocean Aquarium".to_string(),
                category: ModelCategory::VisualTheme,
                provider: "Marine".to_string(),
                endpoint_or_tag: "ocean_reef".to_string(),
                description: "Bioluminescent underwater atmosphere with coral reflections".to_string(),
                enabled: true,
                latency_ms: 0,
                total_calls: 0,
            },
            ModelItem {
                id: "theme-synthwave".to_string(),
                name: "80s Retro Synthwave".to_string(),
                category: ModelCategory::VisualTheme,
                provider: "Retro Wave".to_string(),
                endpoint_or_tag: "neon_sunset".to_string(),
                description: "Sunset magenta and violet grid skyline".to_string(),
                enabled: true,
                latency_ms: 0,
                total_calls: 0,
            },
        ];

        let state = RotatorState {
            active_ai_model_id: "gemini-2.0-flash".to_string(),
            active_creature_id: "creature-koi".to_string(),
            active_theme_id: "theme-cyberpunk".to_string(),
            config: RotatorConfig {
                strategy: RotationStrategy::RoundRobin,
                rotation_interval_secs: 300, // 5 minutes
                auto_rotate_on_chat: true,
            },
            models: initial_models,
            last_rotation_timestamp: chrono::Utc::now().timestamp(),
        };

        Self {
            state: Arc::new(Mutex::new(state)),
            last_timed_rotation: Arc::new(Mutex::new(Instant::now())),
        }
    }

    pub fn get_state(&self) -> RotatorState {
        self.state.lock().unwrap().clone()
    }

    pub fn rotate_category(&self, category: ModelCategory) -> ModelItem {
        let mut state = self.state.lock().unwrap();
        let eligible: Vec<ModelItem> = state
            .models
            .iter()
            .filter(|m| m.category == category && m.enabled)
            .cloned()
            .collect();

        if eligible.is_empty() {
            panic!("No enabled models in category");
        }

        let current_id = match category {
            ModelCategory::AiCompanion => &state.active_ai_model_id,
            ModelCategory::VirtualCreature => &state.active_creature_id,
            ModelCategory::VisualTheme => &state.active_theme_id,
        };

        let current_idx = eligible.iter().position(|m| &m.id == current_id).unwrap_or(0);
        let next_idx = (current_idx + 1) % eligible.len();
        let next_model = eligible[next_idx].clone();

        match category {
            ModelCategory::AiCompanion => state.active_ai_model_id = next_model.id.clone(),
            ModelCategory::VirtualCreature => state.active_creature_id = next_model.id.clone(),
            ModelCategory::VisualTheme => state.active_theme_id = next_model.id.clone(),
        }

        state.last_rotation_timestamp = chrono::Utc::now().timestamp();
        next_model
    }

    pub fn set_active_model(&self, model_id: &str) -> Option<ModelItem> {
        let mut state = self.state.lock().unwrap();
        let target = state.models.iter().find(|m| m.id == model_id)?.clone();

        match target.category {
            ModelCategory::AiCompanion => state.active_ai_model_id = target.id.clone(),
            ModelCategory::VirtualCreature => state.active_creature_id = target.id.clone(),
            ModelCategory::VisualTheme => state.active_theme_id = target.id.clone(),
        }

        state.last_rotation_timestamp = chrono::Utc::now().timestamp();
        Some(target)
    }

    pub fn update_config(&self, config: RotatorConfig) {
        let mut state = self.state.lock().unwrap();
        state.config = config;
    }

    pub fn add_model(&self, model: ModelItem) {
        let mut state = self.state.lock().unwrap();
        // Remove existing with same id if any
        state.models.retain(|m| m.id != model.id);
        state.models.push(model);
    }

    pub fn check_timed_rotation(&self) -> Option<(ModelCategory, ModelItem)> {
        let state = self.state.lock().unwrap();
        if state.config.strategy != RotationStrategy::Timed {
            return None;
        }

        let interval = state.config.rotation_interval_secs;
        drop(state);

        let mut last = self.last_timed_rotation.lock().unwrap();
        if last.elapsed().as_secs() >= interval {
            *last = Instant::now();
            let rotated = self.rotate_category(ModelCategory::AiCompanion);
            return Some((ModelCategory::AiCompanion, rotated));
        }
        None
    }
}
