import { motion } from 'framer-motion';
import { XIcon } from '@phosphor-icons/react';

import { useLikes } from '@/store/hooks/useLikes';

import { PlaylistList } from '@/playlist/PlaylistList';
import { PlaylistInfo } from '@/playlist/PlaylistInfo';

import { BOTTOM_SHELF } from '@/features/player/player.constants';

import type { HomeContent } from '@/features/home/home.types';
import type { PlaylistSummary } from '@/playlist/playlist.types';
import { usePlaylistContent } from '@/store/hooks/usePlaylists';


interface PlaylistContentViewProps {
    summaryData: PlaylistSummary;
    onClose: () => void;
}

export const PlaylistContentView = ({
    summaryData,
    onClose
}: PlaylistContentViewProps) => {

    const playlistScrollContext = usePlaylistContent(summaryData.id);

    return (
        <>
        {/* PLAYLIST TRACKS VIEW */}
        <motion.div
            key="playlist-content-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col"
        >
            {/* HEADER */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md py-4 flex flex-col">
                <div 
                    className="flex items-center justify-between mb-2"
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                >
                    <h1 className="tab-heading truncate pr-4">
                        {summaryData.name}
                    </h1>
                    <button className="text-sm font-medium text-white/40 active:text-white shrink-0">
                        <XIcon size={20} weight="bold" />
                    </button>
                </div>
    
                {/* ABOUT / METADATA SECTION */}
                <div className="flex flex-col gap-2 mx-1">
                    <div className="flex items-center gap-2">
                        <div 
                            className="w-2 h-2 rounded-full animate-pulse purple" 
                            // style={{ backgroundColor: contentData.color }} 
                        />
                        <span className="text-[10px] uppercase tracking-[0.15em] font-black text-white/60">
                            Everything
                        </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                        Blank summaryData description
                    </p>
                    
                    <PlaylistInfo scrollContext={playlistScrollContext}/>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 no-scrollbar">
                <PlaylistList
                    scrollContext={playlistScrollContext}
                    bottomSpacing={BOTTOM_SHELF.totalHeight}
                    actions={["queueNext", "queueLast", "like", "edit"]}
                    emptySubtext="Swipe left and edit to add a track"
                />
            </div>
        </motion.div>
        </>
    );
};