import type { UserStats } from "./profile.types";

/**
 * The baseline state for the application.
 * Used for fallbacks and initial state management.
 */
export const DEFAULT_STATS: UserStats = {
    username: "whimsypingu",
    createdAt: 0,

    totalTrackCount: 0,
    totalListenedDuration: 0,
    totalStorageUsed: 0,
};