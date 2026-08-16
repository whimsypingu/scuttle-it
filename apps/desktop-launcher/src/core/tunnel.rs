use iced::{Subscription, stream, time};
use iced::futures::{Stream, SinkExt};
use iced::futures::channel::mpsc;

use reqwest;
use std::process::Stdio;
use std::path::PathBuf;
use tokio::process::Command;
use tokio::io::{BufReader, AsyncBufReadExt};

use crate::constants;
use crate::types::{Message, ServiceStatus};
use crate::workspace::{Workspace};


/// When this guard is dropped (e.g., when the `tunnel_worker` stream ends or the 
/// subscription is cancelled), it automatically attempts to kill the underlying 
/// process. This prevents "zombie" Python processes from lingering in the background 
/// after the UI is closed or the server is stopped.
struct ChildGuard(tokio::process::Child);

impl Drop for ChildGuard {
    fn drop(&mut self) {
        //attempt to kill the process, ignoring the result if already dead
        let _ = self.0.start_kill();
    }
}


/// Manages the lifecycle of the tunnel process based on the application state.
///
/// If the `ServiceStatus` is `Starting` or `Running`, this subscription ensures 
/// the `tunnel_worker` is active. If the status changes to anything else (Idle or Errored), 
/// Iced will automatically drop the existing worker, triggering the `ChildGuard` 
/// to terminate the tunnel process.
pub fn tunnel_subscription(server_status: &ServiceStatus, tunnel_status: &ServiceStatus) -> Subscription<Message> {
    //requires server = RUNNING and tunnel = STARTING | RUNNING
    let should_run = matches!(server_status, ServiceStatus::Running) && matches!(tunnel_status, ServiceStatus::Starting | ServiceStatus::Running);

    if should_run {
        Subscription::run(tunnel_worker)
    } else {
        Subscription::none()
    }
}


/// The background worker responsible for spawning and monitoring the tunnel (assumes Cloudflared executable).
///
/// This worker performs the following steps:
/// 1. **Configuration**: Resolves Tunnel path, Host (127.0.0.1 default), Port, and Root Directory from the environment.
/// 2. **Process Spawning**: Starts the tunnel as a `tokio::process::Command`.
/// 3. **Process Guarding**: Wraps the process in a `ChildGuard` for automatic cleanup.
/// 4. **Log Streaming**: Pipes `stderr` into the 
///    Iced message stream via `Message::TunnelLog`.
///
/// Returns a `Stream` of `Message` variants to be handled by the main `update` loop.
pub fn tunnel_worker() -> impl Stream<Item = Message> {
    stream::channel(100, |mut output: mpsc::Sender<Message>| async move {

        //helper enum to represent execution mode
        enum Mode {
            Persistent(String), //persistent tunnel mode
            Quick(String), //ephemeral
        }

        let config = (|| -> Result<(String, PathBuf, Mode), String> {
            let tunnel_bin = Workspace::retrieve_env(constants::env_keys::TUNNEL)
                .ok_or("Tunnel executable not setup correctly in env")?;

            let root_dir = Workspace::get_project_root_dir()
                .map_err(|_| "Could not find project root directory")?;

            let token = Workspace::retrieve_env(constants::env_keys::TOKEN);
            
            if let Some(token) = token {
                Ok((tunnel_bin, root_dir, Mode::Persistent(token)))
            } else {
                let port = Workspace::retrieve_env(constants::env_keys::PORT)
                    .ok_or("Port not setup correctly in env")?;
                let host = constants::DEFAULT_HOST.to_string();
                let target_url = format!("http://{}:{}/", host, port);

                Ok((tunnel_bin, root_dir, Mode::Quick(target_url)))
            }
        })();

        //if any gathrered required env vars failed error and bail
        let (tunnel_bin, root_dir, mode) = match config {
            Ok(values) => values,
            Err(e) => {
                let _ = output.send(Message::StopServer(Err(e.to_string()))).await;
                return;
            }
        };

        // --- 2. Command Preparation ---
        let mut cmd = Command::new(tunnel_bin);
        cmd.current_dir(root_dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        match &mode {
            Mode::Persistent(token) => {
                cmd.args(["tunnel", "run", "--token", token]);
            }
            Mode::Quick(target_url) => {
                cmd.args(["tunnel", "--url", target_url]);
            }
        }

        #[cfg(windows)]
        {
            cmd.creation_flags(constants::CREATE_NO_WINDOW);
        }
        
        // --- 3. Process Execution & Monitoring ---
        let mut url_detected = false;
        match cmd.spawn() {
            Ok(child) => {
                let mut guarded_child = ChildGuard(child); //ensure killed when subscription ends

                let stderr = guarded_child.0.stderr.take().unwrap(); //cloudflared logging goes to stderr
                let mut reader = BufReader::new(stderr).lines();

                while let Ok(Some(line)) = reader.next_line().await {
                    let _ = output.send(Message::TunnelLog(line.clone())).await;

                    //check if it is the url
                    if !url_detected {
                        let detected_url = match &mode {
                            Mode::Persistent(_) if line.contains("hostname") => {
                                extract_persistent_cloudflared_url(&line)
                            }
                            Mode::Quick(_) if line.contains(".trycloudflare.com") => {
                                extract_cloudflared_url(&line)
                            }
                            _ => None,
                        };

                        if let Some(url) = detected_url {
                            let _ = output.send(Message::SetTunnelUrl(url)).await;
                            url_detected = true;
                        }
                    }
                    // if matches!(mode, Mode::Quick(_))
                    //     && !url_detected 
                    //     && line.contains(".trycloudflare.com")
                    // {
                    //     if let Some(url) = extract_cloudflared_url(&line) {
                    //         let _ = output.send(Message::SetTunnelUrl(url)).await;
                    //         url_detected = true;
                    //     }
                    // }
                }
            },
            Err(e) => {
                let err_msg = format!("Spawn failed: {e}");
                let _ = output.send(Message::StopTunnel(Err(err_msg))).await;
                return;
            }
        }
    })
}

fn extract_cloudflared_url(line: &str) -> Option<String> {
    let start_pattern = "https://";
    let end_pattern = ".trycloudflare.com";

    if let Some(start_idx) = line.find(start_pattern) {
        if let Some(end_offset) = line[start_idx..].find(end_pattern) {
            let end_idx = start_idx + end_offset + end_pattern.len();
            return Some(line[start_idx..end_idx].to_string());
        }
    }

    None
}

fn extract_persistent_cloudflared_url(line: &str) -> Option<String> {
    let cleaned = line.replace('\\', "");

    let start_pattern = "\"hostname\":\"";
    let end_pattern = "\"";

    if let Some(start_idx) = cleaned.find(start_pattern) {
        let val_start = start_idx + start_pattern.len(); //start looking for stuff after this point
        let rest = &cleaned[val_start..];

        if let Some(end_idx) = rest.find(end_pattern) {
            let domain = &rest[..end_idx];
            return Some(format!("https://{}", domain));
        }
    }

    None
}

/// Monitors the health of the tunnel based on its current status.
///
/// This subscription manages a "heartbeat" tick that varies in frequency:
/// - **Starting**: Ticks every 1 second to catch the tunnel as soon as it's ready.
/// - **Running**: Ticks every 60 seconds to maintain a low-overhead health check.
/// - **Other (Idle/Errored)**: No timer is active to save resources.
///
/// Returns a `Message::TunnelHealthTick` which triggers a background health check task.
pub fn tunnel_health_subscription(server_status: &ServiceStatus, tunnel_status: &ServiceStatus) -> Subscription<Message> {
    //requires server = RUNNING and tunnel = RUNNING
    let is_active = matches!(server_status, ServiceStatus::Running) && matches!(tunnel_status, ServiceStatus::Running);

    if is_active {
        let duration = time::Duration::from_secs(constants::HEALTH_CHECK_RUNNING_INTERVAL);
        time::every(duration).map(|_| Message::TunnelHealthTick)
    } else {
        Subscription::none()
    }
}


/// Performs an asynchronous health check against the backend tunnel.
/// This function attempts to connect to the `/status` endpoint of the tunnel.
///
/// ### Arguments
/// * `client` - A reusable `reqwest::Client` (should be cloned from the App state).
/// * `url` - The url endpoint of the tunnel.
///
/// ### Returns
/// * `Ok(())` if the tunnel responds with a 2xx success code.
/// * `Err(String)` if the connection fails or the tunnel returns an error status.
pub async fn run_tunnel_health_check(client: reqwest::Client, url: Option<String>) -> Result<(), String> {
    let base_url = url.ok_or("No tunnel URL available to check")?; //guard None url

    let status_endpoint = format!("{}/status", base_url); //server status endpoint (consider trimming potential end / chars in case, but cloudflared doesn't have them)

    //just return whether request worked or not for returning Ok or not
    match client.get(status_endpoint).send().await {
        Ok(resp) if resp.status().is_success() => Ok(()), //200-299 status codes
        Ok(resp) => Err(format!("Tunnel returned status: {}", resp.status())), //tunnel up but erroring
        Err(e) => Err(format!("Connection failed: {}", e)),
    }
}

