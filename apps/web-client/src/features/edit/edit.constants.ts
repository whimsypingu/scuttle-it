import type { EditableType, EditPopupMetadata } from "@/features/edit/edit.types";


export const EDIT_CONFIG: Record<EditableType, EditPopupMetadata> = {
    track: {
        title: "Edit Track",
        description: "Update the metadata for this track.",
    },
};
