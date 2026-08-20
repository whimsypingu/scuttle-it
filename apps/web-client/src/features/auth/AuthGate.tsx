import React from "react";
import { useAuth } from "@/store/hooks/useAuth";

import { Toast } from '@/features/toast/Toast';
import { LoginScreen } from "@/features/auth/LoginScreen";


/**
 * AuthGate.tsx
 */

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
    const { isAuth, isAuthLoading } = useAuth();

    if (!isAuth || isAuthLoading) {
        return (
            <>
            <div className="relative h-dvh w-full overflow-hidden bg-surface">
                <LoginScreen />
                <Toast isExpanded={true} />
            </div>
            </>
        );
    }

    return (
        <>
        {children}
        </>
    );
}

