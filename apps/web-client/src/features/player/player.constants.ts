import { Home, Library, Search, User } from 'lucide-react';

import type { NavItemConfig } from '@/features/player/player.types';
import { isPWA } from '@/lib/utils';

//player sizing and location
export const PLAYER_CONFIG = {
    collapsedHeight: 64, // px
    expandedHeight: '100dvh',
    borderRadius: 12,
    marginSide: 8,
    marginBottom: 12, // Gap between Nav and Player

    iconSize: 20,
};

//queue sizing
export const QUEUE_CONFIG = {
    iconSize: 14,
}

//navbar sizing
export const NAV_CONFIG = isPWA() ? {
    height: 48, //total height
    paddingTop: 2, //optional lifted padding (for device-based padding in a pwa, as recommended by a friend n.w.)
    bottomPadding: 14, 
    iconSize: 18,
} : {
    height: 36,
    paddingTop: 0,
    paddingBottom: 0,
    iconSize: 18,
};

// Helper to calculate the total "dead zone" at the bottom of the screen
export const BOTTOM_SHELF = {
    totalHeight: (
        PLAYER_CONFIG.collapsedHeight + 
        NAV_CONFIG.height + 
        PLAYER_CONFIG.marginBottom
    ),
    totalHeightWithMargins: (
        PLAYER_CONFIG.collapsedHeight + 
        NAV_CONFIG.height + 
        (2 * PLAYER_CONFIG.marginBottom)
    ),
    playerHeightWithMargins: (
        PLAYER_CONFIG.collapsedHeight +
        (2 * PLAYER_CONFIG.marginBottom)
    )
}

//navbar tab items
export const NAV_ITEMS: readonly NavItemConfig[] = [
    { tab: "home", icon: Home },
    { tab: "search", icon: Search },
    { tab: "library", icon: Library },
    { tab: "profile", icon: User }
]