import type { DragControls } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import React from 'react';

//navbar
export type Tab = 'home' | 'search' | 'library' | 'user';

export interface NavBarProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export interface NavItemConfig {
    readonly tab: Tab;
    readonly icon: LucideIcon;
}

export interface NavItemProps {
    icon: LucideIcon;
    active: boolean;
    onClick: () => void;
}

//all the space above the navbar
export interface MainLayoutProps {
    children: React.ReactNode;
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

//player
export interface GlobalPlayerProps {
    isExpanded: boolean;
    setIsExpanded: (value: boolean) => void;
}

export interface MiniViewProps {
    onExpand: () => void; // what do when expanded
}

export interface ExpandedViewProps {
    isCompact: boolean;
    setIsCompact: (value: boolean) => void;
    onClose: () => void; //what to do when closed
    playerDragControls: DragControls; //parent dragControls to cancel when dragging on the queue
}