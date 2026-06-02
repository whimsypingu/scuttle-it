import {DragOverlay, useDraggable, useDroppable} from '@dnd-kit/react';

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


export function DnDable({id, children}: {id: string; children?: React.ReactNode}) {
    const { ref: dragRef, isDragging } = useDraggable({ id });
    const { ref: dropRef, isDropTarget } = useDroppable({ id });

    const combinedRef = (element: HTMLDivElement | null) => {
        dragRef(element);
        dropRef(element);
    };

    // const style: React.CSSProperties = {
    //     // We leave transform out here because our DragOverlay handles the moving visual!
    //     opacity: isDragging ? 0.2 : 1, 
        
    //     // Give the user a clear indicator of which row they are hovering over
    //     border: isDropTarget ? '2px dashed #3b82f6' : '2px solid transparent',
    //     boxSizing: 'border-box',
    //     transition: 'border-color 0.1s ease',
    // };

    return (
        // <div 
        //     ref={combinedRef}
        //     style={{
        //         opacity: isDragging ? 0.2 : 1,
        //     }}
        // >
        <div ref={combinedRef}>
            {children}
        </div>
    )
}