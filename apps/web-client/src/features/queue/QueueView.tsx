import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Virtuoso } from 'react-virtuoso';

import { TrackItem } from '@/model/TrackItem';

import type { TrackBase } from '@/model/model.types';


export const QueueView = () => {

    const MOCK_TRACKS: TrackBase[] = useMemo(() => {
        return [...Array(1000)].map((_, i) => ({
            id: `track-${i}`,
            title: `Queue Track ${i+1}`,
            artists: [{
                id: `artist-${i}`,
                name: `Artist ${i+1}`
            }],
            duration: 20
        }));
    }, []);

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
            
                data={MOCK_TRACKS}
                overscan={10}
                itemContent={(index, track) => (

                    <TrackItem 
                        track={track}
                        onSelect={handleTrackSelect}
                        index={index}
                    />
                )}
            
            />
        </motion.div>
    );
};