import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { BOTTOM_SHELF, NAV_CONFIG } from "@/features/player/player.constants";

import { HOME_CONTENTS } from "@/features/home/home.constants";

import type { HomeContent, HomeTabProps } from "@/features/home/home.types";
import type { SummaryPlaylist } from "@/playlist/playlist.types";
import { PlaylistItem } from "@/playlist/PlaylistItem";
import { usePins } from "@/store/hooks/usePlaylists";
import { PlaylistContentView } from "../library/subcomponents/PlaylistContent";


export const HomeTab = ({
    tabResetSignal
}: HomeTabProps) => {
    const [selectedHomeContent, setSelectedHomeContent] = useState<HomeContent | null>(null);

    const { playlists } = usePins();

    // Reset when the signal changes
    useEffect(() => {
        if (tabResetSignal > 0) {
            setSelectedHomeContent(null);
            // If you had a scrollRef, you'd trigger it here too:
            // scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [tabResetSignal]);


    const renderActiveContent = () => {
        if (!selectedHomeContent) return null;

        const { type, data } = selectedHomeContent;

        let ActiveHomeContentView = null;
        switch (type) {
            case ("systemPlaylist"):
                ActiveHomeContentView = data.component;
                return (
                    <ActiveHomeContentView
                        data={data}
                        onClose={() => setSelectedHomeContent(null)}
                    />
                );
            case ("customPlaylist"):
                ActiveHomeContentView = PlaylistContentView;
                return (
                    <ActiveHomeContentView
                        summaryData={data}
                        onClose={() => setSelectedHomeContent(null)}
                    />
                );
            default:
                console.error("Unimplemented ActiveHomeContentView");
                return null;
        }

        return (
            <ActiveHomeContentView
                data={data}
                onClose={() => setSelectedHomeContent(null)}
            />
        );
    }

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
                                className="flex flex-col gap-4" 
                                style={{ marginBottom: `${BOTTOM_SHELF.totalHeight}px` }}
                            >

                                {/* DEFAULT CONTENTS */}
                                <div className="grid grid-cols-2 gap-4">
                                    {HOME_CONTENTS
                                        .slice(0, 2)
                                        .map((item, index) => (
                                            <div 
                                                key={index} 
                                                className="bg-card aspect-square rounded-md shadow-lg p-4 flex flex-col cursor-pointer active:scale-95 transition-transform"
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

                                {playlists.length >= 1 && (
                                    <div 
                                        className="flex flex-col gap-1"
                                    >
                                        {/* PINNED PLAYLIST LIST */}
                                        {playlists.map((p) => (
                                            <PlaylistItem
                                                key={p.id}
                                                playlist={p}
                                                onSelect={(p) => {
                                                    setSelectedHomeContent({
                                                        type: "customPlaylist",
                                                        name: p.name,
                                                        color: "#ffffff",
                                                        description: "",
                                                        data: p,
                                                    });
                                                }}
                                                actions={["shufflePlay", "play", "unpin", "edit"]}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* DEFAULT CONTENTS */}
                                <div className="grid grid-cols-2 gap-4">
                                    {HOME_CONTENTS
                                        .slice(2)
                                        .map((item, index) => (
                                            <div 
                                                key={index} 
                                                className="bg-card aspect-square rounded-md shadow-lg p-4 flex flex-col cursor-pointer active:scale-95 transition-transform"
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
                        </div>
                    </motion.div>
                    </>
                ) : (
                    <>
                    {renderActiveContent()}
                    </>
                )}
            </AnimatePresence>
        </div>
        </>
    );
};




const MOCK_PLAYLIST_SUMMARY: SummaryPlaylist = {
    id: "hello-world",
    name: "mock playlist",
    totalCount: 20,
    totalDuration: 3000,
    description: "mocking a playlist",
}