import { motion } from 'framer-motion';
import { Virtuoso } from 'react-virtuoso';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { PointerSensor, PointerActivationConstraints } from '@dnd-kit/dom';

import React, { useState } from 'react';

import { useQueue } from '@/store/hooks/useQueue';
import { useSettings } from '@/store/hooks/useSettings';

import { DnDable } from '@/components/function/dndable';
import { TrackItem } from '@/track/TrackItem';

import type { QueueTrack, TrackBase } from '@/track/track.types';
import type { DragStartEvent, DragMoveEvent, DragEndEvent } from '@dnd-kit/dom';


export const QueueList = () => {

    const { queue, reorder, isLoading } = useQueue();
    const { settings } = useSettings();

    const currentQueue = queue?.slice(1) ?? [];
    const loopmode = settings?.loopmode;

    //generate the dynamic text content to show when the queue is empty
    const EmptyQueueContent = () => {
        const headline = "Your queue is empty";
        let subtext = "";

        switch (loopmode) { //see: apps/web-client/src/settings/settings.types.ts
            case 0: // None
                subtext = "Find a track to keep the music playing.";
                break;
            case 1: // All, but there is only one track because the queue is empty
            case 2: // One 
            default:
                subtext = "The current track will repeat.";
        }

        return (
            <div className="flex flex-col gap-1 items-center justify-center px-2 py-10 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                    {headline}
                </p>
                
                <p className="text-xs text-muted-foreground/60">
                    {subtext}
                </p>
            </div>
        );
    };

    //handle a track pick
    const handleTrackSelect = (track: TrackBase) => {
        console.log("Selected track:", track.title);
    }

    //reordering logic, from apps/web-client/src/playlist/PlaylistList.tsx, except using .queueId field instead of .id for playlists
    const [sourceTrack, setSourceTrack] = useState<QueueTrack | null>(null); //reorder state variables
    const [targetTrack, setTargetTrack] = useState<QueueTrack | null>(null);
    const [dropBelow, setDropBelow] = useState<boolean>(true); //whether to drop below the target element or not

    //dnd-kit dragdropprovider uses these
    function handleDragStart(event: DragStartEvent) {
        console.log("handledragstart");
        const src = currentQueue.find(t => t?.queueId === event.operation.source?.id); //find and set the dragged track
        if (src) {
            setSourceTrack(src);
            setDropBelow(true);
        }
    }
    function handleDragMove(event: DragMoveEvent) {
        if (!sourceTrack) return;

        if (!event.operation.target) {
            setTargetTrack(null);
        }

        const tgt = currentQueue.find(t => t.queueId === event.operation.target?.id); //find the track being dragged on top of
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
        if (sourceTrack && targetTrack) {
            reorder({
                sourceQueueId: sourceTrack.queueId,
                targetQueueId: targetTrack.queueId,
                below: dropBelow,
            });
        }
        setSourceTrack(null); //clear state variables
        setTargetTrack(null);
    }

    return (
        <motion.div
            key="queue-content"
            className="flex flex-col gap-1 w-full h-full pt-2"
            onDragStartCapture={(e) => e.stopPropagation()}
            onDragCapture={(e) => e.stopPropagation()}
        >
            {currentQueue.length === 0 ? (
                <EmptyQueueContent />
            ) : (
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
                        data={currentQueue}
                        overscan={10}
                        computeItemKey={(index, track) => track.queueId} //https://virtuoso.dev/message-list/item-keys/ does this do anything
                        itemContent={(index, track) => {
                            const isCurrentSource = sourceTrack?.queueId === track.queueId;
                            const isCurrentTarget = targetTrack?.queueId === track.queueId;

                            //apply this to the outer div
                            const borderStyle: React.CSSProperties = {
                                marginTop: index === 0 ? "0px" : "-3px", //pull elements up by border size to share the borders with neighbors and prevent jumping lines
                                borderTop: isCurrentTarget && !dropBelow ? "3px solid var(--color-brand)" : "3px solid transparent",
                                borderBottom: isCurrentTarget && dropBelow ? "3px solid var(--color-brand)" : "3px solid transparent",
                                boxSizing: "border-box",
                            };

                            //apply this to the inner div so opacity doesn't affect the border
                            const opacityStyle: React.CSSProperties = {
                                opacity: isCurrentSource ? 0.2 : 1,
                                transition: "opacity 0.15s ease-out",
                            };
                            
                            return (
                                <DnDable id={track.queueId} allow={true}>
                                    <motion.div
                                        key={track.queueId}
                                        style={borderStyle}
                                    >
                                        <div style={opacityStyle}>
                                            <TrackItem 
                                                track={track}
                                                onSelect={handleTrackSelect}
                                                index={index}
                                                actions={["queueNext", "queueLast", "deleteQueue", "edit"]}
                                            />
                                        </div>
                                    </motion.div>
                                </DnDable>
                            );
                        }}
                    />

                    {/* must be null animation to prevent weird rising bottom glitch */}
                    <DragOverlay dropAnimation={null}> 
                        {sourceTrack ? (
                            <div style={{ 
                                transform: "scale(1.03)", // larger makes it look lifted?
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
            )}
        </motion.div>
    );
};