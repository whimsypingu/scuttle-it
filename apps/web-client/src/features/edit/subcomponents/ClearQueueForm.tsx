import { useSetQueue } from "@/store/hooks/useQueue";

import { Button } from "@/components/ui/button";

import { MIN_BUTTON_WIDTH } from "@/features/edit/edit.constants";


interface ClearQueueFormProps {
    onSave: () => void;
}

export const ClearQueueForm = ({ 
    onSave 
}: ClearQueueFormProps) => {

    //edit hook
    const { clearQueue } = useSetQueue();

    const handleSave = () => {
        clearQueue();
        onSave();
    }

    return (
        <>
        {/* Save */}
        <div className="flex justify-center pt-2">
            <Button
                className={`min-w-[${MIN_BUTTON_WIDTH}px]`}
                variant="secondary"
                onClick={handleSave}
            >
                Clear
            </Button>
        </div>
        </>
    );
};