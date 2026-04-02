import type { TrackBase } from "@/model/model.types";
import { mapTrackBase } from "@/model/model.utils";

export const SearchAPI = {
    searchDatabase: async (
        q: string,
        signal?: AbortSignal
    ): Promise<TrackBase[]> => {
        const response = await fetch(`/search/db-search?q=${encodeURIComponent(q)}`, { signal });
        if (!response.ok) throw new Error("Search failed");

        const rawData = await response.json();
        console.log(rawData);

        const results = rawData.results; //extract from { count: , results: }
        return results.map((track: any) => mapTrackBase(track)); //convert to a list of TrackBases
    }
};
