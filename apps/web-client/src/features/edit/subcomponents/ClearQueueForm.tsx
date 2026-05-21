import { useState } from "react";
import { usePlaylistsMutations } from "@/store/hooks/usePlaylists";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { generateUUID } from "@/lib/generate";

import { MIN_BUTTON_WIDTH } from "@/features/edit/edit.constants";

import type { CreatePlaylistPayload } from "@/store/hooks/hooks.types";


interface ClearQueueFormProps {
    onSave: () => void;
}

export const ClearQueueForm = ({ 
    onSave 
}: ClearQueueFormProps) => {

    //edit hook
    // const { createPlaylist } = usePlaylistsMutations();

    const handleSave = () => {
        //finalized payload
        // const payload: CreatePlaylistPayload = {
        //     playlistId: generateUUID(), //generates a standard v4 UUID for the playlist ID if in a secure context, otherwise a custom `insecure-xxxx...` id
        //     name: nameInput,
        //     description: descriptionInput || null,
        // };
        // createPlaylist(payload);
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