// src/workspace.rs -> holds the same info as the workspace.json in the root
// helper file for reading and modifying .env file and workspace.json file

use serde::Deserialize;
use std::env;
use std::fs;
use std::path::PathBuf;

use crate::constants;

#[derive(Debug, Clone, Deserialize)]
pub struct Workspace {
    pub apps: Apps,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Apps {
    pub audio_server: AudioServer,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AudioServer {
    pub install: String,
    pub installed: String,
}

impl Workspace {
    //gets the root of the monorepo, not the rust launcher
    fn get_project_root_dir() -> Result<PathBuf, String> {
        //locate this launcher executable folder
        let launcher_path = 
            if cfg!(debug_assertions) {
                //in debug mode (cargo run) look in the monorepo project root (brittle af but it's development)
                env::current_exe()
                    .map_err(|e| format!("System error finding launcher binary: {e}"))?
                    .parent()
                    .and_then(|p| p.parent())
                    .and_then(|p| p.parent())
                    .and_then(|p| p.parent())
                    .ok_or("The executable is buried too shallow!")?
                    .to_path_buf()
            } else {
                //in release mode look in the exe folder
                env::current_exe()
                    .map_err(|e| format!("System error finding launcher binary: {e}"))?
            };

        let project_root_dir = launcher_path.parent()
            .ok_or("Could not determine launcher directory")?
            .to_path_buf();

        Ok(project_root_dir)
    }

    pub fn resolve_path(relative_path: &str) -> Result<PathBuf, String> {
        let project_root_dir = Self::get_project_root_dir()?;
        Ok(project_root_dir.join(relative_path))
    }

    pub fn load() -> Result<Self, String> {
        //build path to workspace.json at root of the project
        let workspace_path = Self::resolve_path(constants::files::WORKSPACE)?;

        //read to string
        let workspace_content = fs::read_to_string(&workspace_path)
            .map_err(|_| format!("Could not find workspace.json at {:?}", workspace_path))?;

        //convert json to rust struct
        let workspace: Workspace = serde_json::from_str(&workspace_content)
            .map_err(|e| format!("Failed to parse workspace.json: {e}"))?;

        Ok(workspace)
    }

    pub fn update_env(key: &str, value: &str) -> Result<(), String> {        
        let env_path = Self::resolve_path(constants::files::ENV)?;

        let env_content = fs::read_to_string(&env_path)
            .unwrap_or_else(|_| String::new()); //fallback if file doesnt exist

        let mut new_lines = Vec::new();
        let mut found = false;
        let new_entry = format!("{}={}", key, value);

        for line in env_content.lines() {
            if line.starts_with(&format!("{}=", key)) {
                new_lines.push(new_entry.as_str());
                found = true;
            } else {
                new_lines.push(line);
            }
        }

        if !found {
            new_lines.push(new_entry.as_str());
        }

        fs::write(&env_path, new_lines.join("\n"))
            .map_err(|e| format!("Failed to write to .env: {}", e))
    }

    pub fn retrieve_env(key: &str) -> Option<String> {
        let env_path = Self::resolve_path(constants::files::ENV).ok()?;
        let env_content = fs::read_to_string(&env_path).ok()?;

        for line in env_content.lines() {
            let line = line.trim();
            if line.starts_with("#") || line.is_empty() { continue; }

            if let Some((k, v)) = line.split_once("=") {
                if k.trim() == key {
                    return Some(v.trim().trim_matches('"').to_string());
                }
            }
        }

        None
    }
}