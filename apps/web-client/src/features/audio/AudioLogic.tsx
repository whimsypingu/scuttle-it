import { useQueue } from "@/store/hooks/useQueue";
import { useSettings } from "@/store/hooks/useSettings";
import { useEffect } from "react";

import { audioEngine } from "./audioEngine";
import { getTrackDisplayMetadata } from "@/model/model.utils";
import { useAudioPlayback } from "./useAudioEngine";

import defaultMediaSessionLogo from "@/assets/defaultMediaSessionLogo.png";

export const AudioLogic = () => {
    const { queue, pop, reorder } = useQueue(); //get the latest queue from tanstack
    const { settings } = useSettings();
    
    //current track
    const currentTrack = queue?.[0];
    const nextTrack = queue?.[1];
    const lastTrack = queue?.at(-1);
    
    console.log(`[AudioLogic] Current track: ${currentTrack}`);
    
    //autoplay logic
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
                    } else {
                        audioEngine.clear();
                    }
                    break;
                
                case 1: //loop all
                    if (queue.length > 1 && nextTrack && lastTrack) {
                        const newTargetPosition = lastTrack.position + 1;
                        reorder({ queueTrack: currentTrack, targetPosition: newTargetPosition }); //replace with reorder to end
                        audioEngine.playTrack({ trackId: nextTrack.id, forceRestart: true }) //play
                    } else {
                        audioEngine.playTrack({ trackId: currentTrack.id, forceRestart: true }) //play
                    }
                    break;

                case 2: //loop one
                    audioEngine.playTrack({ trackId: currentTrack.id, forceRestart: true }) //play
                    break;
            }
        });

        return unsubscribe; //clean up the listener
    }, [currentTrack?.queueId, settings.loopmode]);


    const { isPaused } = useAudioPlayback(); //hook into playstate

    //mediaSession
    useEffect(() => {
        if (!("mediaSession" in navigator) || !currentTrack) return;

        //get and update mediaSession metadata
        const { 
            titleDisplay: currentTitle,
            artistDisplay: currentArtist
        } = getTrackDisplayMetadata(currentTrack);
    
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTitle,
            artist: currentArtist,
            album: "Scuttle",
            artwork: [
                {
                    src: defaultMediaSessionLogo,
                    sizes: "512x512",
                    type: "image/png"
                }
            ]
        });

        navigator.mediaSession.playbackState = isPaused ? "paused" : "playing";
    }, [currentTrack, isPaused]); //trigger whenever currentTrack or play state changes

    return null;
};
