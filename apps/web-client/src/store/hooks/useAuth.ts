import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { scuttleFetch } from '@/lib/utils';
import { makeToast } from "@/features/toast/Toast";

import type { LoginPayload } from "@/store/hooks/hooks.types";
import type { LoginResponse } from "@/store/hooks/hooks.responses";


export const useAuth = () => {
    const queryClient = useQueryClient();
    const queryKey = ["auth"];

    //fetch auth
    const { data: loginSuccess, isLoading: isAuthLoading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            const response = await scuttleFetch(`/auth/me`, { 
                method: "GET",
            });
            if (!response.ok) throw new Error("Unauthenticated");
            
            const data = await response.json();
            return data;
        },
        retry: false,
        staleTime: Infinity, 
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

    return {
        loginSuccess,
        isAuthLoading,

        login: loginMutation.mutate,
        isLoggingIn: loginMutation.isPending,
    };
};
