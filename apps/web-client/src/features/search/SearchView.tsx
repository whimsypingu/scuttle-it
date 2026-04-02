import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

import { PlaylistList } from "@/features/playlist/PlaylistList";

import { BOTTOM_SHELF, NAV_CONFIG } from "@/features/player/player.constants";

import { SearchAPI } from "@/features/search/search.api";
import type { SearchViewProps } from "@/features/search/search.types";
import type { TrackBase } from "@/model/model.types";
import { useAddTracks } from "@/store/useLibraryStore";


export const MockSearch = ({
    tabResetSignal
}: SearchViewProps) => {
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<TrackBase[]>([]);

    // debounce effect on search input
    const [debouncedQuery, setDebouncedQuery] = useState("");
    useEffect(() => {
        if (!query.trim()) {
            setDebouncedQuery("");
            return;
        }

        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500); //ms delay to set the debounced query value

        // cancel the timer if the user types again within the delay
        return () => {
            clearTimeout(handler);
        };
    }, [query]);
    const addTracks = useAddTracks(); //zustand hook
    useEffect(() => {
        if (!debouncedQuery) return;

        const controller = new AbortController();

        SearchAPI.searchDatabase(debouncedQuery, controller.signal)
            .then((results: TrackBase[]) => {
                addTracks(results); // store
                setSearchResults(results); // show
            })
            .catch(err => {
                console.error(`SearchAPI.searchDatabase error: ${err}`);
            });

        return () => controller.abort();
    }, [debouncedQuery]);

    // for checking where the user taps to close the search results
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Reset when the signal changes
    useEffect(() => {
        if (tabResetSignal > 0) {
            setIsSearching(false);
            // If you had a scrollRef, you'd trigger it here too:
            // scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [tabResetSignal]);

    return (
        <>
        <motion.div 
            className="w-full h-full flex flex-col px-4 overflow-hidden touch-none"
            style={{ paddingBottom: `${NAV_CONFIG.height}px` }}
        >
            {/* HEADER */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md py-4">
                <div 
                    className="flex items-center justify-between mb-2"
                    onPointerDown={(e) => {
                        if (isSearching) {
                            e.stopPropagation();
                            inputRef.current?.blur();
                            setIsSearching(false);
                        }
                    }}
                >
                    <h1 className="tab-heading truncate pr-4">
                        Search
                    </h1>

                    {isSearching && (
                        <>
                        <button className="text-sm font-medium text-white/40 active:text-white shrink-0">
                            <XIcon size={20} weight="bold" />
                        </button>
                        </>
                    )}
                </div>
                
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

            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {!isSearching ? (
                        <>
                        <motion.div
                            key="search-root"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full flex flex-col"
                        >
                            {/* CONTENT AREA */}
                            <div className="flex-1 overflow-y-auto no-scrollbar">
                                <div 
                                    className="flex flex-col gap-1"
                                    style={{ marginBottom: `${BOTTOM_SHELF.totalHeight}px` }}
                                >
                                    <MockBrowserCategories />
                                </div>
                            </div>
                        </motion.div>
                        </>
                    ) : (
                        <>
                        <motion.div
                            key="search-results"
                            ref={resultsRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full flex flex-col"
                        >
                            {/* CONTENT AREA */}
                            <div 
                                className="flex-1 overflow-y-auto no-scrollbar"
                                onPointerDown={(e) => {
                                    inputRef.current?.blur();

                                    //does not close the search results if touching the results div
                                    if (resultsRef.current?.contains(e.target as Node)) {
                                        return;
                                    }
                                    setIsSearching(false);
                                }}                            
                            >
                                <div 
                                    className="flex flex-col gap-0"
                                    style={{ marginBottom: `${BOTTOM_SHELF.totalHeight}px` }}
                                >
                                    <PlaylistList
                                        tracks={searchResults}
                                    />
                                </div>
                            </div>
                        </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

        </motion.div>
        </>
    );
};

const MOCK_SEARCH_PLAYLIST = { id: "s1", name: "Search Playlist", trackCount: 42, color: "#581c87" };

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
        <div className="flex flex-col gap-4 mt-2">
            <h2 className="text-lg font-medium">
                Browse all
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
                {GENRES.map((genre) => (
                    <div 
                        key={genre.name} 
                        className="relative h-28 rounded-lg p-4 overflow-hidden cursor-pointer active:scale-95 transition-transform"
                        style={{ backgroundColor: genre.color }}
                    >
                        <span className="text-lg font-medium tracking-tight">{genre.name}</span>
                        {/* Mock Album Art "peeking" out of the corner */}
                        <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-black/20 rotate-[25deg] shadow-2xl rounded-sm transform group-hover:scale-110 transition-transform" />
                    </div>
                ))}
            </div>
        </div>
        </>
    );
};