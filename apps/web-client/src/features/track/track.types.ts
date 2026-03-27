import type { IconProps } from "@phosphor-icons/react";

export type TrackActionType = "queue" | "like" | "delete" | "edit";

export interface TrackActionConfig {
    icon: React.ComponentType<IconProps>;
    color: string;
}

export interface Track {
    id: string;
    title: string;
    artist: string;
}

export interface TrackItemProps {
    track: Track;
    index: number;
	actions?: [TrackActionType, TrackActionType, TrackActionType, TrackActionType]; //leftmost action to rightmost action
}

