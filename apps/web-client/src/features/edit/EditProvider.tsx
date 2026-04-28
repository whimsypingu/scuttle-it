import React, { createContext, useContext, useState } from "react";

import type { EditContextValue, EditTarget } from "@/features/edit/edit.types";


/**
 * EditProvider.tsx
 * * Provides a global state for the currently active "Edit Target" (e.g., a Track or Artist or Playlist).
 * This allows any component in the app to trigger an edit popup by setting the target and eliminating prop drilling.
 */

const EditContext = createContext<EditContextValue | undefined>(undefined);

export const useEditTarget = () => {
    const context = useContext(EditContext);
    if (context === undefined) {
        throw new Error("useEdit must be used within an EditProvider");
    }
    return context;
}

export const EditProvider = ({ children }: { children: React.ReactNode }) => {
    const [editTarget, setEditTarget] = useState<EditTarget>(null);

    return (
        <EditContext.Provider value={{ editTarget, setEditTarget }}>
            {children}
        </EditContext.Provider>
    );
}

