import type { TrackBase } from "@/model/model.types";


//flexible typing for what can be edited in a popup
export type ActiveEditTarget = 
    | { type: "track"; data: TrackBase };
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
