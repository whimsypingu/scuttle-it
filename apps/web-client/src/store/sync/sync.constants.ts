//see: scuttle/apps/audio-server/sync/pokes.py
export const WS_POKE_TYPES = {
    DOWNLOAD_JOB_SUCCESS: "DOWNLOAD_JOB_SUCCESS",
    DOWNLOAD_JOB_ERROR: "DOWNLOAD_JOB_ERROR",
} as const;

export const MIN_RECONNECT_DELAY = 1000;
export const RECONNECT_DELAY_FACTOR = 2.5;
export const MAX_RECONNECT_DELAY = 20000;

export const WEBSOCKET_CLOSE_CODE = 1000;
