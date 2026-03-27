import { useState } from 'react';
import { motion, useDragControls } from 'framer-motion';

import { ExpandedView } from '@/features/player/ExpandedView';
import { MiniView } from '@/features/player/MiniView';

import { PLAYER_CONFIG, NAV_CONFIG } from '@/features/player/player.constants';

import type { GlobalPlayerProps } from '@/features/player/player.types';


export const GlobalPlayer = ({ isExpanded, setIsExpanded }: GlobalPlayerProps) => {

    // This function handles the opening and closing of the player
    const onDragEnd = (_: any, info: any) => {
        const swipeThreshold = 50; // px
        const velocityThreshold = 500; // px/s

        if (isExpanded) {
            // SWIPE DOWN -> close player
            if (info.offset.y > swipeThreshold || info.velocity.y > velocityThreshold) {
                setIsExpanded(false);
            }
        } else {
            // If collapsed, check if swiped up
            if (info.offset.y < -swipeThreshold || info.velocity.y < -velocityThreshold) {
                setIsExpanded(true);
            }
        }
    };

    const dragControls = useDragControls();

    // scrolling shrinking the size of the album art and moving it around
    const [isCompact, setIsCompact] = useState(false);

    return (
        <>
        <motion.div 
            layout 
            id="global-player-outer-container"
            animate={{
                height: isExpanded ? PLAYER_CONFIG.expandedHeight : `${PLAYER_CONFIG.collapsedHeight}px`,
                bottom: isExpanded ? 0 : `${NAV_CONFIG.height + PLAYER_CONFIG.marginBottom}px`, // Sits above your nav bar
                left: isExpanded ? 0 : `${PLAYER_CONFIG.marginSide}px`,
                right: isExpanded ? 0 : `${PLAYER_CONFIG.marginSide}px`,
                borderRadius: isExpanded ? '0px' : `${PLAYER_CONFIG.borderRadius}px`,
                backgroundColor: isExpanded? 'var(--color-background)' : 'var(--color-brand)',
            }}
            transition={{ 
                type: "spring",
                stiffness: 400,
                damping: 40,
                mass: 1,
            }}
            className="fixed z-50 shadow-2xl overflow-hidden cursor-pointer"
            onClick={() => !isExpanded && setIsExpanded(true)}
            drag={"y"} // enable vertical dragging
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.05}
            onDragEnd={onDragEnd}
        >
            {isExpanded ? (
                <ExpandedView
                    isCompact={isCompact}
                    setIsCompact={setIsCompact}
                    onClose={() => setIsExpanded(false)}
                    playerDragControls={dragControls}
                />
            ) : (
                <MiniView
                    onExpand={() => setIsExpanded(true)}
                />
            )}


        </motion.div>

        </>
    );
};