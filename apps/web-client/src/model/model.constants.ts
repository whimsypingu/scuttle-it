import { HeartIcon, PenIcon, PlusCircleIcon, TrashIcon } from '@phosphor-icons/react';
import type { TrackActionType, TrackActionConfig } from "@/model/model.types";

export const ICON_SIZE_PX = 20;

export const SMALL_SWIPE_THRESHOLD_PX = 50; 
export const LARGE_SWIPE_THRESHOLD_PX = 100;

export const TRACK_ACTION_CONFIG: Record<TrackActionType, TrackActionConfig> = {
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
