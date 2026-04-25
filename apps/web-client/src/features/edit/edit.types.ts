import type { TrackBase } from "@/model/model.types";


//flexible typing for what can be edited in a popup
export type EditTarget =
    | { type: "track"; data: TrackBase }
    // add more things to edit later, like playlists
    | null;

export interface EditContextValue {
    editTarget: EditTarget;
    setEditTarget: (editTarget: EditTarget) => void;
}