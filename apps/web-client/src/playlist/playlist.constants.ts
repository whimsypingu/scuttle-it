import { PenIcon, PlayIcon, PushPinIcon, ShuffleIcon, TrashIcon } from '@phosphor-icons/react';
import type { PlaylistAction, PlaylistActionConfig } from "@/playlist/playlist.types";


//should match the value in track.constants.ts
export const ICON_SIZE_PX = 20;

export const SMALL_SWIPE_THRESHOLD_PX = 40; 
export const LARGE_SWIPE_THRESHOLD_PX = 75;

//all available playlist actions with their corresponding icons and colors on swipe
export const PLAYLIST_ACTION_CONFIG: Record<PlaylistAction, PlaylistActionConfig> = {
    pin: { 
        icon: PushPinIcon, 
        color: "var(--color-brand)" 
    },
    delete: { 
        icon: TrashIcon, 
        color: "var(--color-brand)" 
    },
    play: {
        icon: PlayIcon,
        color: "var(--color-brand)"
    },
    shufflePlay: {
        icon: ShuffleIcon,
        color: "var(--color-brand)"
    },
    edit: {
        icon: PenIcon,
        color: "var(--color-brand)"
    }
};

//playlist element sizing
export const PLAYLIST_CONFIG = {
    iconSize: 20,
    dropdownIconSize: 16,
};