import { motion } from 'framer-motion';

import { TrackItem } from '@/model/TrackItem';

import type { PlaylistListProps } from '@/features/playlist/playlist.types';
import type { TrackBase } from '@/model/model.types';
import { Virtuoso } from 'react-virtuoso';


export const PlaylistList = ({
    tracks = [],
    bottomSpacing = 0
}: PlaylistListProps) => {

    const handleTrackSelect = (track: TrackBase) => {
        console.log("Selected track:", track.title);
    }

    return (
        <motion.div
            key="playlist-content"
            className="flex flex-col min-h-0 gap-1 w-full h-full pt-2"
        >
            <Virtuoso
                style={{ height: "100%" }}
                data={MOCK_TRACK_LIST_200}
                components={{
                    Footer: () => <div style={{ height: `${bottomSpacing}px` }} />
                }}
                overscan={10}
                // endReached={() => {
                //     if (hasNextPage)
                // }}
                itemContent={(index, track) => (
                    <motion.div
                        key={track.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            duration: 0.2,
                            delay: Math.min(index * 0.02, 0.1)
                        }}
                    >
                        <TrackItem
                            key={track.id}
                            track={track}
                            onSelect={handleTrackSelect}
                            index={index}
                            actions={["like", "queueLast", "delete", "delete"]}
                        />  
                    </motion.div>
                )}
            />
        </motion.div>
    );
};

const MOCK_TRACK_LIST_200: TrackBase[] = Array.from({ length: 200 }, (_, i) => ({
    id: `mock-id-${i}`,
    title: `Mock Track #${i + 1}`,
    artists: [
        { id: "mock-artist-id-0", name: "Mock Artist"}
    ],
    duration: 1,
}));
