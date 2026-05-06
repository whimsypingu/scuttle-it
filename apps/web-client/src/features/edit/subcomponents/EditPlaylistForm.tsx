import { useState } from "react";
import { useEditPlaylist, useEditTrack } from "@/store/hooks/useEdit";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import type { PlaylistSummary } from "@/playlist/playlist.types";
import type { EditPlaylistMutationProps, EditPlaylistPayload } from "@/store/hooks/hooks.types";


interface EditPlaylistFormProps {
    playlist: PlaylistSummary;
    onSave: () => void;
}

export const EditPlaylistForm = ({ 
    playlist, 
    onSave 
}: EditPlaylistFormProps) => {
    const [nameInput, setNameInput] = useState<string>(playlist.name);
    const [descriptionInput, setDescriptionInput] = useState<string>(playlist.description ?? "");

    //edit hook with extra track details
    const { playlistDetails, isLoading, editPlaylist } = useEditPlaylist(playlist);

    const handleSave = () => { //use temp edit payload strategy -- migrate to artist selection in the future
        const playlistPayload: EditPlaylistPayload = {
            name: nameInput || undefined,
            description: descriptionInput || undefined,
        };
        const editPlaylistVars: EditPlaylistMutationProps = {
            playlistId: playlist.id,
            payload: playlistPayload,
        };
        editPlaylist(editPlaylistVars);
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
                        placeholder={playlist.name}
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
                        placeholder={playlist.description ?? "Playlist description (Optional)"}
                        className="text-md focus-visible:ring-1"
                    />
                </div>

                {/* Delete Button */}
                <div className="flex flex-col gap-1">
                    
                </div>
            </div>

            {/* Save */}
            <div className="flex justify-end pt-4">
                <Button
                    className="min-w-[80px]"
                    variant="secondary"
                    onClick={handleSave}
                >
                    Save
                </Button>
            </div>
        </div>
    );
};