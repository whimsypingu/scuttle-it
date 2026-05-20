import type { UserStats } from "./profile.types";

/**
 * The baseline state for the application.
 * Used for fallbacks and initial state management.
 */
export const DEFAULT_STATS: UserStats = {
    totalTrackCount: 0,
    totalListenedDuration: 0,
    // Add future defaults here:
    // totalAudioStorage: 0
};