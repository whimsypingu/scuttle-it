import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { scuttleFetch } from '@/lib/utils';
import { makeToast } from "@/features/toast/Toast";
import { destroyWebSocket } from "@/store/sync/websocket";

import type { LoginPayload } from "@/store/hooks/hooks.types";
import type { AuthResponse, LoginResponse } from "@/store/hooks/hooks.responses";


export const useAuth = () => {
    const queryClient = useQueryClient();
    const queryKey = ["auth"];

    //fetch auth
    const { data, isLoading, isError } = useQuery({
        queryKey,
        queryFn: async () => {
            const response = await scuttleFetch(`/auth/me`, { 
                method: "GET",
            });
            // console.log(response);
            if (!response.ok) throw new Error("Unauthenticated");
            
            const data = await response.json();
            return data as AuthResponse;
        },
        retry: false,
        staleTime: 1000 * 60 * 30, //30 min purely for checking periodically and syncing frontend jic
        refetchOnWindowFocus: true,
    });

    const loginMutation = useMutation({
        mutationFn: async (payload: LoginPayload) => {
            const response = await scuttleFetch(`/auth/login`, { 
                method: "POST",
                headers: { 
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error("Invalid password");

            const data = await response.json();
            return data as LoginResponse;
        },
        onError: (err) => {
            console.log("Invalid password");
            makeToast("", `Invalid password`);
        },
        onSuccess: (data) => {
            console.log("Valid password");
            queryClient.invalidateQueries({ queryKey }); //triggers refresh of /auth/me
        },
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            const response = await scuttleFetch(`/auth/logout`, {
                method: "POST",
            });
            if (!response.ok) throw new Error("Logout error");

            return true;
        },
        onSettled: () => {
            destroyWebSocket();

            queryClient.clear();
            window.location.href = "/";
            // window.location.replace("/");
            // queryClient.setQueryData(queryKey, { success: false }); //clear auth cache directly
        }
    });

    return {
        isAuth: !isError && data?.success === true, //explicit check
        isAuthLoading: isLoading,

        login: loginMutation.mutate,
        loginAsync: loginMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending,

        logout: logoutMutation.mutate,
    };
};
