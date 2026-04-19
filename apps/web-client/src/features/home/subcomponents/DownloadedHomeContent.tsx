import { motion } from 'framer-motion';

import { XIcon } from '@phosphor-icons/react';
import type { HomeContent } from '../home.types';
import { BOTTOM_SHELF } from '@/features/player/player.constants';
import { PlaylistList } from '@/features/playlist/PlaylistList';
import { useDownloads } from '@/store/hooks/useDownloads';


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
                    <div className="flex items-start gap-2">
                        <div 
                            className="w-2 h-2 rounded-full animate-pulse mt-1" 
                            style={{ backgroundColor: contentData.color }} 
                        />
                        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                            {contentData.description}
                        </p>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider">Tracks</span>
                            <span className="text-sm font-medium text-white/70">
                                {scrollContext.totalCount}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-600 uppercase font-medium">Storage</span>
                            <span className="text-xs text-white/70">N/A</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-600 uppercase font-medium">Duration</span>
                            <span className="text-xs text-white/70">N/A</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 no-scrollbar">
                <PlaylistList
                    scrollContext={scrollContext}
                    bottomSpacing={BOTTOM_SHELF.totalHeight}
                    actions={["like", "queueLast", "delete", "delete"]}
                />
            </div>
        </motion.div>
        </>
    );
};