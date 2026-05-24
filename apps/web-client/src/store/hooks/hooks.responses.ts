import type { QueueTrack } from "@/track/track.types";

/**
 * useQueue
 */
export interface SetFirstQueueResponse {
    downloadRequired: boolean;
    queue: QueueTrack[];
}

export interface SetAllQueueResponse {
    setCount: number;
    skipCount: number;
    queue: QueueTrack[];
}