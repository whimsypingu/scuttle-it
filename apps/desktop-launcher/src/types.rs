#[derive(Debug, Clone)]
pub enum SetupStatus {
    Required,
    Done,
    Running,
    Errored(String),
}


#[derive(Debug, Clone, PartialEq)]
pub enum ServiceStatus {
    Idle,
    Starting,
    Running, // { pid: u32, name: String },
    Errored(String),
}


#[derive(Debug, Clone)]
pub enum Message {
    None,
    
    // --- setup ---
    StartSetup,
    SetupFinished(Result<(), String>),

    // --- server ---
    StartServer,
    StopServer(Result<(), String>),
    ServerHealthTick,
    ServerHealth(Result<(), String>),

    // --- dashboard ---
    WebhookChanged(String),
    UnlockWebhook,
    LockWebhook(String),
    WebhookSaved,

    // --- logs ---
    SetupLog(String),
    ServerLog(String),
}
