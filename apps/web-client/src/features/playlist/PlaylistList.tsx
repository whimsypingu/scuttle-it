import { motion } from 'framer-motion';

import { TrackItem } from '@/model/TrackItem';

import type { PlaylistListProps } from '@/features/playlist/playlist.types';
import type { TrackBase } from '@/model/model.types';
import { Virtuoso } from 'react-virtuoso';
import { useEffect, useRef } from 'react';


export const PlaylistList = ({
    scrollContext,
    bottomSpacing = 0,
    actions = ["queueNext", "queueLast", "like", "edit"]
}: PlaylistListProps) => {
    const {
        tracks,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = scrollContext;

    const handleTrackSelect = (track: TrackBase) => {
        console.log("Selected track:", track.title);
    }

    return (
        <motion.div
            key="virtualized-playlist-content"
            className="min-h-0 w-full h-full"
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
                itemContent={(index, track) => (
                    <motion.div
                        key={track.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.3,
                            delay: Math.min(index * 0.1, 0.1) //not perfect but it has a nice effect initially
                        }}
                    >
                        <TrackItem
                            track={track}
                            onSelect={handleTrackSelect}
                            index={index}
                            actions={actions}
                        />  
                    </motion.div>
                )}
            />
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
