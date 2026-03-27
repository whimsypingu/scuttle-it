import type { IconProps } from "@phosphor-icons/react";

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

export interface PlaylistDetailViewProps {
    playlist: Playlist;
}