import {DragOverlay, useDraggable} from '@dnd-kit/react';

import type React from 'react';


export function Draggable({id, children}: {id: string; children?: React.ReactNode}) {
    const {ref} = useDraggable({
        id,
    });

    return (
        <>
        <div ref={ref}>
            {/* draggable */}
            {children}
        </div>
        </>
    );
}