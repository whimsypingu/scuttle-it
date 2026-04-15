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
    // --- setup ---
    StartSetup,
    SetupFinished(Result<(), String>),

    // --- server ---
    StartServer,
    StopServer(Result<(), String>),
    ServerHealthTick,
    ServerHealth(Result<(), String>),

    // --- tunnel ---
    StartTunnel,
    StopTunnel(Result<(), String>),
    SetTunnelUrl(String),
    TunnelHealthTick,
    TunnelHealth(Result<(), String>),

    // --- webhook ---
    WebhookChanged(String),
    UnlockWebhook,
    LockWebhook(String),
    SaveWebhook(Result<(), String>),
    WebhookSent(Result<(), String>),

    // --- logs ---
    SetupLog(String),
    ServerLog(String),
    TunnelLog(String),
}
