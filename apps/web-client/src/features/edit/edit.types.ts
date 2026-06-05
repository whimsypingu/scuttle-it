import type { SummaryPlaylist } from "@/playlist/playlist.types";
import type { TrackBase } from "@/track/track.types";
import type { UserStats } from "@/features/profile/profile.types";


//flexible typing for what can be edited in a popup
export type ActiveEditTarget = 
    | { type: "editTrack"; data: TrackBase }
    | { type: "createPlaylist"; data: null }
    | { type: "editPlaylist"; data: SummaryPlaylist }
    | { type: "clearQueue"; data: null }
    | { type: "editProfile"; data: UserStats };
    //add more things to edit later, like playlists
export type EditableType = ActiveEditTarget["type"];

export interface EditPopupMetadata {
    title: string;
    description: string;
}

//option for nothing selected via null
export type EditTarget = ActiveEditTarget | null; 

export interface EditContextValue {
    editTarget: EditTarget;
    setEditTarget: (editTarget: EditTarget) => void;
}
