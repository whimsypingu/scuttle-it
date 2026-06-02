import {useDraggable, useDroppable} from '@dnd-kit/react';

import type React from 'react';


export function DnDable({id, allow, children}: {id: string; allow: boolean; children?: React.ReactNode}) {
    const { ref: dragRef } = useDraggable({ id, disabled: !allow });
    const { ref: dropRef } = useDroppable({ id, disabled: !allow });

    const combinedRef = (element: HTMLDivElement | null) => {
        dragRef(element);
        dropRef(element);
    };

    return (
        <div ref={combinedRef}>
            {children}
        </div>
    )
}