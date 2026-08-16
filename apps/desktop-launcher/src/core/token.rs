use crate::constants;
use crate::workspace::{Workspace};


/// Updates the application's environment configuration with a new token.
///
/// This function persists the provided string to the local `.env` file
///
/// ### Arguments
/// * `t` - The new token string to be saved.
///
/// ### Returns
/// * `Ok(())` if the write operation was successful.
/// * `Err(String)` if the workspace was unable to update the environment file.
pub async fn run_save_token(t: String) -> Result<(), String> {
    Workspace::update_env(constants::env_keys::TOKEN, &t)
        .map_err(|e| format!("Failed to save token: {}", e))
}
