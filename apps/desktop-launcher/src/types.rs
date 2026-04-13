#[derive(Debug, Clone)]
pub enum SetupStatus {
    Required,
    Done,
    Running,
    Errored(String),
}

#[derive(Debug, Clone)]
pub enum ServiceStatus {
    Idle,
    Starting,
    Running, // { pid: u32, name: String },
    Errored(String),
}

#[derive(Debug, Clone)]
pub enum Message {
    // --- setup ---
    StartSetup,
    SetupFinished(Result<(), String>),

    // --- logs ---
    SetupLog(String),
}