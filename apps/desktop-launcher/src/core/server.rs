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

struct ChildGuard(tokio::process::Child);

impl Drop for ChildGuard {
    fn drop(&mut self) {
        let _ = self.0.start_kill();
    }
}

pub fn server_subscription(server_status: &ServiceStatus) -> Subscription<Message> {
    match server_status {
        ServiceStatus::Starting | ServiceStatus::Running => {
            Subscription::run(server_worker)
        }
        _ => Subscription::none()
    }
}

pub fn server_worker() -> impl Stream<Item = Message> {
    stream::channel(100, |mut output: mpsc::Sender<Message>| async move {
        //spawns the process as a tokio Command
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

        match cmd.spawn() {
            Ok(child) => {
                let mut guarded_child = ChildGuard(child);

                let stderr = guarded_child.0.stderr.take().unwrap();
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


pub fn server_health_subscription(server_status: &ServiceStatus) -> Subscription<Message> {
    let interval = match server_status {
        ServiceStatus::Starting => Some(time::Duration::from_secs(1)),
        ServiceStatus::Running => Some(time::Duration::from_secs(60)),
        _ => None, //no timer
    };

    if let Some(duration) = interval {
        time::every(duration).map(|_| Message::ServerHealthTick)
    } else {
        Subscription::none()
    }
}

pub async fn run_server_health_check(client: reqwest::Client, host: String, port: String) -> Result<(), String> {
    //check if host is the any address switch to loopback address for request
    let target_host = if host == "0.0.0.0" {
        "127.0.0.1"
    } else {
        &host
    };

    let url = format!("http://{}:{}/status", target_host, port);

    match client.get(url).send().await {
        Ok(resp) if resp.status().is_success() => Ok(()),
        Ok(resp) => Err(format!("Server returned status: {}", resp.status())),
        Err(e) => Err(format!("Connection failed: {}", e)),
    }
}
