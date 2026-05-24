import type { QueueTrack } from "@/track/track.types";

export interface SetAllResponse {
    setCount: number;
    skipCount: number;
    queue: QueueTrack[];
}