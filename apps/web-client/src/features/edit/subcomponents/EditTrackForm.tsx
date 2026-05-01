import { useState } from "react";
import { useEdit } from "@/store/hooks/useEdit";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { getTrackDisplayMetadata } from "@/track/track.utils";

import type { TrackBase } from "@/track/track.types";
import type { EditArtistPayload, EditTrackPayload } from "@/store/hooks/hooks.types";


interface EditTrackFormProps {
    track: TrackBase;
    onSave: () => void;
}

export const EditTrackForm = ({ 
    track, 
    onSave 
}: EditTrackFormProps) => {
    const [titleInput, setTitleInput] = useState("");
    //const [artists, setArtists] = useState<string[]>(track.artists.map(a => a.nameDisplay ?? a.name)); //EMERGENCY: use this with shadcn badges? to make artists selectable in the future
    const [artistInput, setArtistInput] = useState("");

    const { titleDisplay, artistDisplay } = getTrackDisplayMetadata(track); //placeholders

    //edit hook
    const { editTrack } = useEdit();

    const handleSave = () => { //use temp edit payload strategy -- migrate to artist selection in the future
        const artistPayload: EditArtistPayload = {
            nameDisplay: artistInput || undefined,
        };
        const payload: EditTrackPayload = {
            id: track.id, 
            titleDisplay: titleInput || undefined,
            artists: artistInput ? [artistPayload] : undefined,
        };

        editTrack({ payload });
        onSave();
    }

    return (
        <div className="flex flex-col gap-2">
            {/* Title Section */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-muted-foreground">Title</label>
                <Textarea
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder={titleDisplay}
                    className="text-md focus-visible:ring-1"
                />
            </div>

            {/* Artists Section */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-muted-foreground">Artist</label>
                <Textarea
                    value={artistInput}
                    onChange={(e) => setArtistInput(e.target.value)}
                    placeholder={artistDisplay}
                    className="text-md focus-visible:ring-1"
                />
            </div>

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