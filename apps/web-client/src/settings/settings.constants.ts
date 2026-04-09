import type { Settings } from "@/settings/settings.types";

/**
 * The baseline state for the application.
 * Used for fallbacks and initial state management.
 */
export const DEFAULT_SETTINGS: Settings = {
    loopmode: 0,
    // Add future defaults here:
    // volume: 1.0,
};