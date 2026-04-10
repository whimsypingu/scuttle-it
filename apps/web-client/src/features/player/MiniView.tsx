import { motion } from 'framer-motion';

import { useQueue } from '@/store/hooks/useQueue';

import { MiniViewPlayPauseButton, MiniViewSlider } from '@/features/player/subcomponents/MiniViewControls';
import { getTrackDisplayMetadata } from '@/model/model.utils';

import type { MiniViewProps } from '@/features/player/player.types';


export const MiniView = ({ onExpand }: MiniViewProps) => {
    const { queue } = useQueue(); //get the latest queue from tanstack

    const currentTrack = queue?.[0];
    console.log(currentTrack);

    const { 
        titleDisplay: currentTitle,
        artistDisplay: currentArtist
    } = getTrackDisplayMetadata(currentTrack);

    console.log(`title: ${currentTitle}`);
    console.log(`artist: ${currentArtist}`);

    return (
        <>
        <motion.div
            layout
            layoutId="global-player-inner-container"
            className="h-full flex flex-col"
            onClick={(e) => {
                e.stopPropagation();
                onExpand();
            }}
        >
            <div className="flex-1 flex items-center justify-between px-3 gap-3">
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

                <MiniViewPlayPauseButton />
            </div>

            {/* SLIDER */}
            <MiniViewSlider />
        </motion.div>
        </>
    );
};
