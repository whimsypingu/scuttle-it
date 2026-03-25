// src/features/player/queue/components/QueueView.tsx
import { motion } from 'framer-motion';
import { Music2, GripVertical } from 'lucide-react';

export const generateMockQueue = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
        id: `${i+1}`,
        title: `Scuttle Track ${i+1}`,
        artist: String.fromCharCode(65 + (i % 26)),
    }));
};

export const QueueView = () => {
    return (
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col h-full w-full"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Up Next</h3>
                <button className="text-xs text-brand font-bold uppercase">Clear All</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {generateMockQueue(1000).map((track) => (
                <div 
                    key={track.id} 
                    className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/5 group transition-colors"
                >
                    <div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center shrink-0">
                    <Music2 className="w-5 h-5 text-white/20" />
                    </div>
                    <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{track.title}</div>
                    <div className="text-xs text-white/40 truncate">{track.artist}</div>
                    </div>
                    <GripVertical className="w-5 h-5 text-white/10 group-active:text-white/40 cursor-grab" />
                </div>
                ))}
            </div>
        </motion.div>
    );
};