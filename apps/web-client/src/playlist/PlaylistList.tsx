import { motion } from 'framer-motion';

import { TrackItem } from '@/track/TrackItem';

import type { PlaylistListProps } from '@/playlist/playlist.types';
import type { TrackBase } from '@/track/track.types';
import { Virtuoso } from 'react-virtuoso';
import { Draggable } from '@/components/function/draggable';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { useState } from 'react';


export const PlaylistList = ({
    scrollContext,
    bottomSpacing = 0,
    actions = ["queueNext", "queueLast", "like", "edit"],
    emptyText = "No Tracks",
    emptySubtext = "Add some tracks!"
}: PlaylistListProps) => {
    const {
        tracks,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = scrollContext;

    //loading state
    if (isLoading) {
        return (
            <div className="min-h-0 w-full h-full">
                <div className="items-center justify-center px-4 py-16 text-center">
                    <div className="flex gap-1.5 items-center justify-center h-6">
                        {[0, 1, 2].map((index) => ( //3 bouncing dots, to test this f12 and networks tab and throttle the network to 3g
                            <motion.div
                                key={index}
                                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
                                initial={{ opacity: 0 }}
                                animate={{ 
                                    y: [0, -6, 0],
                                    opacity: [0.4, 1, 0.4] 
                                }}
                                transition={{
                                    duration: 0.8,
                                    repeat: Infinity,
                                    repeatDelay: 0.5,
                                    delay: index * 0.15,
                                    ease: "easeInOut",
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    //nothing to show
    if (tracks.length === 0) {
        return (
            <div className="min-h-0 w-full h-full">                
                <div className="flex flex-col gap-1 items-center justify-center px-4 py-16 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                        {emptyText}
                    </p>
                    
                    <p className="text-xs text-muted-foreground/60">
                        {emptySubtext}
                    </p>
                </div>
            </div>
        );
    }

    //temp debugging logic
    const handleTrackSelect = (track: TrackBase) => {
        console.log("Selected track:", track.title);
    }


    const [activeTrack, setActiveTrack] = useState<any>(null);
    function handleDragStart(event: any) {
        const track = tracks.find(t => t?.id === event.operation.source.id);
        if (track) {
            setActiveTrack(track);
        }
    }
    function handleDragEnd(event: any) {
        const {operation, over} = event;
        if (over && operation.source.id !== over.id) {
            console.log("reorder");
        }
        setActiveTrack(null);
    }

    return (
        <motion.div
            key="virtualized-playlist-content"
            className="min-h-0 w-full h-full"
        >
            <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <Virtuoso
                data={tracks}
                overscan={10}
                endReached={() => {
                    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                }}
                components={{
                    Footer: () => (
                        <div 
                            style={{ height: `${bottomSpacing}px` }} 
                            className="flex justify-center pt-4"
                        >
                            {isFetchingNextPage && <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent" />}
                        </div>
                    )
                }}
                computeItemKey={(index, track) => track.id} //https://virtuoso.dev/message-list/item-keys/ this helped
                itemContent={(index, track) => {
                    return (
                        <Draggable id={track.id}>
                            <motion.div
                                key={track.id}
                                initial={{ opacity: 0 }}
                                animate={{ 
                                    opacity: track.id === activeTrack?.id ? 0.4 : 1,
                                }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    duration: 0.3,
                                    delay: Math.min(index * 0.1, 0.1) //not perfect but it has a nice effect initially
                                }}
                            >
                                <TrackItem
                                    track={track}
                                    onSelect={handleTrackSelect}
                                    index={index}
                                    actions={actions}
                                />  
                            </motion.div>
                        </Draggable>
                    );
                }}
            />

            <DragOverlay>
                {activeTrack ? (
                    <div style={{ 
                        transform: "scale(1.03)", // Optional: make it look slightly lifted
                        boxShadow: "0px 10px 20px rgba(0,0,0,0.15)",
                        cursor: "grabbing",
                        transition: "transform 0.1s ease",
                    }}>
                        {/* Render a pure visual copy of your track item here */}
                        <TrackItem track={activeTrack} onSelect={() => {}} index={-1} />
                    </div>
                ) : null}
            </DragOverlay>
            </DragDropProvider>
        </motion.div>
    );
};

// const MOCK_TRACK_LIST_200: TrackBase[] = Array.from({ length: 200 }, (_, i) => ({
//     id: `mock-id-${i}`,
//     title: `Mock Track #${i + 1}`,
//     artists: [
//         { id: "mock-artist-id-0", name: "Mock Artist"}
//     ],
//     duration: 1,
// }));
