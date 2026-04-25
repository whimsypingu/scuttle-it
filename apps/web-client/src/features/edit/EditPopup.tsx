import { useEdit } from "@/features/edit/EditProvider";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";


export const EditPopup = () => {
    const { editTarget, setEditTarget } = useEdit(); //access our custom Provider

    const isOpen = !!editTarget; //check for non-null editTarget

    const handleClose = () => {
        setEditTarget(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit</DialogTitle>
                    <DialogDescription>Make changes</DialogDescription>
                </DialogHeader>

                <div>
                    Hello world
                </div>
            </DialogContent>
        </Dialog>
    );
};
