import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { NAV_CONFIG, BOTTOM_SHELF } from "@/features/player/player.constants";

import { PlaylistItem } from "../playlist/PlaylistItem";
import { PlaylistDetailView } from "../playlist/PlaylistDetailView";
import type { Playlist } from "../playlist/playlist.types";

import { XIcon } from "@phosphor-icons/react";

export const MockLibrary = () => {
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

    return (
        <>
        <div 
            className="w-full h-full flex flex-col px-4 overflow-hidden touch-none"
            style={{ paddingBottom: `${NAV_CONFIG.height}px` }}
        >
            <AnimatePresence mode="wait">
                {!selectedPlaylist ? (
                    <>
                    <motion.div
                        key="library-list-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex flex-col"
                    >
                        {/* HEADER */}
                        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md py-4">
                            <h1 className="tab-heading">Library</h1>
                        </div>

                        {/* CONTENT AREA */}
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <div 
                                className="flex flex-col gap-1"
                                style={{ marginBottom: `${BOTTOM_SHELF.totalHeight}px` }}
                            >
                                {/* PLAYLIST LIST */}
                                {MOCK_PLAYLISTS.map((p) => (
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
                    <motion.div
                        key="playlist-detail-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex flex-col"
                    >
                        {/* HEADER */}
                        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md py-4 flex items-center justify-between">
                            <h1 className="tab-heading truncate pr-4">
                                {selectedPlaylist.name}
                            </h1>
                            <button
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    setSelectedPlaylist(null);
                                }}
                                className="text-sm font-medium text-white/40 active:text-white shrink-0"
                            >
                                <XIcon size={20} weight="bold" />
                            </button>
                        </div>

                        {/* CONTENT AREA */}
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <div 
                                className="flex flex-col gap-0"
                                style={{ marginBottom: `${BOTTOM_SHELF.totalHeight}px` }}
                            >
                                <PlaylistDetailView
                                    playlist={selectedPlaylist}
                                />
                            </div>
                        </div>

                    </motion.div>
                    </>
                )}
            </AnimatePresence>


        </div>
        </>
    );

    const deprecated = (
        <>
        {/* HEADER */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md py-4">
            <h1 className="tab-heading">Library</h1>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
            <AnimatePresence mode="wait">
                {!selectedPlaylist ? (
                    <>
                    <motion.div 
                        key="library-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col gap-0"
                        style={{ marginBottom: `${BOTTOM_SHELF.totalHeight}px` }}
                    >
                        {/* PLAYLIST LIST */}
                        {MOCK_PLAYLISTS.map((p) => (
                            <PlaylistItem
                                key={p.id}
                                playlist={p}
                                onSelect={(p) => setSelectedPlaylist(p)}
                            />
                        ))}
                    </motion.div>
                    </>
                ) : (
                    <>
                    <PlaylistDetailView
                        playlist={selectedPlaylist}
                    />
                    </>
                )}
            </AnimatePresence>
        </div>
        </>
    );
};

const MOCK_PLAYLISTS = [
    { id: "p1", name: "Late Night Lo-fi", trackCount: 42, color: "#581c87" },
    { id: "p2", name: "Vinyl Rips 2026", trackCount: 12, color: "#164e63" },
    { id: "p3", name: "Driving Mix", trackCount: 128, color: "#701a75" },
    { id: "p4", name: "Gym Energy", trackCount: 24, color: "#831843" },
    { id: "p5", name: "Deep Focus", trackCount: 67, color: "#1e3a8a" },
    { id: "p6", name: "Summer '24 Archives", trackCount: 89, color: "#ea580c" },
    { id: "p7", name: "Acoustic Sessions", trackCount: 34, color: "#65a30d" },
    { id: "p8", name: "Synthesizer Dreams", trackCount: 56, color: "#2563eb" },
    { id: "p9", name: "Midnight City Pop", trackCount: 112, color: "#be185d" }, 
    { id: "p10", name: "Field Recordings", trackCount: 45, color: "#15803d" },  
    { id: "p11", name: "Neo-Soul Essentials", trackCount: 28, color: "#b45309" },
    { id: "p12", name: "C64 Soundtracks", trackCount: 210, color: "#4338ca" },   
    { id: "p13", name: "Lo-fi Beats to Archive", trackCount: 74, color: "#0f766e" },
    { id: "p14", name: "Classical Favorites", trackCount: 18, color: "#7f1d1d" },
];