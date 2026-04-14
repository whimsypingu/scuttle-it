pub mod files {
    pub const WORKSPACE: &str = "workspace.json";
    pub const ENV: &str = ".env";
}

pub mod env_keys {
    pub const WEBHOOK: &str = "WEBHOOK_URL";
    pub const PYTHON: &str = "PYTHON_BIN_PATH";
    pub const HOST: &str = "HOST";
    pub const PORT: &str = "PORT";
}

pub const DEFAULT_HOST: &str = "127.0.0.1";
pub const DEFAULT_PORT: &str = "8000";