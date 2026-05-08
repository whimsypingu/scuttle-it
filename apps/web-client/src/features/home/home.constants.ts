import type React from "react";

import { DownloadedHomeContentView } from "./subcomponents/DownloadedHomeContent";
import { LikedHomeContentView } from "./subcomponents/LikedHomeContent";

import { OtherHomeContentView } from "./subcomponents/OtherHomeContent";

import type { HomeContent } from "./home.types";


export const HOME_CONTENT_TYPES = {
    DOWNLOADS: "downloaded_tracks",
    RECENTLY_PLAYED: "recently_played",
    POPULAR: "popular_now",
    LIKES: "liked_tracks",
    DISCOVER: "new_discoveries",
    OTHER: "other",
} as const;


export const HOME_CONTENT_COMPONENTS: Record<string, React.FC<any>> = {
    [HOME_CONTENT_TYPES.DOWNLOADS]: DownloadedHomeContentView,
    [HOME_CONTENT_TYPES.LIKES]: LikedHomeContentView,
    [HOME_CONTENT_TYPES.OTHER]: OtherHomeContentView
};



export const MOCK_HOME_CONTENTS: HomeContent[] = [
    {
        id: "hc1",
        type: HOME_CONTENT_TYPES.DOWNLOADS,
        name: "All Tracks",
        description: "Your core library. Every single track in one playlist.",
        color: "#22c55e", // Green
    },
    {
        id: "hc2",
        type: HOME_CONTENT_TYPES.RECENTLY_PLAYED,
        name: "Recently Played (N/A)",
        description: "Jump back into the tracks and albums you've been spinning lately.",
        color: "#3b82f6", // Blue
    },
    {
        id: "hc3",
        type: HOME_CONTENT_TYPES.POPULAR,
        name: "Popular Now (N/A)",
        description: "The hottest tracks trending across the community this week.",
        color: "#ef4444", // Red
    },
    {
        id: "hc4",
        type: HOME_CONTENT_TYPES.LIKES,
        name: "Likes",
        description: "All your liked tracks.",
        color: "#a855f7", // Purple
    },
    {
        id: "hc5",
        type: HOME_CONTENT_TYPES.OTHER,
        name: "Morning Energy (N/A)",
        description: "Uptempo tracks to kickstart your daily routine.",
        color: "#eab308", // Yellow
    },
    {
        id: "hc6",
        type: HOME_CONTENT_TYPES.OTHER,
        name: "Heavy Rotation (N/A)",
        description: "Your most-played tracks from the last 30 days.",
        color: "#ec4899", // Pink
    },
    {
        id: "hc7",
        type: HOME_CONTENT_TYPES.OTHER,
        name: "New Discoveries (N/A)",
        description: "Fresh releases tailored to your specific taste profile.",
        color: "#14b8a6", // Teal
    },
    {
        id: "hc8",
        type: HOME_CONTENT_TYPES.OTHER,
        name: "Chill Classics (N/A)",
        description: "Timeless records that set a relaxed mood.",
        color: "#f97316", // Orange
    },
    {
        id: "hc9",
        type: HOME_CONTENT_TYPES.OTHER,
        name: "Late Night Melodies (N/A)",
        description: "Soft acoustics and midnight jazz for the wind-down.",
        color: "#6366f1", // Indigo
    },
    {
        id: "hc10",
        type: HOME_CONTENT_TYPES.OTHER,
        name: "Gym Motivation (N/A)",
        description: "High-BPM anthems to push your limits.",
        color: "#475569", // Slate
    },
    {
        id: "hc11",
        type: HOME_CONTENT_TYPES.OTHER,
        name: "On The Road (N/A)",
        description: "The perfect companion for long drives and open highways.",
        color: "#84cc16", // Lime
    },
    {
        id: "hc12",
        type: HOME_CONTENT_TYPES.OTHER,
        name: "Hidden Gems (N/A)",
        description: "Under-the-radar tracks you might have missed.",
        color: "#06b6d4", // Cyan
    },
];