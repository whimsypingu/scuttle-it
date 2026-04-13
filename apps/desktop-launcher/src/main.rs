use iced::{Theme, Element, Task, Subscription};
use iced::widget::{text};

mod core;
mod types;
mod workspace;

use types::{SetupStatus, ServiceStatus, Message};

fn main() -> iced::Result {
    iced::application(App::new, App::update, App::view)
        .theme(Theme::Dark)
        .run()
}

struct App {
    setup_status: SetupStatus,
    server_status: ServiceStatus,
    tunnel_status: ServiceStatus,

    setup_logs: Vec<String>,
}

impl App {
    fn new() -> (Self, Task<Message>) {
        let setup_done = std::path::Path::new(".setup_done").exists();

        //running if no need to setup, otherwise idle
        let initial_setup_status = if setup_done { SetupStatus::Done } else { SetupStatus::Required };

        let app = App {
            setup_status: initial_setup_status,
            server_status: ServiceStatus::Idle,
            tunnel_status: ServiceStatus::Idle,

            setup_logs: Vec::new(),
        };

        (app, Task::none())
    }

    fn update(&mut self, message: Message) -> Task<Message> {
        match message {
            // --- setup logic ---
            Message::StartSetup => {
                println!("DEBUG: StartSetup clicked");
                self.setup_status = SetupStatus::Running;
                self.setup_logs.clear();
                Task::stream(core::setup::run_setup_logic()) //triggers the setup run logic, but doesn't find any Message::SetupLog(line)s?
            }
            Message::SetupLog(line) => {
                println!(">>> UI RECEIVED LOG: {}", line); //never triggers :(
                self.setup_logs.push(line);
                Task::none()
            }
            Message::SetupFinished(result) => {
                match result {
                    Ok(_) => {
                        self.setup_status = SetupStatus::Done;
                    }
                    Err(e) => {
                        println!("Setup failed: {}", e);
                        self.setup_status = SetupStatus::Errored(e);
                    }
                }
                Task::none()
            }
        }
    }

    // pub fn subscription(&self) -> Subscription<Message> {
    //     match self.setup_status {
    //         SetupStatus::Running => {
    //             Subscription::run(core::setup::run_setup_logic())
    //         }
    //     }
    // }

    fn view(&self) -> Element<Message> {
        match &self.setup_status {
            SetupStatus::Required => {
                core::setup::view_setup_required(self)
            }
            SetupStatus::Running => {
                core::setup::view_setup_running(self)
            }
            SetupStatus::Done => {
                text("dashboard").into()
                // self.view_dashboard()
            }
            SetupStatus::Errored(e) => {
                text!("Error: {e}").into()
            }
        }
    }
}
