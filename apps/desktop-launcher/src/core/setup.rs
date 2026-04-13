use iced::widget::{Column, button, column, text, container, scrollable};
use iced::{Alignment, Element, Length, Color, Subscription, stream};
use iced::futures::{Stream, SinkExt};
use iced::futures::channel::mpsc;

use std::process::Stdio;
use tokio::process::Command;
use tokio::io::{BufReader, AsyncBufReadExt};

use crate::{App};
use crate::types::{Message};
use crate::workspace::{Workspace};

pub fn view_setup_required(_app: &App) -> Element<Message> {
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

pub fn view_setup_running(app: &App) -> Element<Message> {
    let mut log_column: Column<'_, Message> = Column::new()
        .spacing(5)
        .width(Length::Fill);
    for line in &app.setup_logs {
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


pub fn run_setup_logic() -> impl Stream<Item = Message> {

    println!("DEBUG 1: run_setup_logic function called");

    stream::channel(100, |mut output: mpsc::Sender<Message>| async move {

        println!("DEBUG 2: Async block started");

        let workspace = match Workspace::load() {
            Ok(w) => w,
            Err(e) => {
                let _ = output.send(Message::SetupFinished(Err(e))).await;
                return;
            }
        };

        println!("DEBUG 3: Spawning python process"); //this part works fine

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

        let stderr = child.stderr.take().unwrap();
        let mut reader = BufReader::new(stderr).lines();

        println!("DEBUG 4: Entering read loop"); //works fine, python command is also working in the background

        while let Ok(Some(line)) = reader.next_line().await {

            println!("PYTHON LOG: {}", line); //why is this not triggering? I don't see anything in my console

            let _ = output.send(Message::SetupLog(line)).await; //send a Message to the stream output
        }

        let status = child.wait().await;

        println!("DEBUG 5: Read loop finished"); //also triggers correctly, and sends a SetupFinished(Ok(())) after

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
