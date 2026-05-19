import { useQuery } from "@tanstack/react-query"

import { DEFAULT_STATS } from "@/features/profile/profile.constants";

import type { UserStats } from "@/features/profile/profile.types";


export const useStats = () => {
    const queryKey = ["profile", "stats"];
    
    //fetch settings
    const { data: stats = DEFAULT_STATS, isLoading, error } = useQuery<UserStats>({
        queryKey,
        queryFn: async () => {
            console.log("useStats triggered");

            const response = await fetch(`/stats/get`, { 
                method: "GET" 
            });
            if (!response.ok) throw new Error("Failed to fetch stats");
            
            const data = await response.json();
            return data.stats as UserStats;
        },
        staleTime: 1000 * 60 * 5, 
    });

    return {
        stats: stats ?? DEFAULT_STATS,
        isLoading,
        error,
    };
};
