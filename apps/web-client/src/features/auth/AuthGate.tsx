import React from "react";
import { useAuth } from "@/store/hooks/useAuth";

import { Toast } from '@/features/toast/Toast';
import { LoginScreen } from "@/features/auth/LoginScreen";


/**
 * AuthGate.tsx
 */

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
    const { isAuth, isAuthLoading } = useAuth();

    if (!isAuth) {
        return (
            <>
            <LoginScreen />
            <Toast isExpanded={true} />
            </>
        );
    }

    return (
        <>
        {children}
        </>
    );
}

