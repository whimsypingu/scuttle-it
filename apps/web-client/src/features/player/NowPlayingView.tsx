import { motion } from 'framer-motion';

export const NowPlayingView = () => {
    return (
        <motion.div 
            key="now-playing"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col items-center justify-center"
        >
            {/* The layoutId ensures the mini-player art 'flies' into this spot */}
            <motion.div 
                layoutId="album-art" 
                className="w-full aspect-square bg-brand rounded-lg mb-8 shadow-2xl" 
            />
            
            <div className="w-full">
                <h2 className="text-2xl font-bold">Scuttle Rebuild</h2>
                <p className="text-white/70">The New Professional</p>
            </div>
        </motion.div>
    );
};