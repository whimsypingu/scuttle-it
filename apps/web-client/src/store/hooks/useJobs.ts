import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query"

import type { DownloadJob } from "@/job/job.types";


export const useDownloadJobs = () => {
    const queryKey = ["jobs"];
    
    //fetch jobs
    const { data, refetch, isLoading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            console.log("useJobs triggered");

            const response = await fetch(`/jobs/search-and-downloads`, { method: "GET" });
            if (!response.ok) throw new Error("Failed to fetch jobs");
            
            const data = await response.json();
            return data.jobs as DownloadJob[];
        },
        staleTime: 1000 * 60 * 5, 
    });

    //prevent re-calculations for these bools
    const { isPending, isProcessing } = useMemo(() => {
        return {
            isPending: data?.some(j => j.status === "pending") ?? false,
            isProcessing: data?.some(j => j.status === "processing") ?? false,
        };
    }, [data]);

    return {
        jobs: data ?? [],
        isPending,
        isProcessing,
        refetch,
        isLoading,
        error,
    };
};

    