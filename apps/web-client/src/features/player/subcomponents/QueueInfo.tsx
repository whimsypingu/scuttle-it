import { motion } from 'framer-motion';
import { ScribbleIcon } from '@phosphor-icons/react';

import { useRef } from 'react';
import { useQueue } from '@/store/hooks/useQueue';
import { useEditTarget } from '@/features/edit/EditProvider';

import { formatReadableTime } from '@/features/audio/audio.utils';

import { QUEUE_CONFIG } from '@/features/player/player.constants';

import type { ActiveEditTarget } from '@/features/edit/edit.types';


export const QueueInfo = () => {

    const { queue, isLoading } = useQueue();

    const currentQueue = queue?.slice(1) ?? []; //take everything except currently playing, if exists

    const count = currentQueue?.length ?? 0;
    const duration = currentQueue?.reduce((acc, track) => acc + (track.duration || 0), 0) ?? 0;

    //keep snapshots of the memory so that we prevent showing '0 tracks' when fading out this element's data for invalid data
    const lastValidCount = useRef(count);
    const lastValidDuration = useRef(duration);

    if (count > 0) {
        lastValidCount.current = count;
        lastValidDuration.current = duration;
    }

    // prep the 'clear queue' form popup function
    const { setEditTarget } = useEditTarget();
    const openClearQueueForm = () => {
        const createQueueTarget: ActiveEditTarget = {
            type: "clearQueue", 
            data: null,
        };
        setEditTarget(createQueueTarget);
    }

    return (
        <motion.div 
            key="queue-info"
            initial={{ opacity: 0 }}
            animate={{ 
                opacity: count > 0 ? 1 : 0, 
                visibility: count > 0 ? "visible" : "hidden",
            }}
        >
            <div className="flex items-center gap-2 px-2 my-1 border-y">
                <span className="flex items-center text-[10px] font-medium text-white/60">
                    <span>
                        <span>{lastValidCount.current}</span>
                        
                        <span className="uppercase tracking-wider text-zinc-600 ml-1">
                            {lastValidCount.current === 1 ? 'track' : 'tracks'}
                        </span>
                    </span>

                    <span className="text-zinc-500 font-bold mx-2 select-none">•</span>
                    
                    <span>{formatReadableTime(lastValidDuration.current)}</span>
                </span>

                {/* CLEAR QUEUE */}
                <div className="ml-auto flex items-center text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all">
                    <button 
                        className="px-1 py-2"
                        onClick={openClearQueueForm} //WARNING: this triggers console accessibility warnings saying something like "Blocked aria-hidden on an element because its descendant retains focus."
                    >
                        <ScribbleIcon size={QUEUE_CONFIG.iconSize} weight="light" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};