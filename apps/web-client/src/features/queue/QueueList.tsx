import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Virtuoso } from 'react-virtuoso';
import { useQueue } from '@/store/hooks/useQueue';

import { TrackItem } from '@/model/TrackItem';

import type { QueueTrack, TrackBase } from '@/model/model.types';


export const QueueList = () => {

    const { queue, pop, isLoading } = useQueue();

    const currentQueue = queue?.slice(1) ?? [];
    console.log(currentQueue);


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
        </motion.div>
    );
};