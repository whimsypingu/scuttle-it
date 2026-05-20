import type { PlaylistBase } from "@/playlist/playlist.types";
import type React from "react";


export interface HomeViewProps {
    tabResetSignal: number;
}


export type SystemPlaylistId = "downloads" | "likes" | "recents";

export interface SystemPlaylist extends PlaylistBase {
    id: SystemPlaylistId;
    tagline: string; //metadata label beneath name
    description: string;
    component: React.FC<any>;
}

export type HomeContent =
    | { 
        type: "systemPlaylist"; 
        color: string; 
        name: string;
        description: string; 
        data: SystemPlaylist; 
    }
    | { 
        color: string; 
        type: "customPlaylist"; 
        name: string;
        description: string; 
        data: PlaylistBase;
    }
