import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Play, SkipBack, SkipForward, ListMusic } from 'lucide-react';

import { PLAYER_CONFIG, NAV_CONFIG } from '@/constants/layout';

export const GlobalPlayer = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    // This function handles the "snap" logic after the user lets go
    const onDragEnd = (_: any, info: any) => {
        const swipeThreshold = 50; // px
        const velocityThreshold = 500; // px/s

        if (isExpanded) {
        // If expanded, check if swiped down far enough or fast enough
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

    return (
        <motion.div
            layout // The magic prop that handles smooth resizing
            initial={false}
            animate={{
                height: isExpanded ? PLAYER_CONFIG.expandedHeight : `${PLAYER_CONFIG.collapsedHeight}px`,
                bottom: isExpanded ? 0 : `${NAV_CONFIG.height + PLAYER_CONFIG.marginBottom}px`, // Sits above your nav bar
                left: isExpanded ? 0 : `${PLAYER_CONFIG.marginSide}px`,
                right: isExpanded ? 0 : `${PLAYER_CONFIG.marginSide}px`,
                borderRadius: isExpanded ? '0px' : `${PLAYER_CONFIG.borderRadius}px`,
                backgroundColor: isExpanded? 'var(--color-surface)' : 'var(--color-brand)',
            }}
            transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 30 
            }}
            className="fixed z-50 shadow-2xl overflow-hidden cursor-pointer"
            onClick={() => !isExpanded && setIsExpanded(true)}
            drag="y" // enable vertical dragging
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={onDragEnd}
        >
        {/* We use AnimatePresence to swap the "Mini" and "Full" content 
            inside the same moving container.
        */}
        <AnimatePresence mode="wait">
            {isExpanded ? (
                <motion.div
                    key="full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col h-full p-8"
                >
                    <button onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}>
                    <ChevronDown className="w-8 h-8 mb-8" />
                    </button>
                    
                    <div className="flex-1 flex flex-col items-center justify-center">
                    <motion.div layoutId="album-art" className="w-full aspect-square bg-brand/20 rounded-lg mb-8" />
                    <div className="w-full">
                        <h2 className="text-2xl font-bold">Scuttle Rebuild</h2>
                        <p className="text-white/70">The New Professional</p>
                    </div>
                    </div>

                    {/* Controls omitted for brevity, same as before */}
                </motion.div>
            ) : (
                <motion.div
                    key="mini"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between h-full px-3"
                >
                    <div className="flex items-center gap-3">
                    <motion.div layoutId="album-art" className="w-10 h-10 bg-black/20 rounded" />
                    <div className="text-sm font-bold">Scuttle Rebuild</div>
                    </div>
                    <Play className="w-6 h-6 fill-current" />
                </motion.div>
            )}
        </AnimatePresence>
        </motion.div>
    );
};