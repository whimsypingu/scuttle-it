import { HeartIcon, PenIcon, PlusCircleIcon, TrashIcon } from '@phosphor-icons/react';
import type { TrackAction, TrackActionConfig } from "@/model/model.types";

export const ICON_SIZE_PX = 20;

export const SMALL_SWIPE_THRESHOLD_PX = 50; 
export const LARGE_SWIPE_THRESHOLD_PX = 100;

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
	edit: { 
        icon: PenIcon, 
        color: "var(--color-brand)" 
    }
};
