import { useEffect, useState } from "react";

import { BOTTOM_SHELF, NAV_CONFIG } from "@/features/player/player.constants";

import type { HomeContent, HomeViewProps } from "@/features/home/home.types";
import { AnimatePresence, motion } from "framer-motion";
import { HOME_CONTENT_COMPONENTS, HOME_CONTENT_TYPES } from "./home.constants";


export const MockHome = ({
    tabResetSignal
}: HomeViewProps) => {
    const [selectedHomeContent, setSelectedHomeContent] = useState<HomeContent | null>(null);

    // Reset when the signal changes
    useEffect(() => {
        if (tabResetSignal > 0) {
            setSelectedHomeContent(null);
            // If you had a scrollRef, you'd trigger it here too:
            // scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [tabResetSignal]);

    const ActiveHomeContentView = selectedHomeContent 
        ? (HOME_CONTENT_COMPONENTS[selectedHomeContent.type] || HOME_CONTENT_COMPONENTS[HOME_CONTENT_TYPES.OTHER])
        : (HOME_CONTENT_COMPONENTS[HOME_CONTENT_TYPES.OTHER]);

    return (
        <>
        <div 
            className="w-full h-full flex flex-col px-4 overflow-hidden touch-none"
            style={{ paddingBottom: `${NAV_CONFIG.height}px` }}
        >
            <AnimatePresence mode="wait">
                {!selectedHomeContent ? (
                    <>
                    {/* CARD VIEW */}
                    <motion.div
                        key="home-root"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex flex-col"
                    >
                        {/* HEADER */}
                        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md py-4 flex flex-col">
                            <h1 className="tab-heading">Home</h1>
                        </div>

                        {/* CONTENT AREA */}
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <div 
                                className="grid grid-cols-2 gap-4"
                                style={{ marginBottom: `${BOTTOM_SHELF.totalHeight}px` }}
                            >
                                {MOCK_HOME_CONTENTS.map(item => (
                                    <div 
                                        key={item.id} 
                                        className="bg-card aspect-square rounded-md shadow-lg p-4 flex flex-col"
                                        onClick={() => setSelectedHomeContent(item)}
                                    >
                                        {/* Use the mock color as a gradient or a solid block */}
                                        <div 
                                            className="w-full h-3/4 rounded mb-2 transition-opacity hover:opacity-80" 
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <div className="flex flex-col overflow-hidden">
                                            <h3 className="text-sm font-bold truncate text-zinc-100">{item.name}</h3>
                                            <p className="text-[10px] text-zinc-400 line-clamp-1">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                    </>
                ) : (
                    <>
                    <ActiveHomeContentView
                        contentData={selectedHomeContent}
                        onClose={() => setSelectedHomeContent(null)}
                    />
                    </>
                )}
            </AnimatePresence>
        </div>
        </>
    );
};

export const MOCK_HOME_CONTENTS: HomeContent[] = [
    {
        id: "hc1",
        type: HOME_CONTENT_TYPES.DOWNLOADS,
        name: "All Tracks",
        description: "Your core library. Every single track in one playlist.",
        color: "#22c55e", // Green
    },
    {
        id: "hc2",
        type: HOME_CONTENT_TYPES.RECENTLY_PLAYED,
        name: "Recently Played",
        description: "Jump back into the tracks and albums you've been spinning lately.",
        color: "#3b82f6", // Blue
    },
    {
        id: "hc3",
        type: HOME_CONTENT_TYPES.POPULAR,
        name: "Popular Now",
        description: "The hottest tracks trending across the community this week.",
        color: "#ef4444", // Red
    },
    {
        id: "hc4",
        type: HOME_CONTENT_TYPES.OTHER,
        name: "Deep Focus",
        description: "Ambient and lo-fi beats to keep your head in the zone.",
        color: "#a855f7", // Purple
    },
    {
        id: "hc5",
        type: HOME_CONTENT_TYPES.OTHER,
        name: "Morning Energy",
        description: "Uptempo tracks to kickstart your daily routine.",
        color: "#eab308", // Yellow
    },
    {
        id: "hc6",
        type: HOME_CONTENT_TYPES.OTHER,
        name: "Heavy Rotation",
        description: "Your most-played tracks from the last 30 days.",
        color: "#ec4899", // Pink
    },
    {
        id: "hc7",
        type: HOME_CONTENT_TYPES.OTHER,
        name: "New Discoveries",
        description: "Fresh releases tailored to your specific taste profile.",
        color: "#14b8a6", // Teal
    },
    {
        id: "hc8",
        type: HOME_CONTENT_TYPES.OTHER,
        name: "Chill Classics",
        description: "Timeless records that set a relaxed mood.",
        color: "#f97316", // Orange
    },
    {
        id: "hc9",
        type: HOME_CONTENT_TYPES.OTHER,
        name: "Late Night Melodies",
        description: "Soft acoustics and midnight jazz for the wind-down.",
        color: "#6366f1", // Indigo
    },
    {
        id: "hc10",
        type: HOME_CONTENT_TYPES.OTHER,
        name: "Gym Motivation",
        description: "High-BPM anthems to push your limits.",
        color: "#475569", // Slate
    },
    {
        id: "hc11",
        type: HOME_CONTENT_TYPES.OTHER,
        name: "On The Road",
        description: "The perfect companion for long drives and open highways.",
        color: "#84cc16", // Lime
    },
    {
        id: "hc12",
        type: HOME_CONTENT_TYPES.OTHER,
        name: "Hidden Gems",
        description: "Under-the-radar tracks you might have missed.",
        color: "#06b6d4", // Cyan
    },
];