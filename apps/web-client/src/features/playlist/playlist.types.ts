import type { IconProps } from "@phosphor-icons/react";

import type { TrackBase } from "@/model/model.types";

export type PlaylistActionType = "pin" | "delete";

export interface PlaylistActionConfig {
    icon: React.ComponentType<IconProps>;
    color: string;
}

export interface Playlist {
    id: string;
    name: string;
    trackCount: number;
    color?: string;
}

export interface PlaylistItemProps {
    playlist: Playlist;
    onSelect: (playlist: Playlist) => void;
    actions?: [PlaylistActionType, PlaylistActionType];
}

export interface PlaylistListProps {
    tracks?: TrackBase[];
    bottomSpacing?: number;
}