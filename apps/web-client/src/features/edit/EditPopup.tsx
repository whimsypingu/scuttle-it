import { useEditTarget } from "@/features/edit/EditProvider";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EDIT_CONFIG } from "@/features/edit/edit.constants";
import { EditTrackForm } from "./subcomponents/EditTrackForm";


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
            case "track":
                return (
                    <EditTrackForm
                        track={editTarget.data}
                        onSave={handleClose}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {config?.title ?? "Edit"}
                    </DialogTitle>
                    <DialogDescription>
                        {config?.description ?? "Make changes."}
                    </DialogDescription>
                </DialogHeader>

                {activeEditForm()}

            </DialogContent>
        </Dialog>
    );
};
