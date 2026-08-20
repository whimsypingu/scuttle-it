import { useAuth } from "@/store/hooks/useAuth";
import React from "react";
import { LoginScreen } from "./LoginScreen";


/**
 * AuthGate.tsx
 */

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
    const { loginSuccess, isAuthLoading } = useAuth();

    if (!loginSuccess) {
        return (
            <>
            <LoginScreen />
            </>
        );
    }

    return (
        <>
        {children}
        </>
    );
}

