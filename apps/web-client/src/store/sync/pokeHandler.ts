import { queryClient } from "@/store/queryClient";
import { WS_POKE_TYPES } from "@/store/sync/sync.constants";

import type { WSPoke } from "@/store/sync/sync.types";
import type { DownloadJob } from "@/job/job.types";


export function handleWSPoke(poke: WSPoke): void {
    const { type, payload } = poke;

    console.log(`WebSocket sync handling ${type}`, payload || "");

    switch (type) {
        case WS_POKE_TYPES.DOWNLOAD_JOB_SUCCESS:
            queryClient.invalidateQueries({ queryKey: ["tracks"] });

            //implement slight optimistic updates by replacing job states within cache
            const updatedJob = payload as DownloadJob;
            queryClient.setQueryData<DownloadJob[]>(["jobs", "downloads"], (old = []) => {
                const exists = old.find(j => j.id === updatedJob.id);
                if (exists) {
                    return old.map(j => j.id === updatedJob.id ? updatedJob : j);
                }
                return old;
            });
            break;

        default:
            console.warn(`WebSocket sync unhandled poke type: ${type}`);
    }
}