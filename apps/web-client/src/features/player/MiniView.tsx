import { motion } from 'framer-motion';
import { PlayIcon } from '@phosphor-icons/react';

import type { MiniViewProps } from '@/features/player/player.types';

import { PLAYER_CONFIG } from '@/features/player/player.constants';


export const MiniView = ({ onExpand }: MiniViewProps) => {
    return (
        <>
        <motion.div
            layout
            layoutId="global-player-inner-container"
            className="flex items-center justify-between h-full px-3"
            onClick={(e) => {
                e.stopPropagation();
                onExpand();
            }}
        >
            <div className="flex items-center gap-3">
                
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
                        Placeholder Track Title
                    </motion.span>
                    
                    <motion.span 
                        layout="position"
                        className="text-white/60 text-xs font-light truncate max-w-full block"
                    >
                        Track Artist
                    </motion.span>
                </motion.div> 

                <PlayIcon size={PLAYER_CONFIG.iconSize} weight="fill" />
            </div>
        </motion.div>
        </>
    );
};
