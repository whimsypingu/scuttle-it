import { queryClient } from "@/store/queryClient";
import { WS_POKE_TYPES } from "@/store/sync/sync.constants";

import type { WSPoke } from "@/store/sync/sync.types";
import type { DownloadJob } from "@/job/job.types";


export function handleWSPoke(poke: WSPoke): void {
    const { type, payload } = poke;

    console.log(`WebSocket sync handling ${type}`, payload || "");

    switch (type) {
        case WS_POKE_TYPES.DOWNLOAD_JOB_STATUS_UPDATE:
            //implement slight optimistic updates by replacing job states within cache
            const updatedJob = payload as DownloadJob;

            if (updatedJob.status === "completed") {
                queryClient.invalidateQueries({ queryKey: ["tracks"] });
            }
            
            queryClient.setQueryData<DownloadJob[]>(["jobs", "downloads"], (old = []) => {
                const currentJobs = old ? [...old] : [];

                const index = old.findIndex(j => j.id === updatedJob.id);
                if (index !== -1) {
                    currentJobs[index] = { ...updatedJob };
                } else {
                    currentJobs.push({ ...updatedJob });
                }

                console.log("CACHE");
                console.log(currentJobs);
                return currentJobs;
            });
            break;

        default:
            console.warn(`WebSocket sync unhandled poke type: ${type}`);
    }
}