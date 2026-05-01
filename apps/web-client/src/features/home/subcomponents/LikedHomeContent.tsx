import { motion } from 'framer-motion';
import { XIcon } from '@phosphor-icons/react';

import { useLikes } from '@/store/hooks/useLikes';

import { PlaylistList } from '@/playlist/PlaylistList';
import { PlaylistInfo } from '@/playlist/PlaylistInfo';

import { BOTTOM_SHELF } from '@/features/player/player.constants';

import type { HomeContent } from '@/features/home/home.types';


interface LikedHomeContentViewProps {
    contentData: HomeContent;
    onClose: () => void;
}

export const LikedHomeContentView = ({
    contentData,
    onClose
}: LikedHomeContentViewProps) => {

    const likesScrollContext = useLikes();

    return (
        <>
        {/* LIKED TRACKS VIEW */}
        <motion.div
            key="liked-home-content-view"
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
                        Likes
                    </h1>
                    <button className="text-sm font-medium text-white/40 active:text-white shrink-0">
                        <XIcon size={20} weight="bold" />
                    </button>
                </div>
    
                {/* ABOUT / METADATA SECTION */}
                <div className="flex flex-col gap-2 mx-1">
                    <div className="flex items-center gap-2">
                        <div 
                            className="w-2 h-2 rounded-full animate-pulse" 
                            style={{ backgroundColor: contentData.color }} 
                        />
                        <span className="text-[10px] uppercase tracking-[0.15em] font-black text-white/60">
                            Everything
                        </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                        {contentData.description}
                    </p>
                    
                    <PlaylistInfo scrollContext={likesScrollContext}/>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 no-scrollbar">
                <PlaylistList
                    scrollContext={likesScrollContext}
                    bottomSpacing={BOTTOM_SHELF.totalHeight}
                    actions={["queueNext", "queueLast", "unlike", "edit"]}
                    emptySubtext="Swipe left to like a track"
                />
            </div>
        </motion.div>
        </>
    );
};