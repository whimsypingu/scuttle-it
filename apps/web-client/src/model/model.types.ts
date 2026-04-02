import type { IconProps } from "@phosphor-icons/react";

export type ArtistId = string;
export interface ArtistBase {
    id: ArtistId;
    name: string;
    nameDisplay?: string;
}

export type TrackId = string;
export interface TrackNorm { //zustand storage format
    id: TrackId;
    title: string;
    titleDisplay?: string;
    artistIds: ArtistId[];
    duration: number;
}
export interface TrackBase {
    id: TrackId;
    title: string;
    titleDisplay?: string;
    artists: ArtistBase[];
    duration: number;
}

export type TrackActionType = "queue" | "like" | "delete" | "edit";
export interface TrackActionConfig {
    icon: React.ComponentType<IconProps>;
    color: string;
}
export interface TrackItemProps {
    track: TrackBase;
    onSelect: (track: TrackBase) => void;
    index: number;
	actions?: [TrackActionType, TrackActionType, TrackActionType, TrackActionType]; //leftmost action to rightmost action
}

