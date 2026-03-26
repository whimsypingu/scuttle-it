export type Tab = 'home' | 'search' | 'library' | 'user';

export interface NavBarProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

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
}