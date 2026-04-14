use iced::widget::{Column, button, column, text, container, scrollable};
use iced::{Alignment, Element, Length, Color, stream};
use iced::futures::{Stream, SinkExt};
use iced::futures::channel::mpsc;

use std::process::Stdio;
use tokio::process::Command;
use tokio::io::{BufReader, AsyncBufReadExt};

use crate::{App};
use crate::types::{Message};
use crate::workspace::{Workspace};


pub fn view_setup_required(_app: &App) -> Element<'_, Message> {
    let content = column![
        text("Setup required!").size(30),
        button("Setup")
            .on_press(Message::StartSetup)
            .padding(10),
    ]
    .spacing(20)
    .align_x(Alignment::Center);

    container(content)
        .width(Length::Fill)
        .height(Length::Fill)
        .center_x(Length::Fill)
        .center_y(Length::Fill)
        .into()
}

pub fn view_setup_running(app: &App) -> Element<'_, Message> {
    let mut log_column: Column<'_, Message> = Column::new()
        .spacing(5)
        .width(Length::Fill);
    for line in &app.logs {
        log_column = log_column.push(
            text(line)
                .size(14)
                .font(iced::Font::MONOSPACE)
                .color(Color::from_rgb(0.8, 0.8, 0.8))
        );
    }
    let content = column![
        text("Setting up...").size(20),
        scrollable(log_column).height(Length::Fixed(300.0)),
        text("End of logs.").size(10)
    ]
    .spacing(20)
    .align_x(Alignment::Center)
    .width(Length::Fill);

    container(content)
        .width(Length::Fill)
        .height(Length::Fill)
        .center_x(Length::Fill)
        .center_y(Length::Fill)
        .into()
}


/// Determines if the application setup has been completed.
///
/// This is a synchronous check that:
/// 1. Attempts to load the current workspace configuration.
/// 2. Resolves the path to the "installed" marker file (defined in the workspace).
/// 3. Verifies if that file actually exists on the local filesystem.
///
/// Returns `true` if the marker file exists, indicating setup is finished. 
/// Returns `false` if the workspace cannot be loaded, the path is invalid, or the file is missing.
pub fn run_setup_done_check() -> bool {
    let workspace = match Workspace::load() {
        Ok(w) => w,
        Err(_) => return false,
    };

    match Workspace::resolve_path(&workspace.apps.audio_server.installed) {
        Ok(path_buf) => {
            path_buf.exists() //return true if the file exists
        }
        Err(_) => false,
    }
}


/// Executes the application setup process by running an external Python installation script.
///
/// This worker spawns a Python process to perform the heavy lifting (e.g., environment 
/// creation, dependency installation). It streams the installation logs back to the 
/// UI in real-time.
///
/// ### Process Details:
/// - **Command**: Runs `python -u <install_script_path>`. The `-u` flag ensures 
///   unbuffered output so logs appear in the UI immediately.
/// - **Log Capture**: Captures `stderr` (standard for Python's diagnostic/installation logs) 
///   and sends each line as a `Message::SetupLog`.
/// - **Completion**: Waits for the process to exit and returns `Message::SetupFinished` 
///   with either an `Ok` or an `Err` based on the exit status.
///
/// Returns a `Stream` of `Message` variants to drive the Setup UI progress.
pub fn run_setup_logic() -> impl Stream<Item = Message> {
    stream::channel(100, |mut output: mpsc::Sender<Message>| async move {
        // --- 1. Workspace Preparation ---
        let workspace = match Workspace::load() {
            Ok(w) => w,
            Err(e) => {
                let _ = output.send(Message::SetupFinished(Err(e))).await;
                return;
            }
        };

        // --- 2. Spawning the Installation Script ---
        let mut child = match Command::new("python")
            .arg("-u")
            .arg(Workspace::resolve_path(&workspace.apps.audio_server.install).unwrap())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
        {
            Ok(c) => c,
            Err(e) => {
                let err_msg = format!("Spawn failed: {e}");
                let _ = output.send(Message::SetupFinished(Err(err_msg))).await;
                return;
            }
        };

        // --- 3. Streaming Diagnostic Logs ---
        let stderr = child.stderr.take().unwrap(); //python pipes log results to stderr, consider piping both
        let mut reader = BufReader::new(stderr).lines();

        while let Ok(Some(line)) = reader.next_line().await {
            let _ = output.send(Message::SetupLog(line)).await; //send a Message with the logs to the stream output
        }

        // --- 4. Finalizing ---
        let status = child.wait().await; //unlike the server worker wait for this process to finish naturally

        match status {
            Ok(s) if s.success() => {
                let _ = output.send(Message::SetupFinished(Ok(()))).await;
            }
            _ => {
                let _ = output.send(Message::SetupFinished(Err("Failed".into()))).await;
            }
        }
    })
}
