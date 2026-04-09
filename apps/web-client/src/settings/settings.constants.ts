import type { Loopmode, LoopmodeConfig, Settings } from "@/settings/settings.types";
import { RepeatIcon, RepeatOnceIcon } from "@phosphor-icons/react";

/**
 * The baseline state for the application.
 * Used for fallbacks and initial state management.
 */
export const DEFAULT_SETTINGS: Settings = {
    loopmode: 0,
    // Add future defaults here:
    // volume: 1.0,
};

//all available loopmodes with their corresponding icons and colors
export const LOOPMODE_CONFIG: Record<Loopmode, LoopmodeConfig> = {
	0: { 
        icon: RepeatIcon, 
        color: "white" 
    },
	1: { 
        icon: RepeatIcon, 
        color: "var(--color-brand)"
    },
	2: { 
        icon: RepeatOnceIcon, 
        color: "var(--color-brand)" 
    }
};
