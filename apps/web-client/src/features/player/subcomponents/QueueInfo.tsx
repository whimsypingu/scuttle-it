import { AnimatePresence, motion } from 'framer-motion';
import { Virtuoso } from 'react-virtuoso';

import { useMemo } from 'react';
import { useQueue } from '@/store/hooks/useQueue';
import { useSettings } from '@/store/hooks/useSettings';

import { TrackItem } from '@/track/TrackItem';

import type { TrackBase } from '@/track/track.types';
import { ScribbleIcon, TrashIcon } from '@phosphor-icons/react';
import { formatReadableTime, formatTime } from '@/features/audio/audio.utils';


export const QueueInfo = () => {

    const { queue, pop, isLoading } = useQueue();
    const { settings } = useSettings();

    const loopmode = settings?.loopmode;

    const currentQueue = queue?.slice(1) ?? []; //take everything except currently playing, if exists
    const queueCount = currentQueue?.length ?? 0;

    const queueDuration = queue?.reduce((acc, track) => acc + (track.duration || 0), 0) ?? 0;
    const queueFormattedDuration = formatReadableTime(queueDuration);

    //handle clearing the queue
    const openClearQueueForm = () => {
        console.log("CLEAR QUEUE");
    }

    return (
        <motion.div 
            key="queue-info"
            initial={{ opacity: 0 }}
            animate={{ 
                opacity: queueCount > 0 ? 1 : 0, 
                pointerEvents: queueCount > 0 ? "auto" : "none" 
            }}
            className="flex items-center gap-2 px-2 my-1 border-y"
        >
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/60">
                <div>
                    <span>{queueCount}</span>
                    <span className="uppercase text-zinc-600 ml-1">{queueCount === 1 ? 'track' : 'tracks'}</span>
                </div>

                <span className="text-zinc-500 font-bold mx-1 select-none">•</span>
                
                <span>{queueFormattedDuration}</span>
            </div>

            {/* CLEAR QUEUE */}
            <div className="ml-auto flex items-center text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all">
                <button 
                    className="px-1 py-2"
                    onClick={openClearQueueForm}
                >
                    <ScribbleIcon size={14} weight="light" />
                </button>
            </div>
        </motion.div>
    );
};