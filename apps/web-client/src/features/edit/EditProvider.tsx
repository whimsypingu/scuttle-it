import React, { createContext, useContext, useState } from "react";
import type { TrackBase } from "@/model/model.types";

interface IEditTrackContext {
    editTrack: TrackBase | null;
    setEditTrack: (track: TrackBase | null) => void;
}

const EditTrackContext = createContext<IEditTrackContext | undefined>(undefined);

export const useEditTrack = () => {
    const context = useContext(EditTrackContext);
    if (context === undefined) {
        throw new Error("useEditTrack must be used within an EditTrackProvider");
    }
    return context;
}

export const EditTrackProvider = ({ children }: { children: React.ReactNode }) => {
    const [editTrack, setEditTrack] = useState<TrackBase | null>(null);

    return (
        <EditTrackContext.Provider value={{ editTrack, setEditTrack }}>
            {children}
        </EditTrackContext.Provider>
    );
}

