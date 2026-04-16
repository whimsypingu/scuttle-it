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


/// Sends a JSON-formatted notification message to the configured webhook.
///
/// This function retrieves the webhook URL from the environment on every call to ensure
/// it uses the most recently saved configuration.
///
/// ### Arguments
/// * `client` - A shared `reqwest::Client` (reusing a client is recommended for connection pooling).
/// * `content` - The raw string message to send (typically formatted with Markdown).
///
/// ### Errors
/// Returns an error if:
/// * The webhook URL is missing from the environment.
/// * The network request fails or times out.
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


/// Helper functions for generating standardized Markdown messages for external notifications.
pub mod notifications {

    /// Generates a status message for the local server access URL.
    ///
    /// This function attempts to retrieve the system's hostname to provide a 
    /// user-friendly `.local` address (mDNS). If the hostname is successfully 
    /// retrieved, it returns a success message; otherwise, it returns a 
    /// warning indicating that the hostname could not be determined.
    ///
    /// ### Returns
    /// A formatted string intended for notifications (e.g., via Webhooks).
    pub fn server_url_access(port: String) -> String {
        let host = hostname::get()
            .ok()
            .and_then(|h| h.into_string().ok());

        match host {
            Some(h) => {
                let u = format!("http://{}.local:{}", h, port);
                format!("Server Online - [Scuttle Locally]({})", u)
            }
            None => {
                ("Server Warning - The server worker reported a start, but no local hostname was found.").to_string()
            }
        }
    }

    /// Formats a message indicating the network tunnel is live.
    ///
    /// If `url` is `None`, it generates a warning message suggesting a parsing failure.
    /// 
    /// ### Output Example
    /// **Tunnel Online**
    /// URL: `https://example.trycloudflare.com`
    pub fn tunnel_url_access(url: Option<String>) -> String {
        match url {
            Some(u) => {
                format!("Tunnel Online - [Scuttle]({})", u)
            }
            None => {
                ("Tunnel Warning - The tunnel worker reported a start, but no URL was found.").to_string()
            }
        }
    }

    /// Formats an error message when a service fails a health check.
    ///
    /// ### Arguments
    /// * `name` - The name of the service (e.g., "Audio Server" or "Tunnel").
    /// * `err` - The error message or status code received.    
    pub fn health_check_failed(name: &str, err: &str) -> String {
        format!("Health Check Failed: `{}` is unresponsive.\n{} Error\nAttempting restart...", name, err)
    }
}