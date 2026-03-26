// src/features/player/queue/components/QueueView.tsx
import { useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Heart, ListPlus, Music2 } from 'lucide-react';

import { TrackItem } from '@/features/track/TrackItem';

export const generateMockQueue = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
        id: `${i+1}`,
        title: `Scuttle Track ${i+1}`,
        artist: String.fromCharCode(65 + (i % 26)),
    }));
};

export const QueueView = () => {

    return (
        <div 
            className="space-y-2 py-2"
            onDragStartCapture={(e) => e.stopPropagation()}
            onDragCapture={(e) => e.stopPropagation()}
        >
            {generateMockQueue(100).map((track, index) => (
                <TrackItem key={track.id} track={track} index={index} />
            ))}
        </div>
    );
};