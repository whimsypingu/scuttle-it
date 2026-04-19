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
            // initial={{ opacity: 0 }}
            // animate={{ opacity: 1 }}
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
                    <TrackItem
                        key={track.id}
                        track={track}
                        onSelect={handleTrackSelect}
                        index={index}
                        actions={["like", "queueLast", "delete", "delete"]}
                    />  
                )}
            />
        </motion.div>
    );

    // return (
    //     <>
    //     <motion.div
    //         key="playlist-content"
    //         initial="hidden"
    //         animate="show"
    //         exit="hidden"
    //         variants={{
    //             show: {
    //                 transition: {
    //                     staggerChildren: 0.05
    //                 }
    //             }
    //         }}
    //         className="flex flex-col gap-1 w-full"
    //     >
    //         {/* TRACK LIST */}
    //         {MOCK_TRACK_LIST_400.map((track, i) => (
    //             <>
    //             <motion.div
    //                 key={track.id}
    //                 variants={{
    //                     hidden: { opacity: 0, y: 15 },
    //                     show: { opacity: 1, y: 0, transition: { type: "spring", damping: 20 } }
    //                 }}
    //             >
    //                 <TrackItem 
    //                     track={track}
    //                     onSelect={(track) => handleTrackSelect(track)}
    //                     index={i}
    //                 />
    //             </motion.div>
    //             </>
    //         ))}
    //     </motion.div>
    //     </>
    // );
};

const MOCK_TRACK_LIST_200: TrackBase[] = Array.from({ length: 200 }, (_, i) => ({
    id: `mock-id-${i}`,
    title: `Mock Track #${i + 1}`,
    artists: [
        { id: "mock-artist-id-0", name: "Mock Artist"}
    ],
    duration: 1,
}));
