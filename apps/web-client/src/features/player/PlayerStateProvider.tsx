import type { PlayerStateContextValue } from '@/features/player/player.types';
import { createContext, useContext, useState } from 'react';


//ripped from EditContext and EditProvider
const PlayerStateContext = createContext<PlayerStateContextValue | null>(null);

export const usePlayerState = () => {
    const context = useContext(PlayerStateContext);
    if (!context) {
        throw new Error("usePlayerState must be used within a PlayerStateProvider");
    }
    return context;
}

export const PlayerStateProvider = ({ children }: { children: React.ReactNode }) => {
    const [isScrubbing, setIsScrubbing] = useState(false);

    return (
        <PlayerStateContext.Provider value={{ isScrubbing, setIsScrubbing }}>
            {children}
        </PlayerStateContext.Provider>
    );
}
