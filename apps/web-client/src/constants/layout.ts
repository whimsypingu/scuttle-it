// src/constants/layout.ts

export const PLAYER_CONFIG = {
    collapsedHeight: 64, // px
    expandedHeight: '100dvh',
    borderRadius: 12,
    marginSide: 8,
    marginBottom: 12, // Gap between Nav and Player
};

export const NAV_CONFIG = {
    height: 48,
};

// Helper to calculate the total "dead zone" at the bottom of the screen
export const BOTTOM_SHELF_TOTAL_HEIGHT = 
    PLAYER_CONFIG.collapsedHeight + 
    NAV_CONFIG.height + 
    PLAYER_CONFIG.marginBottom + 
    20; // Extra padding for breathing room