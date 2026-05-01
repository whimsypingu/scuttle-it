import { HeartBreakIcon, HeartIcon, PenIcon, PlusCircleIcon, RowsPlusTopIcon, TrashIcon } from '@phosphor-icons/react';
import type { TrackAction, TrackActionConfig } from "@/track/track.types";

export const ICON_SIZE_PX = 20;

export const SMALL_SWIPE_THRESHOLD_PX = 40; 
export const LARGE_SWIPE_THRESHOLD_PX = 75;

//all available track actions with their corresponding icons and colors on swipe
export const TRACK_ACTION_CONFIG: Record<TrackAction, TrackActionConfig> = {
	setFirst: { 
        icon: HeartIcon, 
        color: "var(--color-brand)" 
    },
	queueLast: { 
        icon: PlusCircleIcon, 
        color: "var(--color-brand)"
    },
    queueNext: {
        icon: RowsPlusTopIcon,
        color: "var(--color-brand)"
    },
	delete: { 
        icon: TrashIcon, 
        color: "var(--color-brand)" 
    },
	deleteQueue: { 
        icon: TrashIcon, 
        color: "var(--color-brand)" 
    },
	like: { 
        icon: HeartIcon, 
        color: "var(--color-brand)" 
    },
    unlike: {
        icon: HeartBreakIcon,
        color: "var(--color-brand)"
    },
	edit: { 
        icon: PenIcon, 
        color: "var(--color-brand)" 
    }
};
