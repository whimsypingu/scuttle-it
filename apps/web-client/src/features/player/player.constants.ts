import { Home, Library, Search, User } from 'lucide-react';

import type { NavItemConfig } from '@/features/player/player.types';

//player sizing and location
export const PLAYER_CONFIG = {
    collapsedHeight: 64, // px
    expandedHeight: '100dvh',
    borderRadius: 12,
    marginSide: 8,
    marginBottom: 12, // Gap between Nav and Player
};

//navbar sizing
export const NAV_CONFIG = {
    height: 32,
};

// Helper to calculate the total "dead zone" at the bottom of the screen
export const BOTTOM_SHELF_TOTAL_HEIGHT = 
    PLAYER_CONFIG.collapsedHeight + 
    NAV_CONFIG.height + 
    PLAYER_CONFIG.marginBottom + 
    20; // Extra padding for breathing room

//navbar tab items
export const NAV_ITEMS: readonly NavItemConfig[] = [
    { tab: "home", icon: Home },
    { tab: "search", icon: Search },
    { tab: "library", icon: Library },
    { tab: "user", icon: User }
]