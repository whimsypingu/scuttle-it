use iced::widget::{button, row, column, text, text_input, container, Column, scrollable};
use iced::{Alignment, Element, Length, Color};

use crate::{App};
use crate::constants;
use crate::types::{Message, ServiceStatus};
use crate::workspace::{Workspace};


pub fn view_dashboard(app: &App) -> Element<'_, Message> {

    let status_color = |status: &ServiceStatus| match status {
        ServiceStatus::Running => Color::from_rgb(0.0, 0.8, 0.0), //green
        ServiceStatus::Errored(_) => Color::from_rgb(0.8, 0.0, 0.0), //red
        _ => Color::from_rgb(0.5, 0.5, 0.5), //gray
    };

    let is_server_running = matches!(app.server_status, ServiceStatus::Starting | ServiceStatus::Running);
    let is_tunnel_running = matches!(app.tunnel_status, ServiceStatus::Starting | ServiceStatus::Running);

    let controls = row![
        column![
            row![
                text("Audio Server").size(16),
                text(format!("{:?}", app.server_status)).color(status_color(&app.server_status)),
            ]
            .spacing(10)
            .align_y(Alignment::Center),
        
            button(if is_server_running { "Stop" } else { "Start" })
                .on_press(if is_server_running {
                    Message::StopServer(Ok(()))
                } else {
                    Message::StartServer
                })
        ]
        .spacing(10)
        .align_x(Alignment::Center),

        column![
            row![
                text("Network Tunnel").size(16),
                text(format!("{:?}", app.tunnel_status)).color(status_color(&app.tunnel_status)),    
            ]
            .spacing(10)
            .align_y(Alignment::Center),
            
            button(if is_tunnel_running { "Stop" } else { "Start" })
                .on_press(if is_tunnel_running {
                    Message::StopTunnel(Ok(()))
                } else {
                    Message::StartTunnel
                })
        ]
        .spacing(10)
        .align_x(Alignment::Center),
    ]
    .spacing(50)
    .align_y(Alignment::Center);

    let webhook_input = column![
        text("Webhook").size(16),
        row![
            text_input("https://discord.com/api/webhooks/...", &app.webhook)
                .on_input_maybe(if app.is_webhook_locked {
                    None
                } else {
                    Some(Message::WebhookChanged)
                })
                .padding(10)
                .size(14),

            button(if app.is_webhook_locked { "Edit" } else { "Save" })
                .on_press(if app.is_webhook_locked {
                    Message::UnlockWebhook
                } else {
                    Message::LockWebhook(app.webhook.clone())
                })
                .padding(10),
        ]
        .spacing(10),
    ]
    .spacing(10)
    .width(Length::Fixed(400.0));


    let url_display = if let Some(url) = &app.tunnel_url {
        column![
            text("Public Tunnel URL:").size(12),
            text_input(
                "Tunnel URL will appear here...",
                url,
            )
            .padding(10)
        ]
    } else {
        column![
            text("Tunnel URL:").size(12),
            text("Waiting for tunnel to initialize...").color([0.5, 0.5, 0.5])
        ]
    };


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
        text("Scuttle Dashboard").size(32),
        controls,
        webhook_input,
        url_display,
        scrollable(log_column).height(Length::Fixed(300.0)),
    ]
    .spacing(40)
    .align_x(Alignment::Center);

    container(content)
        .width(Length::Fill)
        .height(Length::Fill)
        .center_x(Length::Fill)
        .center_y(Length::Fill)
        .into()
}


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
