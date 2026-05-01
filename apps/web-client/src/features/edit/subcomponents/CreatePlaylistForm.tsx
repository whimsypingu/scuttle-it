import { useState } from "react";
import { useEdit } from "@/store/hooks/useEdit";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { getTrackDisplayMetadata } from "@/track/track.utils";

import type { TrackBase } from "@/track/track.types";
import type { CreatePlaylistMutationProps, EditArtistPayload, EditTrackPayload } from "@/store/hooks/hooks.types";
import { usePlaylistsMutations } from "@/store/hooks/usePlaylists";


interface CreatePlaylistFormProps {
    onSave: () => void;
}

export const CreatePlaylistForm = ({ 
    onSave 
}: CreatePlaylistFormProps) => {
    const [nameInput, setNameInput] = useState("");

    //edit hook
    const { createPlaylist } = usePlaylistsMutations();

    const handleSave = () => {
        const createPlaylistVars: CreatePlaylistMutationProps = {
            playlistId: "hello",
            name: nameInput,
        }
        createPlaylist(createPlaylistVars);
        onSave();
    }

    return (
        <div className="flex flex-col gap-2">
            {/* Title Section */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <Textarea
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder={"placeholder"}
                    className="text-md focus-visible:ring-1"
                />
            </div>

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