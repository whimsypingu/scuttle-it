import { motion } from 'framer-motion';

import { TrackItem } from '@/model/TrackItem';

import type { PlaylistListProps } from '@/features/playlist/playlist.types';
import type { TrackBase } from '@/model/model.types';


export const PlaylistList = ({
    tracks = []
}: PlaylistListProps) => {

    const handleTrackSelect = (track: TrackBase) => {
        console.log("Selected track:", track.title);
    }

    return (
        <>
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
            className="flex flex-col gap-1 w-full"
        >
            {/* TRACK LIST */}
            {tracks.map((track, i) => (
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
        </>
    );
};