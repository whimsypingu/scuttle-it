import type { IconProps } from "@phosphor-icons/react";

import type { TrackAction, TrackBase } from "@/track/track.types";
import type { Sortmode } from "@/store/hooks/hooks.types";


export type PlaylistId = string;

export interface PlaylistBase {
    id: PlaylistId;
    name: string;
}
export interface SummaryPlaylist extends PlaylistBase {
    totalCount: number;
    totalDuration: number;    
    description?: string;
}
export interface PlaylistDetails extends PlaylistBase {
    description?: string;
}

//all available playlist actions with their required properties to execute the functions
export type PlaylistActionProps = 
    | { action: "pin"; playlist: SummaryPlaylist }
    | { action: "delete"; playlist: SummaryPlaylist }
    | { action: "play"; playlist: SummaryPlaylist }
    | { action: "shufflePlay"; playlist: SummaryPlaylist }
    | { action: "edit"; playlist: SummaryPlaylist };
export type PlaylistAction = PlaylistActionProps["action"];

export interface PlaylistActionConfig { //corresponding phosphor icon and color pairing to show on swipe for a TrackAction
    icon: React.ComponentType<IconProps>;
    color: string;
}

//fields for a PlaylistItem
export interface PlaylistItemProps {
    playlist: SummaryPlaylist; //requires that a PlaylistItem must have some metadata fields to display
    onSelect: (playlist: SummaryPlaylist) => void;
    actions?: [PlaylistAction, PlaylistAction, PlaylistAction, PlaylistAction]; //leftmost action to rightmost action
}


//things required to make an infinitely scrolling playlist displayable
export interface InfiniteScrollContext {
    tracks: TrackBase[];
    fetchNextPage: () => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    totalCount: number;
    totalDuration: number;
    isLoading: boolean;

    sortmode?: Sortmode;
    setSortmode?: (sortmode: Sortmode) => void;
}


//playlist subcomponent properties
export interface PlaylistInfoProps {
    scrollContext: InfiniteScrollContext;
}

export interface PlaylistListProps {
    scrollContext: InfiniteScrollContext;
    bottomSpacing?: number;
    actions: [TrackAction, TrackAction, TrackAction, TrackAction];
    emptyText?: string;
    emptySubtext?: string;
}