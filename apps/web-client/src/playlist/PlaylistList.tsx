import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Virtuoso } from 'react-virtuoso';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { PointerSensor, PointerActivationConstraints } from '@dnd-kit/dom';

import { usePlaylistsMutations } from '@/store/hooks/usePlaylists';

import { TrackItem } from '@/track/TrackItem';
import { DnDable } from '@/components/function/dndable';

import { isPlaylistReorderable } from '@/playlist/playlist.utils';

import type { DragStartEvent, DragMoveEvent, DragEndEvent } from '@dnd-kit/dom';
import type { PlaylistListProps } from '@/playlist/playlist.types';
import type { TrackBase } from '@/track/track.types';


export const PlaylistList = ({
    scrollContext,
    bottomSpacing = 0,
    actions = ["queueNext", "queueLast", "like", "edit"],
    emptyText = "No Tracks",
    emptySubtext = "Add some tracks!"
}: PlaylistListProps) => {
    const {
        tracks,
        playlistId,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        sortmode,
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

    //reordering logic
    const allowReorder = isPlaylistReorderable(playlistId, sortmode); //prevent reordering

    const [sourceTrack, setSourceTrack] = useState<TrackBase | null>(null); //reorder state variables
    const [targetTrack, setTargetTrack] = useState<TrackBase | null>(null);
    const [dropBelow, setDropBelow] = useState<boolean>(true); //whether to drop below the target element or not

    const { reorderPlaylist } = usePlaylistsMutations();

    //dnd-kit dragdropprovider uses these
    function handleDragStart(event: DragStartEvent) {
        if (!allowReorder) return;

        const src = tracks.find(t => t?.id === event.operation.source?.id); //find and set the dragged track
        if (src) {
            setSourceTrack(src);
            setDropBelow(true);
        }
    }
    function handleDragMove(event: DragMoveEvent) {
        if (!allowReorder || !sourceTrack) return;

        if (!event.operation.target) {
            setTargetTrack(null);
        }

        const tgt = tracks.find(t => t.id === event.operation.target?.id); //find the track being dragged on top of
        if (tgt) {
            setTargetTrack(tgt);
        }

        //handle the intermediate cutoff for whether to send below or not
        const rect = event.operation.target?.element?.getBoundingClientRect();
        if (!rect) return; //possibly unhandled failure case

        const midpointY = rect.top + (rect?.height / 2);
        const cursorY = event.operation.position.current.y;

        if (cursorY < midpointY) {
            setDropBelow(false);
        } else {
            setDropBelow(true);
        } 
    }
    function handleDragEnd(event: DragEndEvent) {
        if (!allowReorder) return;

        if (sourceTrack && targetTrack) {
            reorderPlaylist({
                playlistId,
                sourceId: sourceTrack.id,
                targetId: targetTrack.id,
                below: dropBelow,
            });
        }
        setSourceTrack(null); //clear state variables
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
                        const isCurrentTarget = allowReorder && targetTrack?.id === track.id;

                        //apply this to the outer div
                        const borderStyle: React.CSSProperties = {
                            marginTop: index === 0 ? "0px" : "-3px", //pull elements up by border size to share the borders with neighbors and prevent jumping lines
                            borderTop: isCurrentTarget && !dropBelow ? "3px solid var(--color-brand)" : "3px solid transparent",
                            borderBottom: isCurrentTarget && dropBelow ? "3px solid var(--color-brand)" : "3px solid transparent",
                            boxSizing: "border-box",
                        };

                        //apply this to the inner div so opacity doesn't affect the border
                        const opacityStyle: React.CSSProperties = {
                            opacity: allowReorder && sourceTrack?.id === track.id ? 0.2 : 1,
                            transition: "opacity 0.15s ease-out",
                        };
                        
                        return (
                            <DnDable id={track.id} allow={allowReorder}>
                                <motion.div
                                    key={track.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: Math.min(index * 0.1, 0.1) //not perfect but it has a nice effect initially
                                    }}
                                    style={borderStyle}
                                >
                                    <div style={opacityStyle}>
                                        <TrackItem
                                            track={track}
                                            onSelect={handleTrackSelect}
                                            index={index}
                                            actions={actions}
                                        />
                                    </div>
                                </motion.div>
                            </DnDable>
                        );
                    }}
                />

                <DragOverlay dropAnimation={null}>
                    {sourceTrack ? (
                        <div style={{ 
                            transform: "scale(0.6)", // larger makes it look lifted?
                            boxShadow: "0px 10px 20px rgba(0,0,0,0.15)",
                            cursor: "grabbing",
                            transition: "transform 0.1s ease",
                        }}>
                            {/* PURE VISUAL COPY */}
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
