import { motion, AnimatePresence } from "framer-motion";
import { PlusIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { usePlaylists } from "@/store/hooks/usePlaylists";
import { useEditTarget } from "@/features/edit/EditProvider";

import { PlaylistItem } from "@/playlist/PlaylistItem";
import { PlaylistContentView } from "@/features/library/subcomponents/PlaylistContent";

import { NAV_CONFIG, BOTTOM_SHELF, PLAYER_CONFIG } from "@/features/player/player.constants";

import type { SummaryPlaylist } from "@/playlist/playlist.types";
import type { LibraryViewProps } from "@/features/library/library.types";
import type { ActiveEditTarget } from "@/features/edit/edit.types";


export const MockLibrary = ({
    tabResetSignal
}: LibraryViewProps) => {

    const { playlists } = usePlaylists();
    
    const [selectedPlaylist, setSelectedPlaylist] = useState<SummaryPlaylist | null>(null);

    // prep the 'create playlist' form popup function
    const { setEditTarget } = useEditTarget();
    const openCreatePlaylistForm = () => {
        const createPlaylistTarget: ActiveEditTarget = {
            type: "createPlaylist", 
            data: null,
        };
        setEditTarget(createPlaylistTarget);
    }

    // Reset when the signal changes
    useEffect(() => {
        if (tabResetSignal > 0) {
            setSelectedPlaylist(null);
            // If you had a scrollRef, you'd trigger it here too:
            // scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [tabResetSignal]);


    return (
        <>
        <div 
            className="w-full h-full flex flex-col px-4 overflow-hidden touch-none"
            style={{ paddingBottom: `${NAV_CONFIG.height}px` }}
        >
            <AnimatePresence mode="wait">
                {!selectedPlaylist ? (
                    <>
                    {/* LIST VIEW */}
                    <motion.div
                        key="library-root"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex flex-col"
                    >
                        {/* HEADER */}
                        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md py-4 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <h1 className="tab-heading truncate pr-4">
                                    Library
                                </h1>
                            </div>
                
                            {/* ABOUT / METADATA SECTION */}
                            <div className="mx-1">
                                <div className="flex gap-4">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] text-zinc-600 uppercase font-medium">Playlists</span>
                                        <span className="text-xs text-white/70">
                                            {playlists.length}
                                        </span>
                                    </div>

                                    {/* RIGHT ACTION GROUP */}
                                    <div className="ml-auto flex items-end gap-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all">
                                        {/* CREATE */}
                                        <button 
                                            className="p-1"
                                            onClick={openCreatePlaylistForm}
                                        >
                                            <PlusIcon size={PLAYER_CONFIG.iconSize} weight="bold" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CONTENT AREA */}
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <div 
                                className="flex flex-col gap-1"
                                style={{ marginBottom: `${BOTTOM_SHELF.totalHeight}px` }}
                            >
                                {/* PLAYLIST LIST */}
                                {playlists.map((p) => (
                                    <PlaylistItem
                                        key={p.id}
                                        playlist={p}
                                        onSelect={(p) => setSelectedPlaylist(p)}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                    </>
                ) : (
                    <>
                    <PlaylistContentView
                        summaryData={selectedPlaylist}
                        onClose={() => setSelectedPlaylist(null)}
                    />
                    </>
                )}
            </AnimatePresence>
        </div>
        </>
    );
};


// const MOCK_PLAYLISTS = [
//     { id: "p1", name: "Late Night Lo-fi", totalCount: 42, color: "#581c87" },
//     { id: "p2", name: "Vinyl Rips 2026", totalCount: 12, color: "#164e63" },
//     { id: "p3", name: "Driving Mix", totalCount: 128, color: "#701a75" },
//     { id: "p4", name: "Gym Energy", totalCount: 24, color: "#831843" },
//     { id: "p5", name: "Deep Focus", totalCount: 67, color: "#1e3a8a" },
//     { id: "p6", name: "Summer '24 Archives", totalCount: 89, color: "#ea580c" },
//     { id: "p7", name: "Acoustic Sessions", totalCount: 34, color: "#65a30d" },
//     { id: "p8", name: "Synthesizer Dreams", totalCount: 56, color: "#2563eb" },
//     { id: "p9", name: "Midnight City Pop", totalCount: 112, color: "#be185d" }, 
//     { id: "p10", name: "Field Recordings", totalCount: 45, color: "#15803d" },  
//     { id: "p11", name: "Neo-Soul Essentials", totalCount: 28, color: "#b45309" },
//     { id: "p12", name: "C64 Soundtracks", totalCount: 210, color: "#4338ca" },   
//     { id: "p13", name: "Lo-fi Beats to Archive", totalCount: 74, color: "#0f766e" },
//     { id: "p14", name: "Classical Favorites", totalCount: 18, color: "#7f1d1d" },
// ];