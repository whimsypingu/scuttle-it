use iced::{Subscription, stream, time};
use iced::futures::{Stream, SinkExt};
use iced::futures::channel::mpsc;

use reqwest;
use std::process::Stdio;
use tokio::process::Command;
use tokio::io::{BufReader, AsyncBufReadExt};

use crate::constants;
use crate::types::{Message, ServiceStatus};
use crate::workspace::{Workspace};


/// When this guard is dropped (e.g., when the `server_worker` stream ends or the 
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


/// Manages the lifecycle of the Python server process based on the application state.
///
/// If the `ServiceStatus` is `Starting` or `Running`, this subscription ensures 
/// the `server_worker` is active. If the status changes to anything else (Idle or Errored), 
/// Iced will automatically drop the existing worker, triggering the `ChildGuard` 
/// to terminate the Python process.
pub fn server_subscription(server_status: &ServiceStatus) -> Subscription<Message> {
    //requires server = STARTING | RUNNING
    let should_run = matches!(server_status, ServiceStatus::Starting | ServiceStatus::Running);

    if should_run {
        Subscription::run(server_worker)
    } else {
        Subscription::none()
    }
}


/// The background worker responsible for spawning and monitoring the Python Uvicorn server.
///
/// This worker performs the following steps:
/// 1. **Configuration**: Resolves Python path, Host, Port, and Root Directory from the environment.
/// 2. **Process Spawning**: Starts the Uvicorn server as a `tokio::process::Command`.
/// 3. **Process Guarding**: Wraps the process in a `ChildGuard` for automatic cleanup.
/// 4. **Log Streaming**: Pipes `stderr` (where Uvicorn typically sends logs) into the 
///    Iced message stream via `Message::ServerLog`.
///
/// Returns a `Stream` of `Message` variants to be handled by the main `update` loop.
pub fn server_worker() -> impl Stream<Item = Message> {
    stream::channel(100, |mut output: mpsc::Sender<Message>| async move {
        // --- 1. Environment Configuration ---
        // Uses functional chaining to gather all required variables or bail with an error.
        let config = Workspace::retrieve_env(constants::env_keys::PYTHON)   
            .ok_or("Python executable not setup correctly in env")
            .and_then(|py| Workspace::retrieve_env(constants::env_keys::HOST)
                .ok_or("Host not setup correctly in env").map(|h| (py, h)))
            .and_then(|(py, h)| Workspace::retrieve_env(constants::env_keys::PORT)
                .ok_or("Port not setup correctly in env").map(|p| (py, h, p)))
            .and_then(|(py, h, p)| Workspace::get_project_root_dir()
                .map_err(|_| "Could not find project root directory").map(|r| (py, h, p, r)));

        //if any gathrered required env vars failed error and bail
        let (python_bin, host, port, root_dir) = match config {
            Ok(values) => values,
            Err(e) => {
                let _ = output.send(Message::StopServer(Err(e.to_string()))).await;
                return;
            }
        };

        // --- 2. Command Preparation ---
        let mut cmd = Command::new(python_bin);
        cmd.args([
            "-m", "uvicorn",
            "apps.audio-server.main:app",
            "--host", &host,
            "--port", &port
        ])
        .current_dir(root_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

        // --- 3. Process Execution & Monitoring ---
        match cmd.spawn() {
            Ok(child) => {
                let mut guarded_child = ChildGuard(child); //ensure killed when subscription ends

                let stderr = guarded_child.0.stderr.take().unwrap(); //python logging goes to stderr
                let mut reader = BufReader::new(stderr).lines();

                while let Ok(Some(line)) = reader.next_line().await {
                    let _ = output.send(Message::ServerLog(line)).await;
                }
            },
            Err(e) => {
                let err_msg = format!("Spawn failed: {e}");
                let _ = output.send(Message::StopServer(Err(err_msg))).await;
                return;
            }
        }
    })
}


/// Monitors the health of the backend server based on its current status.
///
/// This subscription manages a "heartbeat" tick that varies in frequency:
/// - **Starting**: Ticks every 1 second to catch the server as soon as it's ready.
/// - **Running**: Ticks every 60 seconds to maintain a low-overhead health check.
/// - **Other (Idle/Errored)**: No timer is active to save resources.
///
/// Returns a `Message::ServerHealthTick` which triggers a background health check task.
pub fn server_health_subscription(server_status: &ServiceStatus) -> Subscription<Message> {
    //requires server = STARTING | RUNNING with varying ping frequency
    let interval = match server_status {
        ServiceStatus::Starting => Some(time::Duration::from_secs(constants::HEALTH_CHECK_STARTING_INTERVAL)),
        ServiceStatus::Running => Some(time::Duration::from_secs(constants::HEALTH_CHECK_RUNNING_INTERVAL)),
        _ => None, //no timer
    };

    if let Some(duration) = interval {
        time::every(duration).map(|_| Message::ServerHealthTick)
    } else {
        Subscription::none()
    }
}


/// Performs an asynchronous health check against the backend server.
/// This function attempts to connect to the `/status` endpoint of the server.
///
/// ### Arguments
/// * `client` - A reusable `reqwest::Client` (should be cloned from the App state).
/// * `host` - The hostname or IP address of the server.
/// * `port` - The port number the server is listening on.
///
/// ### Returns
/// * `Ok(())` if the server responds with a 2xx success code.
/// * `Err(String)` if the connection fails or the server returns an error status.
pub async fn run_server_health_check(client: reqwest::Client, host: String, port: String) -> Result<(), String> {
    let target_host = if host == "0.0.0.0" { //check if host is the any address switch to loopback address for request
        "127.0.0.1"
    } else {
        &host
    };

    let status_endpoint = format!("http://{}:{}/status", target_host, port); //server status endpoint

    //just return whether request worked or not for returning Ok or not
    match client.get(status_endpoint).send().await {
        Ok(resp) if resp.status().is_success() => Ok(()), //200-299 status codes
        Ok(resp) => Err(format!("Server returned status: {}", resp.status())), //server up but erroring
        Err(e) => Err(format!("Connection failed: {}", e)),
    }
}
