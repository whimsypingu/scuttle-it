use iced::{Subscription, stream, time};
use iced::futures::{Stream, SinkExt};
use iced::futures::channel::mpsc;

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

pub fn server_subscription(server_status: &ServiceStatus) -> Subscription<Message> {
            // match self.server_status {
            //     ServiceStatus::Starting | ServiceStatus::Running => {
            //         core::server::server_subscription()
            //     }
            //     _ => Subscription::none()
            // },

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
        let Some(python_bin) = Workspace::retrieve_env(constants::env_keys::PYTHON) else {
            let err_msg = "Python executable not setup correctly in env".to_string();
            let _ = output.send(Message::StopServer(Err(err_msg))).await;
            return;
        };

        let Ok(root_dir) = Workspace::get_project_root_dir() else {
            let err_msg = "Could not find project root directory".to_string();
            let _ = output.send(Message::StopServer(Err(err_msg))).await;
            return;
        };

        let mut cmd = Command::new(python_bin);
        cmd.args([
            "-m", "uvicorn",
            "apps.audio-server.main:app",
            "--host", "0.0.0.0"
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
