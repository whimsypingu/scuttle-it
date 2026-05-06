import type { EditableType, EditPopupMetadata } from "@/features/edit/edit.types";


export const EDIT_CONFIG: Record<EditableType, EditPopupMetadata> = {
    editTrack: {
        title: "Edit Track",
        description: "Update the metadata for this track.",
    },
    createPlaylist: {
        title: "Create Playlist",
        description: "Make a new playlist.",
    },
    editPlaylist: {
        title: "Edit Playlist",
        description: "Update the metadata for this playlist.",
    },
};
