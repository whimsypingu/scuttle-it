import {useDroppable} from '@dnd-kit/react';

import type React from 'react';


export function Droppable({id, children}: {id: string; children?: React.ReactNode}) {
    const {ref, isDropTarget} = useDroppable({
        id,
    });

    return (
        <div ref={ref}>
            {/* droppable */}
            {children}
        </div>
    );
}