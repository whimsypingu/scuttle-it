import { useState } from "react";
import { usePlaylistsMutations } from "@/store/hooks/usePlaylists";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { generateUUID } from "@/lib/generate";

import { MIN_BUTTON_WIDTH } from "@/features/edit/edit.constants";

import type { CreatePlaylistPayload } from "@/store/hooks/hooks.types";
import { useQueue, useSetQueue } from "@/store/hooks/useQueue";


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