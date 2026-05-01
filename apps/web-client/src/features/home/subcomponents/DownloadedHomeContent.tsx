import { motion } from 'framer-motion';
import { XIcon } from '@phosphor-icons/react';

import { useDownloads } from '@/store/hooks/useDownloads';

import { PlaylistList } from '@/features/playlist/PlaylistList';

import { formatReadableTime } from '@/features/audio/audio.utils';
import { BOTTOM_SHELF } from '@/features/player/player.constants';

import type { HomeContent } from '@/features/home/home.types';


interface DownloadedHomeContentViewProps {
    contentData: HomeContent;
    onClose: () => void;
}

export const DownloadedHomeContentView = ({
    contentData,
    onClose
}: DownloadedHomeContentViewProps) => {

    const scrollContext = useDownloads();

    return (
        <>
        {/* DOWNLOADED TRACKS VIEW */}
        <motion.div
            key="downloaded-home-content-view"
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
                        Tracks
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

                    <div className="flex gap-4">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-zinc-600 uppercase font-medium">Tracks</span>
                            <span className="text-xs text-white/70">
                                {scrollContext.totalCount}
                            </span>
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-zinc-600 uppercase font-medium">Duration</span>
                            <span className="text-xs text-white/70">
                                {formatReadableTime(scrollContext.totalDuration)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 no-scrollbar">
                <PlaylistList
                    scrollContext={scrollContext}
                    bottomSpacing={BOTTOM_SHELF.totalHeight}
                    actions={["queueNext", "queueLast", "like", "edit"]}
                />
            </div>
        </motion.div>
        </>
    );
};