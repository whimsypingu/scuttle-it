import React, { useEffect } from "react";
import { useAuth } from "@/store/hooks/useAuth";

import { Toast } from '@/features/toast/Toast';
import { LoginScreen } from "@/features/auth/LoginScreen";
import { useOffline } from "@/features/offline/OfflineProvider";


/**
 * AuthGate.tsx
 */

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
    const { isAuth, isAuthLoading } = useAuth();
    const { isOffline, setIsOffline } = useOffline();

    //clean up fallback shell from /index.html once authenticated
    useEffect(() => {
        if (isAuth) { //(isAuth && !isAuthLoading) || isOffline) {
            const shell = document.getElementById("pwa-load-shell");
            shell?.remove();

            console.log(`[AuthGate] Removed shell animation from DOM.`, isAuth, isAuthLoading, isOffline); //debugging: add this: , isAuth, isAuthLoading, isOffline);
        }
    }, [isAuth]); //[isAuth, isAuthLoading, isOffline]);

    //paint the login screen, which should not remove the fallback shell animation yet
    if (!isAuth) { //(!isAuth || isAuthLoading) && !isOffline) {
        return (
            <>
            <div className="relative h-dvh w-full overflow-hidden bg-transparent">
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

