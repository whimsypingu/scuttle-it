import { useState } from "react";
import { usePlaylistsMutations } from "@/store/hooks/usePlaylists";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { generateUUID } from "@/lib/generate";

import type { CreatePlaylistMutationProps, CreatePlaylistPayload } from "@/store/hooks/hooks.types";


interface CreatePlaylistFormProps {
    onSave: () => void;
}

export const CreatePlaylistForm = ({ 
    onSave 
}: CreatePlaylistFormProps) => {
    const [nameInput, setNameInput] = useState("");
    const [descriptionInput, setDescriptionInput] = useState("");

    //edit hook
    const { createPlaylist } = usePlaylistsMutations();

    const handleSave = () => {
        const playlistPayload: CreatePlaylistPayload = {
            playlistId: generateUUID(), //generates a standard v4 UUID for the playlist ID if in a secure context, otherwise a custom `insecure-xxxx...` id
            name: nameInput,
            description: descriptionInput || undefined,
        };
        const createPlaylistVars: CreatePlaylistMutationProps = {
            payload: playlistPayload,
        };
        createPlaylist(createPlaylistVars);
        onSave();
    }

    return (
        <div className="flex flex-col h-full">
            <div className="h-full custom-scrollbar overflow-y-auto flex flex-col gap-2">
                {/* Name Section */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-muted-foreground">
                        Name
                    </label>
                    <Textarea
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder={"Give this playlist a name..."}
                        className="text-md focus-visible:ring-1"
                    />
                </div>

                {/* Description Section */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-muted-foreground">
                        Description
                    </label>
                    <Textarea
                        value={descriptionInput}
                        onChange={(e) => setDescriptionInput(e.target.value)}
                        placeholder={"Write a little about this playlist..."}
                        className="text-md focus-visible:ring-1"
                    />
                </div>
            </div>

            {/* Save */}
            <div className="flex justify-end pt-4">
                <Button
                    className="min-w-[80px]"
                    variant="secondary"
                    onClick={handleSave}
                >
                    Create
                </Button>
            </div>
        </div>
    );
};