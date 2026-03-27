import { useMemo } from 'react';
import { motion } from 'framer-motion';

import { TrackItem } from '@/features/track/TrackItem';

import type { Track } from '@/features/track/track.types';


export const QueueView = () => {

    const MOCK_TRACKS = useMemo(() => {
        return [...Array(20)].map((_, i) => ({
            id: `track-${i}`,
            title: `Queue Track ${i+1}`,
            artist: "Unknown Artist",
        }));
    }, []);

    const handleTrackSelect = (track: Track) => {
        console.log("Selected track:", track.title);
    }

    return (
        <motion.div
            key="playlist-content"
            initial="hidden"
            animate="show"
            exit="hidden"
            variants={{
                show: {
                    transition: {
                        staggerChildren: 0.05
                    }
                }
            }}
            className="flex flex-col gap-1 w-full py-2"
            onDragStartCapture={(e) => e.stopPropagation()}
            onDragCapture={(e) => e.stopPropagation()}
        >
            {/* TRACK LIST */}
            {MOCK_TRACKS.map((track, i) => (
                <>
                <motion.div
                    key={track.id}
                    variants={{
                        hidden: { opacity: 0, y: 15 },
                        show: { opacity: 1, y: 0, transition: { type: "spring", damping: 20 } }
                    }}
                >
                    <TrackItem 
                        track={track}
                        onSelect={(track) => handleTrackSelect(track)}
                        index={i}
                    />
                </motion.div>
                </>
            ))}
        </motion.div>
    );
};