import { motion } from 'framer-motion';

import { TrackItem } from '@/features/track/TrackItem';

import type { PlaylistDetailViewProps } from '@/features/playlist/playlist.types';


export const PlaylistDetailView = ({
    playlist
}: PlaylistDetailViewProps) => {
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
            {[...Array(20)].map((_, i) => (
                <>
                <motion.div
                    key={`track-${i}`}
                    variants={{
                        hidden: { opacity: 0, y: 15 },
                        show: { opacity: 1, y: 0, transition: { type: "spring", damping: 20 } }
                    }}
                >
                    <TrackItem 
                        track={{
                            id: `track-${i}`,
                            title: `Archived Track ${i + 1}`,
                            artist: "Unknown Artist",
                        }}
                        index={i}
                    />
                </motion.div>
                </>
            ))}
        </motion.div>
        </>
    );
};