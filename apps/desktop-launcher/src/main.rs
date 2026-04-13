use iced::{Theme, Element, Task};
use iced::widget::{text};

mod core;
mod types;
mod workspace;

use types::{SetupStatus, ServiceStatus, Message};
use workspace::{Workspace};

fn main() -> iced::Result {
    iced::application(App::new, App::update, App::view)
        .theme(Theme::Dark)
        .run()
}

struct App {
    setup_status: SetupStatus,
    server_status: ServiceStatus,
    tunnel_status: ServiceStatus,

    logs: Vec<String>,

    webhook: String,
    webhook_locked: bool,
}

impl App {
    fn new() -> (Self, Task<Message>) {
        //running if no need to setup, otherwise idle
        let setup_done = core::setup::run_setup_done_check();
        let initial_setup_status = if setup_done { SetupStatus::Done } else { SetupStatus::Required };

        //load in initial webhook status
        let initial_env_webhook = Workspace::retrieve_env("WEBHOOK_URL")
            .unwrap_or_default();

        let app = App {
            setup_status: initial_setup_status,
            server_status: ServiceStatus::Idle,
            tunnel_status: ServiceStatus::Idle,

            logs: Vec::new(),

            webhook: initial_env_webhook.clone(),
            webhook_locked: !initial_env_webhook.is_empty(),
        };

        (app, Task::none())
    }

    fn update(&mut self, message: Message) -> Task<Message> {
        match message {
            // --- setup logic ---
            Message::StartSetup => {
                self.setup_status = SetupStatus::Running;
                self.logs.clear();
                Task::stream(core::setup::run_setup_logic()) //triggers the setup run logic which sends SetupLogs
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
            Message::WebhookChanged(new_text) => {
                self.webhook = new_text;
                Task::none()
            }
            Message::UnlockWebhook => {
                self.webhook_locked = false;
                Task::none()
            }
            Message::LockWebhook(save_text) => {
                self.webhook_locked = true;
                
                println!("Official webhook set: {}", save_text);
                Task::none()
            }
        }
    }

    fn view(&self) -> Element<Message> {
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
