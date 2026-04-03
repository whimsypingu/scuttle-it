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

    // const MOCK_TRACKS = useMemo(() => {
    //     return Array.from({ length: 100000 }, (_, index) => ({
    //         name: `User ${index}`,
    //         size: Math.floor(Math.random() * 40) + 70,
    //         description: `Description for user ${index}`,
    //     }))
    // }, [])

    const handleTrackSelect = (track: TrackBase) => {
        console.log("Selected track:", track.title);
    }

    return (
        <motion.div
            key="playlist-content"
            // initial="hidden"
            // animate="show"
            // exit="hidden"
            // variants={{
            //     show: {
            //         transition: {
            //             staggerChildren: 0.05
            //         }
            //     }
            // }}
            className="flex flex-col gap-1 w-full h-full py-2"
            onDragStartCapture={(e) => e.stopPropagation()}
            onDragCapture={(e) => e.stopPropagation()}
        >
            <Virtuoso 
            
                data={MOCK_TRACKS}
                overscan={10}
                itemContent={(index, track) => (

                    // <div
                    //     style={{
                    //         padding: '0.5rem',
                    //         height: `${track.size}px`,
                    //         borderBottom: `1px solid var(--border)`,
                    //     }}
                    // >
                    //     <p><strong>{track.name}</strong></p>
                    //     <div>{track.description}</div>
                    // </div>

                    // <motion.div
                    //     key={track.id}
                    //     initial={{ opacity: 0 }}
                    //     animate={{ opacity: 1 }}
                    // >
                        <TrackItem 
                            track={track}
                            onSelect={handleTrackSelect}
                            index={index}
                        />
                    // </motion.div>
                )}
            
            />


            {/* TRACK LIST */}
            {/* {MOCK_TRACKS.map((track, i) => (
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
            ))} */}
        </motion.div>
    );
};