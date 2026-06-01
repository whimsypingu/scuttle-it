import {useSortable} from '@dnd-kit/react/sortable';

import type React from 'react';


export function Sortable({id, index, children}: {id: string; index: number; children?: React.ReactNode}) {
    const {ref} = useSortable({id, index});

    return (
        <div ref={ref}>
            {children}
        </div>
    );
}