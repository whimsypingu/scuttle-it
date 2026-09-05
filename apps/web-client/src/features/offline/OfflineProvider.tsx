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
        const handleOnline = () => setIsOffline((prev) => (prev ? false : prev)); //do not replace if the value hasn't actually changed
        const handleOffline = () => setIsOffline((prev) => (!prev ? true : prev));

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        window.addEventListener("scuttle:online", handleOnline);
        window.addEventListener("scuttle:offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("scuttle:online", handleOnline);
            window.removeEventListener("scuttle:offline", handleOffline);
        };
    }, []);

    return (
        <OfflineContext.Provider value={{ isOffline, setIsOffline }}>
            {children}
        </OfflineContext.Provider>
    );
}

