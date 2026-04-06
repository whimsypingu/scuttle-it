import { motion } from 'framer-motion';

import { PlayIcon } from '@phosphor-icons/react';

import { PLAYER_CONFIG } from '@/features/player/player.constants';

import type { MiniViewProps } from '@/features/player/player.types';
import { useQueue } from '@/store/hooks/useQueue';


export const MiniView = ({ onExpand }: MiniViewProps) => {
    const { queue } = useQueue(); //get the latest queue from tanstack

    const currentTrack = queue?.[0];
    console.log(currentTrack);

    const currentTitle = currentTrack?.titleDisplay ?? currentTrack?.title ?? "---";
    console.log(`title: ${currentTitle}`);

    const currentArtist = currentTrack?.artists.map(a => a.nameDisplay ?? a.name) ?? "---";
    console.log(`artist: ${currentArtist}`);

    return (
        <>
        <motion.div
            layout
            layoutId="global-player-inner-container"
            className="flex items-center justify-between h-full px-3 gap-3"
            onClick={(e) => {
                e.stopPropagation();
                onExpand();
            }}
        >
            <div className="flex items-center gap-3 min-w-0 flex-1">
                
                {/* SHARED: ALBUM ART */}
                <motion.div
                    layout
                    layoutId="album-art"
                    className="w-10 h-10 bg-black/20 rounded"
                />

                {/* SHARED: TEXT BLOCK */}
                <motion.div
                    layout="position"
                    layoutId="text-block"
                    className={`flex flex-col flex-1 min-w-0 w-full text-left items-start justify-between`} 
                >
                    <motion.span 
                        layout="position"
                        className="text-md font-medium truncate leading-tight max-w-full block"
                    >
                        {currentTitle}
                    </motion.span>
                    
                    <motion.span 
                        layout="position"
                        className="text-white/60 text-xs font-light truncate max-w-full block"
                    >
                        {currentArtist}
                    </motion.span>
                </motion.div> 

            </div>

            <div className="flex items-center px-2">
                <PlayIcon size={PLAYER_CONFIG.iconSize} weight="fill" />
            </div>
                
        </motion.div>
        </>
    );
};
