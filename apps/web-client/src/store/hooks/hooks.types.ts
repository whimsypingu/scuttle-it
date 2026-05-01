import type { QueueTrack, TrackBase } from "@/model/model.types";
import type { IconProps } from "@phosphor-icons/react";


/**
 * useEdit
 * 
 * These interfaces are used to define the payloads and properties of edit operations
 */
//see: audio-server/core/models/artist.py
export interface EditArtistPayload {
    id?: string;
    newId?: string;
    nameDisplay?: string;
}

//see: audio-server/core/models/track.py
export interface EditTrackPayload {
    id?: string;
    newId?: string;
    titleDisplay?: string;
    artists?: EditArtistPayload[];
}

export interface EditTrackMutationProps {
    payload: EditTrackPayload; 
}


/**
 * useQueue
 * 
 * These interfaces define the properties of queue mutations
 */
export interface SetFirstMutationProps {
    track: TrackBase;
}

export interface ReorderMutationProps {
    queueTrack: QueueTrack;
    targetPosition: number;
}

export interface PushMutationProps {
    track: TrackBase;
}

export interface PushNextMutationProps {
    track: TrackBase;
}

export interface PopMutationProps {
    queueTrack: QueueTrack;
}


/**
 * useSearch
 */
export interface YTSearchMutationProps {
    q: string;
    limit?: number;
}


/**
 * Sorting Playlists
 */
export type SortmodeProps = 
    | { sortmode: 0; desc: "Position descending" }
    | { sortmode: 1; desc: "Date added descending" };
export type Sortmode = SortmodeProps["sortmode"];

export interface SortmodeConfig { //corresponding phosphor icon for each Sortmode
    icon: React.ComponentType<IconProps>;
    detail: string;
}


/**
 * useLikes
 */
export interface SetLikeMutationProps {
    track: TrackBase;
    liked: boolean;
}