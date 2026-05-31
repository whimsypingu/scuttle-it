import { motion } from 'framer-motion';

import { TrackItem } from '@/track/TrackItem';

import type { PlaylistListProps } from '@/playlist/playlist.types';
import type { TrackBase } from '@/track/track.types';
import { Virtuoso } from 'react-virtuoso';
import { useRef, useState } from 'react';


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

    //native dnd
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const timerRef = useRef<number | null>(null);
    const scrollerRef = useRef<HTMLElement | null>(null);

    const handlePointerDown = (e: React.PointerEvent, index: number) => {
        timerRef.current = window.setTimeout(() => {
            setDraggedIndex(index);
            setHoveredIndex(index);

            console.log("timer triggered and set drag and hover for index", index);

            if (e.target && "releasePointerCapture" in e.target) {
                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            }
        }, 400);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (draggedIndex === null) return;

        const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
        const itemRow = elementUnderCursor?.closest("[data-item-index]");
        console.log("move event");

        if (itemRow) {
            const targetIdx = parseInt(itemRow.getAttribute("data-item-index") || "", 10);
            console.log(targetIdx);
            if (!isNaN(targetIdx) && targetIdx !== hoveredIndex) {
                setHoveredIndex(targetIdx);
            }
        }
    };

    const handlePointerUp = () => {
        console.log("pointer up event");
        if (timerRef.current) clearTimeout(timerRef.current);

        if (draggedIndex !== null && hoveredIndex !== null && draggedIndex !== hoveredIndex) {
            //
            console.log("success?", draggedIndex, hoveredIndex);
        }

        setDraggedIndex(null);
        setHoveredIndex(null);
    };

    return (
        <motion.div
            key="virtualized-playlist-content"
            className="min-h-0 w-full h-full"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
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
                    const isBeingDragged = index === draggedIndex;
                    const isHoverTarget = index === hoveredIndex && draggedIndex !== null;

                    return (
                        <motion.div
                            key={track.id}
                            initial={{ opacity: 0 }}
                            animate={{ 
                                opacity: isBeingDragged ? 0.4 : 1,
                                scale: isBeingDragged ? 0.98 : 1,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 0.3,
                                delay: Math.min(index * 0.1, 0.1) //not perfect but it has a nice effect initially
                            }}
                            onPointerDown={(e) => handlePointerDown(e, index)}
                            style={{
                                pointerEvents: isBeingDragged ? "none" : "auto",
                            }}
                        >
                            <TrackItem
                                track={track}
                                onSelect={handleTrackSelect}
                                index={index}
                                actions={actions}
                            />  
                        </motion.div>
                    );
                }}
            />
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
