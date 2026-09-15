import React, { useEffect, useState } from "react";
import { useEditTrack } from "@/store/hooks/useEdit";
import { usePlaylists } from "@/store/hooks/usePlaylists";
import { useOffline } from "@/features/offline/OfflineProvider";

import { LinkIcon, NotchesIcon } from "@phosphor-icons/react";

import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HoldToDeleteButton } from "@/components/ui/hold-delete";

import { getTrackDisplayMetadata, getTrackSourceMetadata, getTrackSourceLink } from "@/track/track.utils";

import { MIN_BUTTON_WIDTH, SOURCE_ICON_SIZE } from "@/features/edit/edit.constants";

import type { ArtistBase, TrackBase } from "@/track/track.types";
import type { PlaylistId } from "@/playlist/playlist.types";
import type { EditArtistPayload, EditTrackPayload } from "@/store/hooks/hooks.types";
import { Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxContent, ComboboxEmpty, ComboboxItem, ComboboxList, ComboboxValue, useComboboxAnchor } from "@/components/ui/combobox";
import { useArtistSearch } from "@/store/hooks/useSearch";


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

    const { isOffline } = useOffline();

    const { title, artists } = getTrackSourceMetadata(track); //source data
    const { link } = getTrackSourceLink(track);

    const { titleDisplay, artistDisplay } = getTrackDisplayMetadata(track); //placeholders

    //combobox
    const anchor = useComboboxAnchor();
    const [selectedArtists, setSelectedArtists] = useState<ArtistBase[]>(track.artists);
    const { artistResults } = useArtistSearch(artistInput);

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
                        disabled={isOffline}
                        className="text-md focus-visible:ring-1"
                    />
                </div>

                {/* Artists Section */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-muted-foreground">
                        Artist
                    </label>
                    {/* <Textarea
                        value={artistInput}
                        onChange={(e) => setArtistInput(e.target.value)}
                        placeholder={artistDisplay}
                        disabled={isOffline}
                        className="text-md focus-visible:ring-1"
                    /> */}
                    
                    <Combobox
                        multiple
                        autoHighlight
                        items={artistResults}
                        
                        defaultValue={track.artists}
                        value={selectedArtists}
                        onValueChange={(newArtists: ArtistBase[]) => setSelectedArtists(newArtists)}

                        inputValue={artistInput}
                        onInputValueChange={(newInput: string) => setArtistInput(newInput)}
                    >
                        <ComboboxChips ref={anchor} className="w-full max-w-sm flex-wrap p-1.5 gap-1.5 min-h-[42px]">
                            <ComboboxValue>
                                {(values: ArtistBase[]) => (
                                    <React.Fragment>
                                        {values.map((value) => (
                                            <ComboboxChip key={value.name} className="px-2 py-0.5 text-xs font-medium">{value.name}</ComboboxChip>
                                        ))}
                                        <ComboboxChipsInput className="text-sm py-1 px-1 min-w-[100px]" placeholder="Add framework..." />
                                    </React.Fragment>
                                )}
                            </ComboboxValue>
                        </ComboboxChips>

                        <ComboboxContent
                            anchor={anchor}
                            className="z-50 min-w-[var(--anchor-width)] w-[var(--anchor-width)] rounded-md border bg-popover text-popover-foreground shadow-md outline-none"
                        >
                            <ComboboxEmpty className="p-3 text-center text-xs text-muted-foreground">
                                No items found.
                            </ComboboxEmpty>

                            <ComboboxList className="max-h-56 overflow-y-auto p-1 space-y-0.5">
                                {(item: ArtistBase) => (
                                    <ComboboxItem 
                                        key={item.name} 
                                        value={item}
                                        className="flex items-center justify-between px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                                    >
                                        {item.name}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
        
                        </ComboboxContent>
                    </Combobox>
                </div>

                {/* PLAYLIST MEMBERSHIP */}
                {!isOffline && (
                    <>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-muted-foreground">
                            Playlists
                        </label>
                        {renderPlaylistContent()}
                    </div>
                    </>
                )}

                {/* Source Section */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-muted-foreground">
                        Source
                    </label>
                    {renderSourceContent()}
                </div>

                {/* Delete Button */}
                {!isOffline && (
                    <>
                    <div className="flex justify-end pt-2 pb-1">
                        <HoldToDeleteButton onDelete={handleDelete} />
                    </div>
                    </>
                )}
            </div>


            {/* Save */}
            {!isOffline && (
                <>
                <div className="flex justify-end pt-4">
                    <Button
                        className={`min-w-[${MIN_BUTTON_WIDTH}px]`}
                        variant="secondary"
                        onClick={handleSave}
                    >
                        Save
                    </Button>
                </div>
                </>
            )}
        </div>
    );
};