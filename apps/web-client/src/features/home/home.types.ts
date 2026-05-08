import type { PlaylistBase } from "@/playlist/playlist.types";
import type { HOME_CONTENT_TYPES } from "./home.constants";


export interface HomeViewProps {
    tabResetSignal: number;
}

export type HomeContentType = typeof HOME_CONTENT_TYPES[keyof typeof HOME_CONTENT_TYPES];

export interface HomeContent extends PlaylistBase {
    type: HomeContentType; 
    description?: string;
    color?: string;
}
