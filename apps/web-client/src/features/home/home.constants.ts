import type React from "react";
import { DownloadedHomeContentView } from "./subcomponents/DownloadedHomeContent";
import { OtherHomeContentView } from "./subcomponents/OtherHomeContent";


export const HOME_CONTENT_TYPES = {
    DOWNLOADS: "downloaded_tracks",
    RECENTLY_PLAYED: "recently_played",
    POPULAR: "popular_now",
    DISCOVER: "new_discoveries",
    OTHER: "other",
} as const;


export const HOME_CONTENT_COMPONENTS: Record<string, React.FC<any>> = {
    [HOME_CONTENT_TYPES.DOWNLOADS]: DownloadedHomeContentView,
    [HOME_CONTENT_TYPES.OTHER]: OtherHomeContentView
};