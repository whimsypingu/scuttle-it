import React, { createContext, useContext, useState } from "react";
import type { EditContextValue, EditTarget } from "@/features/edit/edit.types";


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

