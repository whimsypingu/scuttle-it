import type { PlaylistBase, SummaryPlaylist } from "@/playlist/playlist.types";
import type React from "react";
// import type { HOME_CONTENT_TYPES } from "./home.constants";


export interface HomeViewProps {
    tabResetSignal: number;
}



export type SystemPlaylistId = "downloads" | "likes";

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


// export type HomeContentType = typeof HOME_CONTENT_TYPES[keyof typeof HOME_CONTENT_TYPES];

// export interface HomeContent extends PlaylistBase {
//     type: HomeContentType; 
//     description?: string;
//     color?: string;
// }
