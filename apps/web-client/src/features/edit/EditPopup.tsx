import { useEditTarget } from "@/features/edit/EditProvider";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditTrackForm } from "@/features/edit/subcomponents/EditTrackForm";
import { CreatePlaylistForm } from "@/features/edit/subcomponents/CreatePlaylistForm";

import { EDIT_CONFIG } from "@/features/edit/edit.constants";
import { EditPlaylistForm } from "./subcomponents/EditPlaylistForm";


export const EditPopup = () => {
    const { editTarget, setEditTarget } = useEditTarget(); //access our custom Provider

    const isOpen = !!editTarget; //check for non-null editTarget

    const handleClose = () => {
        setEditTarget(null);
    };

    //lookup the config details based on the type of editTarget
    const config = editTarget ? EDIT_CONFIG[editTarget.type] : null;

    //pick the right form to display
    const activeEditForm = () => {
        if (!editTarget) return null;

        switch (editTarget.type) {
            case "editTrack":
                return (
                    <EditTrackForm
                        track={editTarget.data}
                        onSave={handleClose}
                    />
                );
            case "createPlaylist":
                return (
                    <CreatePlaylistForm 
                        onSave={handleClose} 
                    />
                );
            case "editPlaylist":
                return (
                    <EditPlaylistForm
                        playlist={editTarget.data}
                        onSave={handleClose}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>
                        {config?.title ?? "Edit"}
                    </DialogTitle>
                    <DialogDescription>
                        {config?.description ?? "Make changes."}
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[70dvh] overflow-hidden">
                    {activeEditForm()}
                </div>

            </DialogContent>
        </Dialog>
    );
};
