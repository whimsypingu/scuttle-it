import { useEffect, useState } from "react";
import { useEditTrack } from "@/store/hooks/useEdit";
import { usePlaylists } from "@/store/hooks/usePlaylists";

import { LinkIcon, NotchesIcon } from "@phosphor-icons/react";

import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HoldToDeleteButton } from "@/components/ui/hold-delete";

import { getTrackDisplayMetadata, getTrackSourceMetadata, getTrackSourceLink } from "@/track/track.utils";

import { MIN_BUTTON_WIDTH, SOURCE_ICON_SIZE } from "@/features/edit/edit.constants";

import type { TrackBase } from "@/track/track.types";
import type { PlaylistId } from "@/playlist/playlist.types";
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

    const { title, artists } = getTrackSourceMetadata(track); //source data
    const { link } = getTrackSourceLink(track);

    const { titleDisplay, artistDisplay } = getTrackDisplayMetadata(track); //placeholders

    //all possible playlists
    const { playlists } = usePlaylists();

    //edit hook with extra track details
    const { trackDetails, isLoading, editTrack, deleteTrack } = useEditTrack(track);
    const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<PlaylistId>>(new Set()); //displayed set of selected playlist IDs

    useEffect(() => { //load when the data arrives to prevent possibly displaying stale values
        if (trackDetails?.playlists) {
            setSelectedPlaylistIds(new Set(trackDetails.playlists.map(p => p.id)));
        }
    }, [trackDetails]);

    const handlePlaylistToggle = (playlistId: PlaylistId) => { //useState holds immutable objects so we replace with changes, consider useStating each line
        setSelectedPlaylistIds(prev => {
            const next = new Set(prev);
            if (next.has(playlistId)) {
                next.delete(playlistId);
            } else {
                next.add(playlistId);
            }
            return next;
        });
    };

    //draw the ui subcomponent for the playlist checkboxes
    const renderPlaylistContent = () => {
        if (isLoading) {
            return (<div className="p-4 animate-pulse">Loading playlists...</div>);
        }

        if (!trackDetails) {
            return (<div>Error loading track.</div>);
        }

        return (
            <div className="flex flex-col px-1">
                {playlists.map((p, index) => (
                    <div 
                        className={`flex flex-row items-center gap-2 px-1 py-2 cursor-pointer transition-colors ${index == 0 ? "border-t" : ""} border-b`}
                        onClick={() => handlePlaylistToggle(p.id)}
                    >
                        <Checkbox 
                            id={p.id}
                            checked={selectedPlaylistIds.has(p.id)}
                        />

                        <label className="text-sm font-medium text-muted-foreground">
                            {p.name}
                        </label>
                    </div>
                ))}
            </div>
        );
    };

    //draw the ui subcomponent for the source data
    const renderSourceContent = () => {
        return (
            <div className="flex flex-col px-1">
                <div className="flex flex-row items-center gap-2 px-1 py-1">
                    <div className="shrink-0">
                        <NotchesIcon size={SOURCE_ICON_SIZE} />
                    </div>
                    <label className="flex-1 text-xs font-medium text-muted-foreground">
                        {title}
                    </label>
                </div>

                <div className="flex flex-row items-center gap-2 px-1 py-1">
                    <div className="shrink-0">
                        <NotchesIcon size={SOURCE_ICON_SIZE} />
                    </div>
                    <label className="flex-1 text-xs font-medium text-muted-foreground">
                        {artists}
                    </label>
                </div>

                <a 
                    href={link}
                    target="_blank" //open in new tab
                    rel="noopener noreferrer nofollow" //security, privacy, and seo
                >
                    <div className="flex flex-row items-center gap-2 px-1 py-1 active:scale-[0.98]">
                        <div className="shrink-0">
                            <LinkIcon size={SOURCE_ICON_SIZE} />
                        </div>
                        <label className="flex-1 text-xs font-medium underline underline-offset-4 text-muted-foreground">
                            {link}
                        </label>
                    </div>
                </a>
            </div>
        );
    };

    const handleSave = () => { //use temp edit payload strategy -- migrate to artist selection in the future
        const artistPayload: EditArtistPayload = {
            nameDisplay: artistInput || undefined,
        };

        const originalIds = trackDetails?.playlists.map(p => p.id) ?? [];
        const hasPlaylistChanges = selectedPlaylistIds.size !== originalIds.length || originalIds.some(id => !selectedPlaylistIds.has(id));

        //finalized payload
        const payload: EditTrackPayload = {
            titleDisplay: titleInput || undefined,
            artists: artistInput ? [artistPayload] : undefined,
            playlistIds: hasPlaylistChanges ? [...selectedPlaylistIds] : undefined,
        };
        editTrack(payload);
        onSave();
    }

    const handleDelete = () => {
        deleteTrack();
        onSave();
    }

    return (
        <div className="flex flex-col h-full">
            <div className="h-full custom-scrollbar overflow-y-auto flex flex-col gap-4">
                {/* Title Section */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-muted-foreground">
                        Title
                    </label>
                    <Textarea
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        placeholder={titleDisplay}
                        className="text-md focus-visible:ring-1"
                    />
                </div>

                {/* Artists Section */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-muted-foreground">
                        Artist
                    </label>
                    <Textarea
                        value={artistInput}
                        onChange={(e) => setArtistInput(e.target.value)}
                        placeholder={artistDisplay}
                        className="text-md focus-visible:ring-1"
                    />
                </div>

                {/* PLAYLIST MEMBERSHIP */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-muted-foreground">
                        Playlists
                    </label>
                    {renderPlaylistContent()}
                </div>

                {/* Source Section */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-muted-foreground">
                        Source
                    </label>
                    {renderSourceContent()}
                </div>

                {/* Delete Button */}
                <div className="flex justify-end pt-2 pb-1">
                    <HoldToDeleteButton onDelete={handleDelete} />
                </div>
            </div>

            {/* Save */}
            <div className="flex justify-end pt-4">
                <Button
                    className={`min-w-[${MIN_BUTTON_WIDTH}px]`}
                    variant="secondary"
                    onClick={handleSave}
                >
                    Save
                </Button>
            </div>
        </div>
    );
};