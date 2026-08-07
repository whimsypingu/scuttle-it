import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { makeToast } from "@/features/toast/Toast";
import { audioEngine } from "@/features/audio/audioEngine";
import { getOrDefaultSessionId, setSessionId, scuttleFetch } from "@/lib/utils";

import type { CreateSessionResponse } from "@/store/hooks/hooks.responses";


export const useSession = () => {
    const queryClient = useQueryClient();
    const queryKey = ["session"];
    
    //fetch jobs
    const getSession = useQuery({
        queryKey,
        queryFn: async () => {
            const sessionId = await getOrDefaultSessionId();
            return sessionId;
        },
        staleTime: Infinity, //only stale when mutated
    });

    //request a new session
    const createSessionMutation = useMutation({
        mutationFn: async () => {
            const response = await scuttleFetch(`/session/create`, {
                method: "POST",
            });
            if (!response.ok) throw new Error("Failed to create session");

            const data = await response.json();
            return data as CreateSessionResponse;
        },
        onSuccess: async (data) => {
            await setSessionId(data.sessionId);

            queryClient.setQueryData(queryKey, data.sessionId); //set the active session id in tanstack cache
            audioEngine.clear();
            queryClient.removeQueries({ queryKey: ["tracks", "play_queue" ] }); //reset audio and queue state

            //clean up url state without forcing a full page reload
            window.history.replaceState({}, document.title, "/");
            makeToast("", "New Session");
        }
    });

    return {
        sessionId: getSession.data,
        createSession: createSessionMutation.mutate,
    };
};

    