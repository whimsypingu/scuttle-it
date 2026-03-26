import { HeartIcon, PenIcon, PlusCircleIcon, TrashIcon } from '@phosphor-icons/react';
import type { SwipeActionType, SwipeActionConfig } from "@/features/track/track.types";

export const ICON_SIZE_PX = 20;

export const SMALL_SWIPE_THRESHOLD_PX = 50; 
export const LARGE_SWIPE_THRESHOLD_PX = 100;

export const ACTION_CONFIG: Record<SwipeActionType, SwipeActionConfig> = {
	like: { 
        icon: HeartIcon, 
        color: "var(--color-brand)" 
    },
	queue: { 
        icon: PlusCircleIcon, 
        color: "var(--color-brand)"
    },
	delete: { 
        icon: TrashIcon, 
        color: "var(--color-brand)" 
    },
	edit: { 
        icon: PenIcon, 
        color: "var(--color-brand)" 
    }
};
