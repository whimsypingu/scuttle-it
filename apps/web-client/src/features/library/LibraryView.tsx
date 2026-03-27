import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { NAV_CONFIG, BOTTOM_SHELF } from "@/features/player/player.constants";

import { PlaylistItem } from "../playlist/PlaylistItem";
import { PlaylistDetailView } from "../playlist/PlaylistDetailView";
import type { Playlist } from "../playlist/playlist.types";

export const MockLibrary = () => {
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

    return (
        <>
        <div 
            className="w-full h-full flex flex-col px-4 overflow-hidden touch-none"
            style={{ paddingBottom: `${NAV_CONFIG.height}px` }}
        >
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
];