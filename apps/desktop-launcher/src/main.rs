#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use iced::{Theme, Element, Task, Subscription};
use iced::widget::{text};
use iced::task::Handle;

use reqwest;
use std::time::Duration;

mod core;
mod types;
mod constants;
mod styles;
mod workspace;

use types::{SetupStatus, ServiceStatus, Message};
use workspace::{Workspace};

fn main() -> iced::Result {
    iced::application(App::new, App::update, App::view)
        .subscription(App::subscription)
        .title("Scuttle")
        .window(styles::window_settings())
        .theme(Theme::Dark)
        .run()
}

struct App {
    setup_status: SetupStatus,
    server_status: ServiceStatus,
    tunnel_status: ServiceStatus,

    setup_handle: Option<Handle>,

    logs: Vec<String>,

    webhook: String,
    is_webhook_locked: bool,

    host: String,
    port: String,

    client: reqwest::Client,
    is_checking_server_health: bool,
    is_checking_tunnel_health: bool,

    tunnel_url: Option<String>,
}

impl App {
    fn new() -> (Self, Task<Message>) {
        //running if no need to setup, otherwise idle
        let setup_done = core::setup::run_setup_done_check();
        let initial_setup_status = if setup_done { SetupStatus::Done } else { SetupStatus::Required };

        //load in initial webhook status
        let initial_env_webhook = Workspace::retrieve_env(constants::env_keys::WEBHOOK)
            .unwrap_or_default();

        //other initial env vars
        let initial_env_host = Workspace::retrieve_env(constants::env_keys::HOST)
            .unwrap_or_else(|| constants::DEFAULT_HOST.to_string());

        let initial_env_port = Workspace::retrieve_env(constants::env_keys::PORT)
            .unwrap_or_else(|| constants::DEFAULT_PORT.to_string());

        let app = App {
            setup_status: initial_setup_status,
            server_status: ServiceStatus::Idle,
            tunnel_status: ServiceStatus::Idle,

            setup_handle: None,

            logs: Vec::new(),

            webhook: initial_env_webhook.clone(),
            is_webhook_locked: !initial_env_webhook.is_empty(),

            host: initial_env_host,
            port: initial_env_port,

            client: reqwest::Client::builder()
                .timeout(Duration::from_millis(5000))
                .build()
                .unwrap_or_default(),
            is_checking_server_health: false,
            is_checking_tunnel_health: false,

            tunnel_url: None,
        };

        (app, Task::none())
    }

    fn update(&mut self, message: Message) -> Task<Message> {
        match message {
            // --- SETUP ---
            Message::StartSetup => {
                self.setup_status = SetupStatus::Running;
                self.logs.clear();
                let (task, handle) = Task::stream(core::setup::run_setup_logic()) //triggers the setup run logic which sends SetupLogs
                    .abortable();

                self.setup_handle = Some(handle);

                task
            }
            Message::CancelSetup => {
                if let Some(handle) = self.setup_handle.take() {
                    handle.abort();
                }

                self.setup_status = SetupStatus::Required;
                Task::none()
            }
            Message::SetupLog(line) => {
                self.logs.push(line);
                Task::none()
            }
            Message::SetupFinished(result) => {
                match result {
                    Ok(_) => self.setup_status = SetupStatus::Done,
                    Err(e) => self.setup_status = SetupStatus::Errored(e)
                }
                Task::none()
            }

            // --- WEBHOOK ---
            Message::WebhookChanged(new_text) => {
                self.webhook = new_text;
                Task::none()
            }
            Message::UnlockWebhook => {
                self.is_webhook_locked = false;
                Task::none()
            }
            Message::LockWebhook(save_text) => {
                self.is_webhook_locked = true;
                Task::perform(
                    core::webhook::run_save_webhook(save_text),
                    Message::SaveWebhook
                )
            }
            Message::SaveWebhook(result) => {
                match result {
                    Ok(_) => {}
                    Err(_) => {
                        self.is_webhook_locked = false;
                    }
                }

                //notifications about server local access and server tunnel access
                let msg_server = core::webhook::notifications::server_url_access(self.port.clone());
                let task_server = Task::perform(
                    core::webhook::notify_webhook(self.client.clone(), msg_server),
                    Message::WebhookSent
                );

                let msg_tunnel = core::webhook::notifications::tunnel_url_access(self.tunnel_url.clone());
                let task_tunnel = Task::perform(
                    core::webhook::notify_webhook(self.client.clone(), msg_tunnel),
                    Message::WebhookSent
                );

                Task::batch(vec![task_server, task_tunnel])
            }
            Message::WebhookSent(result) => {
                match result {
                    Ok(_) => {}
                    Err(_) => {
                        println!("Please set a webhook");
                    }
                }
                Task::none()
            }

            // --- SERVER ---
            Message::StartServer => {
                self.server_status = ServiceStatus::Starting;

                let msg = core::webhook::notifications::server_url_access(self.port.clone());
                Task::perform(
                    core::webhook::notify_webhook(self.client.clone(), msg),
                    Message::WebhookSent
                )
            }
            Message::ServerLog(line) => {
                self.logs.push(line);
                Task::none()
            }
            Message::StopServer(result) => {
                match result {
                    Ok(_) => {
                        self.server_status = ServiceStatus::Idle;
                        self.tunnel_status = ServiceStatus::Idle;
                    }
                    Err(e) => {
                        self.server_status = ServiceStatus::Errored(e)
                    }
                }
                Task::none()
            }
            Message::ServerHealthTick => {
                //println!("Message::ServerHealthTick"); //DEBUG

                if self.is_checking_server_health { //check guard preventing too many ticks piling up
                    return Task::none();
                }
                self.is_checking_server_health = true;

                //run a server health check and wrap the result into a Message::ServerHealth
                Task::perform(
                    core::server::run_server_health_check(self.client.clone(), self.host.clone(), self.port.clone()),
                    Message::ServerHealth
                )
            }
            Message::ServerHealth(result) => {
                self.is_checking_server_health = false; //reset check guard
                match result {
                    Ok(_) => {
                        if self.server_status != ServiceStatus::Running { self.server_status = ServiceStatus::Running }; //server is running, set it to Running
                        Task::none()
                    }
                    Err(e) => {
                        if self.server_status == ServiceStatus::Running { //if server is in a running state but errors, reboot it and send a failure notification
                            self.server_status = ServiceStatus::Starting;

                            let msg = core::webhook::notifications::health_check_failed("Audio Server", &e);
                            Task::perform(
                                core::webhook::notify_webhook(self.client.clone(), msg),
                                Message::WebhookSent
                            )
                        } else {
                            Task::none() //server is starting, just keep waiting until we get an ok
                        }
                    }
                }
            }

            // --- TUNNEL ---
            Message::StartTunnel => {
                self.tunnel_status = ServiceStatus::Starting;
                if self.server_status != ServiceStatus::Running { self.server_status = ServiceStatus::Starting };
                Task::none()
            }
            Message::TunnelLog(line) => {
                self.logs.push(line);
                Task::none()
            }
            Message::StopTunnel(result) => {
                self.tunnel_url = None;
                match result {
                    Ok(_) => self.tunnel_status = ServiceStatus::Idle,
                    Err(e) => self.tunnel_status = ServiceStatus::Errored(e)
                }
                Task::none()
            }
            Message::SetTunnelUrl(url) => {
                self.tunnel_url = Some(url);
                self.tunnel_status = ServiceStatus::Running;

                let msg = core::webhook::notifications::tunnel_url_access(self.tunnel_url.clone());
                Task::perform(
                    core::webhook::notify_webhook(self.client.clone(), msg),
                    Message::WebhookSent
                )
            }
            Message::TunnelHealthTick => {
                //println!("Message::TunnelHealthTick"); //DEBUG

                if self.is_checking_tunnel_health { //check guard preventing too many ticks piling up
                    return Task::none();
                }
                self.is_checking_tunnel_health = true;

                //run a tunnel health check and wrap the result into a Message::TunnelHealth
                Task::perform(
                    core::tunnel::run_tunnel_health_check(self.client.clone(), self.tunnel_url.clone()),
                    Message::TunnelHealth
                )
            }
            Message::TunnelHealth(result) => {
                self.is_checking_tunnel_health = false; //reset check guard
                match result {
                    Ok(_) => { //bing chilling
                        Task::none()
                    }
                    Err(e) => {
                        self.tunnel_url = None; //no valid url because tunnel isnt healthy
                        self.tunnel_status = ServiceStatus::Starting;
                        if self.server_status != ServiceStatus::Running { self.server_status = ServiceStatus::Starting }; //start server if applicable

                        //notify via webhook of unhealthy tunnel
                        let msg = core::webhook::notifications::health_check_failed("Tunnel", &e);
                        Task::perform(
                            core::webhook::notify_webhook(self.client.clone(), msg),
                            Message::WebhookSent
                        )
                    }
                }
            }

        }
    }

    fn subscription(&self) -> Subscription<Message> {
        Subscription::batch(vec![
            //requires server = STARTING | RUNNING
            core::server::server_subscription(&self.server_status),

            //requires server = STARTING | RUNNING with varying ping frequency
            core::server::server_health_subscription(&self.server_status),

            //requires server = RUNNING, and tunnel = STARTING | RUNNING
            core::tunnel::tunnel_subscription(&self.server_status, &self.tunnel_status),

            //requires server = RUNNING, and tunnel = RUNNING
            core::tunnel::tunnel_health_subscription(&self.server_status, &self.tunnel_status),
        ])
    }

    fn view(&self) -> Element<'_, Message> {
        match &self.setup_status {
            SetupStatus::Required => {
                core::setup::view_setup_required(self)
            }
            SetupStatus::Running => {
                core::setup::view_setup_running(self)
            }
            SetupStatus::Done => {
                core::dashboard::view_dashboard(self)
            }
            SetupStatus::Errored(e) => {
                text!("Error: {e}").into()
            }
        }
    }
}
