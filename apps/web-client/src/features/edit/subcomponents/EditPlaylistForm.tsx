import { useState } from "react";
import { useEditPlaylist } from "@/store/hooks/useEdit";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { MIN_BUTTON_WIDTH } from "@/features/edit/edit.constants";

import type { SummaryPlaylist } from "@/playlist/playlist.types";
import type { EditPlaylistMutationProps, EditPlaylistPayload } from "@/store/hooks/hooks.types";


interface EditPlaylistFormProps {
    playlist: SummaryPlaylist;
    onSave: () => void;
}

export const EditPlaylistForm = ({ 
    playlist, 
    onSave 
}: EditPlaylistFormProps) => {
    const [nameInput, setNameInput] = useState<string>(playlist.name);
    const [descriptionInput, setDescriptionInput] = useState<string>(playlist.description ?? "");

    //edit hook with extra playlist details
    const { playlistDetails, isLoading, editPlaylist } = useEditPlaylist(playlist); //provides support for future details like created timestamp etc

    const handleSave = () => {
        //finalized payload
        const payload: EditPlaylistPayload = {
            name: nameInput || undefined,
            description: descriptionInput || null, //change this to be undefined for no change
        };
        const editPlaylistVars: EditPlaylistMutationProps = {
            playlistId: playlist.id,
            payload,
        };
        editPlaylist(editPlaylistVars);
        onSave();
    }

    const handleDelete = () => {
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
                        placeholder={"Write a little about this playlist..."}
                        className="text-md focus-visible:ring-1"
                    />
                </div>

                {/* Delete Button */}
                <div className="flex justify-end pb-1">
                    <div className="h-0 px-1 py-2 transition-colors border-t" />
                    <Button
                        className={`min-w-[${MIN_BUTTON_WIDTH}px]`}
                        variant="destructive"
                        onClick={handleDelete}
                    >
                        Delete
                    </Button>
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