import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEditTrack } from "@/features/edit/EditProvider";


export const EditPopup = () => {
    const { editTrack, setEditTrack } = useEditTrack();

    const isOpen = !!editTrack;

    const handleClose = () => {
        setEditTrack(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Track</DialogTitle>
                    <DialogDescription>Make changes</DialogDescription>
                </DialogHeader>

                <div>
                    Hello world
                </div>
            </DialogContent>
        </Dialog>
    );
};
