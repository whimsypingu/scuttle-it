import React, { createContext, useContext, useEffect, useState } from "react";

import type { OfflineContextValue } from "@/features/offline/offline.types";


/**
 * OfflineProvider.tsx
 * * Provides a global state for the whether the app is considered in offline mode or not
 * This should allow any component in the app to trigger an change network behavior by setting offline boolean or not and eliminating prop drilling.
 */

const OfflineContext = createContext<OfflineContextValue | undefined>(undefined);

export const useOffline = () => {
    const context = useContext(OfflineContext);
    if (context === undefined) {
        throw new Error("useOffline must be used within an OfflineProvider");
    }
    return context;
}

export const OfflineProvider = ({ children }: { children: React.ReactNode }) => {
    const [isOffline, setIsOffline] = useState<boolean>(() => !navigator.onLine); //!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <OfflineContext.Provider value={{ isOffline, setIsOffline }}>
            {children}
        </OfflineContext.Provider>
    );
}

