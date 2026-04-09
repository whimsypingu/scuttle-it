import { useQueue } from "@/store/hooks/useQueue";
import { useSettings } from "@/store/hooks/useSettings";
import { useEffect } from "react";

import { audioEngine } from "./audioEngine";

export const AudioLogic = () => {
    const { queue, pop } = useQueue(); //get the latest queue from tanstack
    const { settings } = useSettings();
    
    //current track
    const currentTrack = queue?.[0];
    const nextTrack = queue?.[1];
    
    console.log(`[AudioLogic] Current track: ${currentTrack}`);
    
    useEffect(() => {
        if (!currentTrack) return; //no track, dont register a listener
        
        console.log("[AudioLogic] Registering end handler");

        const unsubscribe = audioEngine.on("ended", () => {
            console.log(`[AudioLogic] Handling end for ${currentTrack.title}`);

            switch (settings.loopmode) {
                case 0: //no loop
                    pop(currentTrack);

                    if (nextTrack) {
                        audioEngine.playTrack({ trackId: nextTrack.id, forceRestart: true });
                    }
                    break;
                
                case 1: //loop one
                    audioEngine.seek(0);
                    break;

                case 2: //loop all
                    pop(currentTrack); //replace with reorder to end
                    break;
            }
        });

        return unsubscribe; //clean up the listener
    }, [currentTrack?.queueId, settings.loopmode]);

    return null;
};
