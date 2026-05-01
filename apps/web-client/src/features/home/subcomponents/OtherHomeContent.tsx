import { motion } from 'framer-motion';

import { XIcon } from '@phosphor-icons/react';
import type { HomeContent } from '../home.types';
import { BOTTOM_SHELF } from '@/features/player/player.constants';
import { PlaylistList } from '@/playlist/PlaylistList';


interface OtherHomeContentViewProps {
    contentData: HomeContent;
    onClose: () => void;
}

export const OtherHomeContentView = ({
    contentData,
    onClose
}: OtherHomeContentViewProps) => {

    return (
        <>
        <motion.div
            key="other-home-content-view"
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
                        N/A
                    </h1>
                    <button className="text-sm font-medium text-white/40 active:text-white shrink-0">
                        <XIcon size={20} weight="bold" />
                    </button>
                </div>
    
                {/* ABOUT / METADATA SECTION */}
                <div className="flex flex-col gap-1 pb-2">
                    <div className="flex items-center gap-2">
                        <div 
                            className="w-2 h-2 rounded-full animate-pulse" 
                            style={{ backgroundColor: contentData.color }} 
                        />
                        <span className="text-[10px] uppercase tracking-[0.15em] font-black text-white/60">
                            N/A
                        </span>
                    </div>
                    
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                        {contentData.description || "Your collection of tracks saved for offline playback."}
                    </p>
                       
                    <div className="flex gap-6 mt-1">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider">Tracks</span>
                            <span className="text-sm font-medium text-white/90">
                                {/* Eventually replace with real length: tracks.length */}
                                N/A
                            </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider">Storage</span>
                            <span className="text-sm font-medium text-white/90">N/A</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div 
                    className="flex flex-col gap-0"
                    style={{ marginBottom: `${BOTTOM_SHELF.totalHeight}px` }}
                >
                    {/* <PlaylistList
                        tracks={[]}
                    /> */}
                </div>
            </div>
        </motion.div>
        </>
    );
};