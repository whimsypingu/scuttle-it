import { motion, AnimatePresence } from 'framer-motion';

import { NAV_ITEMS } from '@/features/player/player.constants';

import type { MainLayoutProps } from '@/features/player/player.types';


export const MainLayout = ({ children, activeTab, onTabChange }: MainLayoutProps) => {
    const handleDragEnd = (_: any, info: any) => {
        const swipeThreshold = 50;
        const velocityThreshold = 600;

        //check to see that the swipe is mostly horizontal
        if (Math.abs(info.offset.y) > Math.abs(info.offset.x)) {
            return;
        }

        const currentIndex = NAV_ITEMS.findIndex(item => item.tab === activeTab);

        if (info.offset.x < -swipeThreshold && info.velocity.x < -velocityThreshold) {
            //swipe left -> go to next tab
            const nextIndex = Math.min(currentIndex + 1, NAV_ITEMS.length - 1);
            onTabChange(NAV_ITEMS[nextIndex].tab);
        } else if (info.offset.x > swipeThreshold && info.velocity.x > velocityThreshold) {
            //swipe right -> go to previous tab
            const prevIndex = Math.max(currentIndex - 1, 0);
            onTabChange(NAV_ITEMS[prevIndex].tab);
        }
    };

    return (
        <>
        <motion.div
            drag="x"
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.02}
            onDragEnd={handleDragEnd}
            className="flex flex-col h-dvh bg-background overflow-hidden touch-pan-y"
        >
            {/* Scrollable Content Area */}
            <main 
                className="h-full w-full"
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ 
                            duration: 0.2, 
                            ease: "easeInOut" 
                        }}
                        className="h-full w-full"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </motion.div>
        </>
    );
};