import React from "react";
import { useAuth } from "@/store/hooks/useAuth";

import { Toast } from '@/features/toast/Toast';
import { LoginScreen } from "@/features/auth/LoginScreen";


/**
 * AuthGate.tsx
 */

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
    const { loginSuccess, isAuthLoading } = useAuth();

    if (!loginSuccess) {
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

