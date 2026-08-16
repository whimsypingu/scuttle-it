use iced::widget::{button, row, column, text, text_input, container, space, mouse_area, opaque, stack}; //, Column, scrollable};
use iced::{Alignment, Element, Length, Color};

use crate::{App};
use crate::types::{Message, ServiceStatus};


pub fn view_dashboard(app: &App) -> Element<'_, Message> {

    let status_color = |status: &ServiceStatus| match status {
        ServiceStatus::Running => Color::from_rgb(0.0, 0.8, 0.0), //green
        ServiceStatus::Errored(_) => Color::from_rgb(0.8, 0.0, 0.0), //red
        _ => Color::from_rgb(0.5, 0.5, 0.5), //gray
    };

    let is_server_running = matches!(
        app.server_status, 
        ServiceStatus::Starting | ServiceStatus::Running
    );
    let is_tunnel_running = matches!(
        app.tunnel_status, 
        ServiceStatus::Starting | ServiceStatus::Running
    );

    //menu toggle
    let menu_toggle_bar = row![
        space::horizontal(),
        button(if app.is_menu_open { "Close" } else { "Options" })
            .on_press(Message::ToggleMenu)
    ]
    .width(Length::Fill)
    .align_y(Alignment::Center);

    //main dashboard controls
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

    //tunnel url display
    let url_display = if let Some(url) = &app.tunnel_url {
        column![
            text("Public Tunnel URL:").size(12),
            text_input(
                "Tunnel URL will appear here...",
                url,
            )
            .padding(10)
        ]
        .spacing(10)
        .width(Length::Fixed(400.0))
    } else {
        column![
            text("Tunnel URL:").size(12),
            text("Waiting for tunnel to initialize...").color([0.5, 0.5, 0.5])
        ]
        .spacing(10)
        .width(Length::Fixed(400.0))
    };


    // let mut log_column: Column<'_, Message> = Column::new()
    //     .spacing(5)
    //     .width(Length::Fill);
    // for line in &app.logs {
    //     log_column = log_column.push(
    //         text(line)
    //             .size(14)
    //             .font(iced::Font::MONOSPACE)
    //             .color(Color::from_rgb(0.8, 0.8, 0.8))
    //     );
    // }


    //main dashboard content
    let main_dashboard = container(
        column![
            menu_toggle_bar,
            text("Scuttle").size(32),
            controls,
            url_display,
        ]
        .spacing(40)
        .align_x(Alignment::Center),
    )
    .width(Length::Fill)
    .height(Length::Fill)
    .center_x(Length::Fill)
    .center_y(Length::Fill);

    //layer stack
    let mut layers: Vec<Element<'_, Message>> = vec![main_dashboard.into()];

    if app.is_menu_open {
        let backdrop = mouse_area(
            container(space::horizontal())
                .width(Length::Fill)
                .height(Length::Fill)
                .style(|_| container::Style {
                    background: Some(Color::from_rgb(0.0, 0.0, 0.0).into()),
                    ..Default::default()
                }),
        )
        .on_press(Message::ToggleMenu);


        //webhook input field
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
            ]
            .spacing(10),
        ]
        .spacing(10);

        let sidebar = opaque(
            container(
                column![
                    webhook_input,
                ]
                .spacing(20),
            )
            .width(Length::Fixed(320.0))
            .height(Length::Fill)
            .padding(20)
            .style(|_| container::Style {
                background: Some(Color::from_rgb(0.15, 0.15, 0.15).into()),
                ..Default::default()
            }),
        );

        let overlay_row = row![backdrop, sidebar]
            .width(Length::Fill)
            .height(Length::Fill);

        layers.push(overlay_row.into());
    }


    stack(layers).into()


    // let mut main_content_row = row![main_panel]
    //     .width(Length::Fill)
    //     .height(Length::Fill);

    // if app.is_menu_open {
    //     let sidebar_content = column![
    //         text("Settings").size(20),
    //         webhook_input,
    //     ]
    //     .spacing(20)
    //     .width(Length::Fixed(320.0))
    //     .padding(20);

    //     let sidebar = container(sidebar_content)
    //         .height(Length::Fill);

    //     main_content_row = main_content_row.push(sidebar);
    // }


    // //main container
    // let content = column![
    //     menu_toggle_bar,
    //     main_content_row,
    // ]
    // .padding(30)
    // .spacing(20)
    // .height(Length::Fill);

    // container(content)
    //     .width(Length::Fill)
    //     .height(Length::Fill)
    //     .into()




    // let content = column![
    //     text("Scuttle").size(32),
    //     controls,
    //     webhook_input,
    //     url_display,
    //     // scrollable(log_column).height(Length::Fixed(300.0)),
    // ]
    // .padding(40)
    // .spacing(40)
    // .align_x(Alignment::Center)
    // .height(Length::Fill);

    // container(content)
    //     .width(Length::Fill)
    //     .height(Length::Fill)
    //     .center_x(Length::Fill)
    //     .center_y(Length::Fill)
    //     .into()
}

