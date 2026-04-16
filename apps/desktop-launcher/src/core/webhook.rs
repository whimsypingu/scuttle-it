use reqwest;
use serde_json;

use crate::constants;
use crate::workspace::{Workspace};


/// Updates the application's environment configuration with a new webhook URL.
///
/// This function persists the provided string to the local `.env` file
///
/// ### Arguments
/// * `w` - The new webhook URL string to be saved.
///
/// ### Returns
/// * `Ok(())` if the write operation was successful.
/// * `Err(String)` if the workspace was unable to update the environment file.
pub async fn run_save_webhook(w: String) -> Result<(), String> {
    Workspace::update_env(constants::env_keys::WEBHOOK, &w)
        .map_err(|e| format!("Failed to save webhook: {}", e))
}




pub async fn notify_webhook(
    client: reqwest::Client,
    content: String 
) -> Result<(), String> {
    //bail if no webhook found
    let webhook = Workspace::retrieve_env(constants::env_keys::WEBHOOK)
        .ok_or("Webhook not found in environment")?;

    let body = serde_json::json!({ 
        "content": content
    });

    client.post(webhook)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}


pub mod notifications {
    pub fn tunnel_url_access(url: Option<String>) -> String {
        match url {
            Some(u) => {
                format!("**Tunnel Online**\nURL: `{}`", u)
            }
            None => {
                ("**Tunnel Warning**\nThe tunnel worker reported a start, but no URL was found.").to_string()
            }
        }
    }

    pub fn service_error(name: &str, err: &str) -> String {
        format!("**{} Error **\n```\n{}```", name, err)
    }

    pub fn health_check_failed(name: &str, err: &str) -> String {
        format!("**Health Check Failed**: `{}` is unresponsive.\n**{} Error**\nAttempting restart.", name, err)
    }
}