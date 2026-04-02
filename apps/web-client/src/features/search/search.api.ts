import type { TrackBase } from "@/model/model.types";
import { makeSafeApiTrackBase } from "@/model/model.utils";

export const SearchAPI = {
    searchDatabase: async (
        q: string,
        signal?: AbortSignal
    ): Promise<TrackBase[]> => {
        const response = await fetch(`/search/db-search?q=${encodeURIComponent(q)}`, { signal, method: "GET" });
        if (!response.ok) throw new Error("Database search failed");

        const rawData = await response.json();
        console.log(rawData);

        const results = rawData.results; //extract from { count: , results: }
        return results.map(makeSafeApiTrackBase); //convert to a list of TrackBases
    },

    searchYouTube: async (
        q: string,
        signal?: AbortSignal
    ): Promise<string> => {
        const response = await fetch(`/search/yt-search?q=${encodeURIComponent(q)}`, { signal, method: "POST" });
        if (!response.ok) throw new Error("YouTube search failed");

        const rawData = await response.json();
        console.log(rawData);

        const jobId = rawData.job_id;
        return jobId;
    }
};
