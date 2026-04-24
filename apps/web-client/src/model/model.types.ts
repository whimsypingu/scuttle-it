import type { IconProps } from "@phosphor-icons/react";

export type ArtistId = string;
export type TrackId = string;
export type QueueId = number; //queue integrity value

export interface ArtistBase {
    id: ArtistId;
    name: string;
    nameDisplay?: string;
}


export interface TrackBase {
    id: TrackId;
    title: string;
    titleDisplay?: string;
    artists: ArtistBase[];
    duration: number;
}
export interface QueueTrack extends TrackBase {
    queueId: QueueId;
    position: number;
}

//all available track actions with their required properties to execute the functions
export type TrackActionProps = 
    | { action: "setFirst"; track: TrackBase }
    | { action: "queueLast"; track: TrackBase }
    | { action: "queueNext"; track: TrackBase }
    | { action: "like"; track: TrackBase }
    | { action: "delete"; track: TrackBase }
    | { action: "deleteQueue"; queueTrack: QueueTrack }
    | { action: "edit"; track: TrackBase };
export type TrackAction = TrackActionProps["action"];

export interface TrackActionConfig { //corresponding phosphor icon and color pairing to show on swipe for a TrackAction
    icon: React.ComponentType<IconProps>;
    color: string;
}

//fields for a TrackItem
export interface TrackItemProps {
    track: TrackBase | QueueTrack; //technically just TrackBase works fine but for clarity it could be version of one
    onSelect: (track: TrackBase | QueueTrack) => void;
    index: number;
	actions?: [TrackAction, TrackAction, TrackAction, TrackAction]; //leftmost action to rightmost action
}

