import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { TrackBase } from "@/model/model.types";
import { getTrackDisplayMetadata } from "@/model/model.utils";
import { Button } from "@/components/ui/button";


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

    const { titleDisplay, artistDisplay } = getTrackDisplayMetadata(track);

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
                    onClick={onSave}
                >
                    Save
                </Button>
            </div>
        </div>
    );
};