import { queryClient } from "@/store/queryClient";
import { WS_POKE_TYPES } from "@/store/sync/sync.constants";

import type { WSPoke } from "@/store/sync/sync.types";


export function handleWSPoke(poke: WSPoke): void {
    const { type, payload } = poke;

    console.log(`WebSocket sync handling ${type}`, payload || "");

    switch (type) {
        case WS_POKE_TYPES.DOWNLOAD_JOB_SUCCESS:
            queryClient.invalidateQueries({ queryKey: ["tracks"] });
            break;

        default:
            console.warn(`WebSocket sync unhandled poke type: ${type}`);
    }
}