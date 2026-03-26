import type { IconProps } from "@phosphor-icons/react";

export type SwipeActionType = "queue" | "like" | "delete" | "edit";

export interface SwipeActionConfig {
    icon: React.ComponentType<IconProps>;
    color: string;
    label?: string;
}

export interface Track {
    id: string;
    title: string;
    artist: string;
}

export interface TrackItemProps {
    track: Track;
    index: number;
	actions?: [SwipeActionType, SwipeActionType, SwipeActionType, SwipeActionType]; //leftmost action to rightmost action
}

