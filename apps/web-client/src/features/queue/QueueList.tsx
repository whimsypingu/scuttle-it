import { motion } from 'framer-motion';
import { Virtuoso } from 'react-virtuoso';

import { useMemo } from 'react';
import { useQueue } from '@/store/hooks/useQueue';
import { useSettings } from '@/store/hooks/useSettings';

import { TrackItem } from '@/model/TrackItem';

import type { TrackBase } from '@/model/model.types';


export const QueueList = () => {

    const { queue, pop, isLoading } = useQueue();
    const { settings } = useSettings();

    const currentQueue = queue?.slice(1) ?? [];
    const loopmode = settings?.loopmode;

    //generate the dynamic text content to show when the queue is empty
    const EmptyQueueContent = useMemo(() => {
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
            <div className="flex flex-col gap-1 items-center justify-center px-2 py-4 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                    {headline}
                </p>
                
                <p className="text-xs text-muted-foreground/60">
                    {subtext}
                </p>
            </div>
        );
    }, [loopmode]);

    //handle a track pick
    const handleTrackSelect = (track: TrackBase) => {
        console.log("Selected track:", track.title);
    }

    return (
        <motion.div
            key="queue-content"
            className="flex flex-col gap-1 w-full h-full pt-2"
            onDragStartCapture={(e) => e.stopPropagation()}
            onDragCapture={(e) => e.stopPropagation()}
        >
            {currentQueue.length === 0 ? (
                EmptyQueueContent
            ) : (
                <Virtuoso 
                    data={currentQueue}
                    overscan={10}
                    itemContent={(index, track) => (
                        <TrackItem 
                            key={track.queueId}
                            track={track}
                            onSelect={handleTrackSelect}
                            index={index}
                            actions={["queueNext", "queueLast", "deleteQueue", "edit"]}
                        />
                    )}
                />
            )}
        </motion.div>
    );
};