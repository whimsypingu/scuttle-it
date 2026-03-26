import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";

import { TrackItem } from "@/features/track/TrackItem";

import { BOTTOM_SHELF, NAV_CONFIG } from "@/features/player/player.constants";


export const MockSearch = () => {
    const [isSearching, setIsSearching] = useState(false);
    const [query, setQuery] = useState("");

    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    return (
        <>
        <div 
            className="w-full h-full flex flex-col px-4 overflow-hidden touch-none"
            style={{ paddingBottom: `${NAV_CONFIG.height}px` }}
            onPointerDown={(e) => {
                inputRef.current?.blur();

                //does not close the search results if touching the results div
                if (resultsRef.current?.contains(e.target as Node)) {
                    return;
                }
                setIsSearching(false);
            }}
        >
            {/* HEADER */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md py-4">
                <h1 className="text-2xl font-light mb-4">Search</h1>
                
                {/* SEARCH BAR */}
                <InputGroup>
                    <InputGroupInput
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsSearching(true)}
                        placeholder="What do you want to listen to?"
                    />
                    <InputGroupAddon align="inline-end">
                        <MagnifyingGlassIcon size={20} weight="bold" />
                    </InputGroupAddon>
                </InputGroup>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <AnimatePresence mode="wait">
                    {isSearching ? (
                        <>
                        <motion.div 
                            ref={resultsRef}
                            key="search-results"
                            initial="hidden"
                            animate="show"
                            exit="hidden"
                            variants={{
                                show: {
                                    transition: { staggerChildren: 0.05 } // Results pop in one by one
                                }
                            }}
                            // className="flex flex-col gap-1 pt-2 pb-20"
                            className="flex flex-col gap-1 pt-2"
                            style={{ marginBottom: `${BOTTOM_SHELF.totalHeight}px` }}
                        >
                            {/* BOGUS RESULTS ARRAY */}
                            {[...Array(10)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    variants={{
                                        hidden: { opacity: 0, y: 10 },
                                        show: { opacity: 1, y: 0 }
                                    }}
                                >
                                    <TrackItem 
                                        track={{
                                            id: `search-${i}`,
                                            title: `Result Track ${i + 1}`,
                                            artist: "Search Artist",
                                        }}
                                        index={i}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                        </>

                    ) : (
                        <MockBrowserCategories />
                    )}
                </AnimatePresence>
            </div>
        </div>
        </>
    );
};



const GENRES = [
    { name: 'Podcasts', color: '#E13300' },
    { name: 'Made For You', color: '#1E3264' },
    { name: 'Charts', color: '#8D67AB' },
    { name: 'New Releases', color: '#E8115B' },
    { name: 'Discover', color: '#8D67AB' },
    { name: 'Live Events', color: '#7358FF' },
    { name: 'Pop', color: '#148A08' },
    { name: 'Hip-Hop', color: '#BC5900' },
];

const MockBrowserCategories = () => {
    return (
        <>
        {/* Browse Categories */}
        <motion.div 
            key="browse-categories"
            initial={{ opacity: 0, scale: 0.98 }}    
            animate={{ opacity: 1, scale: 1 }}    
            exit={{ opacity: 0, scale: 0.98 }}    
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4 mt-6"
            style={{ marginBottom: `${BOTTOM_SHELF.totalHeight}px` }}
        >
            <h2 className="text-lg font-light">Browse all</h2>
            <div className="grid grid-cols-2 gap-3">
                {GENRES.map((genre) => (
                    <div 
                        key={genre.name} 
                        className="relative h-28 rounded-lg p-4 overflow-hidden cursor-pointer active:scale-95 transition-transform"
                        style={{ backgroundColor: genre.color }}
                    >
                        <span className="text-lg font-light tracking-tight">{genre.name}</span>
                        {/* Mock Album Art "peeking" out of the corner */}
                        <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-black/20 rotate-[25deg] shadow-2xl rounded-sm transform group-hover:scale-110 transition-transform" />
                    </div>
                ))}
            </div>
        </motion.div>
        </>
    );
};