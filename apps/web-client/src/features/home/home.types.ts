import type { PlaylistBase, SummaryPlaylist } from "@/playlist/playlist.types";
import type React from "react";


export interface HomeTabProps {
    tabResetSignal: number;
}


export type SystemPlaylistId = "downloads" | "likes" | "recents";

export interface SystemPlaylist extends PlaylistBase {
    id: SystemPlaylistId;
    tagline: string; //metadata label beneath name
    description: string;
    component: React.FC<any>;
}

//need to have the same fields, but some can be blank (for now)
export type HomeContent =
    | { 
        type: "systemPlaylist"; 
        color: string; 
        name: string;
        description: string; 
        data: SystemPlaylist; 
    }
    | { 
        type: "customPlaylist"; 
        color: string;              //blank
        name: string;               //blank
        description: string;        //blank
        data: SummaryPlaylist;
    }
