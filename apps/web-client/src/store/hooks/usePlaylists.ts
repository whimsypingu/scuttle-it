import { useQuery, useQueryClient } from "@tanstack/react-query"

import type { PlaylistBase } from "@/playlist/playlist.types";


export const usePlaylists = () => {
    const queryClient = useQueryClient();
    const queryKey = ["playlists"];
    
    //fetch playlists
    const getPlaylists = useQuery({
        queryKey,
        queryFn: async () => {
            console.log("usePlaylists triggered");

            const response = await fetch(`/playlists/get`, { method: "GET" });
            if (!response.ok) throw new Error("Failed to fetch playlists");
            
            const data = await response.json();
            return data.playlists as PlaylistBase[];
        },
        staleTime: 1000 * 60 * 5, 
    });

    return {
        playlists: getPlaylists.data ?? [],
        refetch: getPlaylists.refetch,
        isLoading: getPlaylists.isLoading,
        error: getPlaylists.error,
    };
};
