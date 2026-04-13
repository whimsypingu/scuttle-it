use iced::{Element, Task};
use iced::widget::{text};

mod view;

fn main() -> iced::Result {
    iced::application(App::new, App::update, App::view)
        .run()
}

#[derive(Debug, Clone)]
enum SetupStatus {
    Required,
    Done,
    Running,
    Errored(String),
}

#[derive(Debug, Clone)]
enum ServiceStatus {
    Idle,
    Starting,
    Running, // { pid: u32, name: String },
    Errored(String),
}

struct App {
    setup_status: SetupStatus,
    server_status: ServiceStatus,
    tunnel_status: ServiceStatus,
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
        };

        (app, Task::none())
    }

    fn update(&mut self, message: Message) -> Task<Message> {
        match message {
            // --- setup logic ---
            Message::StartSetup => {
                self.setup_status = SetupStatus::Running;
                Task::none()
            }
            Message::SetupFinished(Ok(_)) => {
                self.setup_status = SetupStatus::Done;
                Task::none()
            }
            Message::SetupFinished(Err(e)) => {
                self.setup_status = SetupStatus::Errored(e);
                Task::none()
            }
        }
    }

    fn view(&self) -> Element<Message> {
        match &self.setup_status {
            SetupStatus::Required => {
                view::setup::view_setup_screen(self)
            }
            SetupStatus::Running => {
                text("Installing environment... please wait.").into()
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

#[derive(Debug, Clone)]
enum Message {
    // --- setup ---
    StartSetup,
    SetupFinished(Result<(), String>),
}