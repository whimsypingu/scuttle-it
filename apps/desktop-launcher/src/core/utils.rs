use std::time::Duration;

pub async fn delay(seconds: u64) {
    tokio::time::sleep(Duration::from_secs(seconds)).await;
}