import { useEdit } from "@/features/edit/EditProvider";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EDIT_CONFIG } from "@/features/edit/edit.constants";


export const EditPopup = () => {
    const { editTarget, setEditTarget } = useEdit(); //access our custom Provider

    const isOpen = !!editTarget; //check for non-null editTarget

    const handleClose = () => {
        setEditTarget(null);
    };

    //lookup the config details based on the type of editTarget
    const config = editTarget ? EDIT_CONFIG[editTarget.type] : null;

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

                <div>
                    {editTarget?.data?.title}
                </div>
            </DialogContent>
        </Dialog>
    );
};
