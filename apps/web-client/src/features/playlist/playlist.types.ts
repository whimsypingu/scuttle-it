import type { IconProps } from "@phosphor-icons/react";

import type { TrackAction, TrackBase } from "@/model/model.types";
import type { Sortmode } from "@/store/hooks/hooks.types";


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


export interface InfiniteScrollContext {
    tracks: TrackBase[];
    fetchNextPage: () => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    totalCount?: number;
    totalDuration?: number;
    isLoading: boolean;

    sortmode?: Sortmode;
    setSortmode?: (sortmode: Sortmode) => void;
}

export interface PlaylistInfoProps {
    scrollContext: InfiniteScrollContext;
}

export interface PlaylistListProps {
    scrollContext: InfiniteScrollContext;
    bottomSpacing?: number;
    actions: [TrackAction, TrackAction, TrackAction, TrackAction];
}