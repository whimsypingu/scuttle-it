import { PushPinIcon, TrashIcon } from '@phosphor-icons/react';
import type { PlaylistActionType, PlaylistActionConfig } from "@/features/playlist/playlist.types";

export const ICON_SIZE_PX = 20;

export const SMALL_SWIPE_THRESHOLD_PX = 50; 

export const PLAYLIST_ACTION_CONFIG: Record<PlaylistActionType, PlaylistActionConfig> = {
    pin: { 
        icon: PushPinIcon, 
        color: "var(--color-brand)" 
    },
    delete: { 
        icon: TrashIcon, 
        color: "var(--color-brand)" 
    }
};

//playlist element sizing
export const PLAYLIST_CONFIG = {
    iconSize: 20,
    dropdownIconSize: 16,
};