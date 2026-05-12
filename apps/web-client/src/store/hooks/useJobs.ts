import { useQuery } from "@tanstack/react-query"

import type { JobBase } from "@/job/job.types";


export const useJobs = () => {
    const queryKey = ["jobs"];
    
    //fetch jobs
    const getJobs = useQuery({
        queryKey,
        queryFn: async () => {
            console.log("useJobs triggered");

            const response = await fetch(`/jobs`, { method: "GET" });
            if (!response.ok) throw new Error("Failed to fetch jobs");
            
            const data = await response.json();
            return data.jobs as JobBase[];
        },
        staleTime: 1000 * 60 * 5, 
    });

    return {
        jobs: getJobs.data ?? [],
        isProcessing: getJobs.data?.some(j => j.status === "Processing"),
        refetch: getJobs.refetch,
        isLoading: getJobs.isLoading,
        error: getJobs.error,
    };
};

    