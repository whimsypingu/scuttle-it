import { delay, motion, setTarget } from 'framer-motion';

import { TrackItem } from '@/track/TrackItem';

import type { PlaylistListProps } from '@/playlist/playlist.types';
import type { TrackBase } from '@/track/track.types';
import { Virtuoso } from 'react-virtuoso';
import { DnDable, Draggable } from '@/components/function/draggable';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { PointerSensor, PointerActivationConstraints, type DragStartEvent, type DragEndEvent, type DragMoveEvent, type DragOverEvent, Droppable } from '@dnd-kit/dom';
import { useState } from 'react';
import { Sortable } from '@/components/function/sortable';


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


    const [sourceTrack, setSourceTrack] = useState<TrackBase | null>(null);
    const [targetTrack, setTargetTrack] = useState<TrackBase | null>(null);
    const [dropBelow, setDropBelow] = useState<boolean>(true);
    function handleDragStart(event: DragStartEvent) {
        console.log("dragstart");
        const src = tracks.find(t => t?.id === event.operation.source?.id);
        if (src) {
            console.log("selected");
            setSourceTrack(src);
            setDropBelow(true);
        }
    }
    function handleDragMove(event: DragMoveEvent) {
        if (!sourceTrack) return;
        console.log("dragmove");
        const {operation} = event;

        if (!operation.target) {
            setTargetTrack(null);
        }

        const tgt = tracks.find(t => t.id === event.operation.target?.id);
        if (tgt) {
            setTargetTrack(tgt);
        }

        const rect = operation.target?.element?.getBoundingClientRect();
        if (!rect) return;
        const midpointY = rect.top + (rect?.height / 2);
        const cursorY = operation.position.current.y;
        console.log(midpointY, cursorY);
        if (cursorY < midpointY) {
            setDropBelow(false);
            console.log("above");
        } else {
            setDropBelow(true);
            console.log("below");
        } 
    }
    function handleDragEnd(event: DragEndEvent) {
        if (targetTrack) {
            console.log("reorder");
            console.log(targetTrack.title, dropBelow);
        }
        console.log("dragend")
        setSourceTrack(null);
        setTargetTrack(null);
    }

    return (
        <motion.div
            key="virtualized-playlist-content"
            className="min-h-0 w-full h-full"
        >
            <DragDropProvider
                sensors={(defaults) => [
                    PointerSensor.configure({
                        activationConstraints: [
                            new PointerActivationConstraints.Delay({value: 400, tolerance: 5})
                        ]
                    }),
                ]}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
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
                    return (
                        <DnDable id={track.id}> 
                            <motion.div
                                key={track.id}
                                initial={{ opacity: 0 }}
                                animate={{ 
                                    opacity: 1,
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
                        </DnDable>
                    );
                }}
            />

            <DragOverlay>
                {sourceTrack ? (
                    <div style={{ 
                        transform: "scale(1.03)", // Optional: make it look slightly lifted
                        boxShadow: "0px 10px 20px rgba(0,0,0,0.15)",
                        cursor: "grabbing",
                        transition: "transform 0.1s ease",
                    }}>
                        {/* Render a pure visual copy of your track item here */}
                        <TrackItem track={sourceTrack} onSelect={() => {}} index={-1} />
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
