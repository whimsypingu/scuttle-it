import { useQueue } from "@/store/hooks/useQueue";
import { useSettings } from "@/store/hooks/useSettings";
import { useEffect, useRef } from "react";

import { audioEngine } from "./audioEngine";
import { getTrackDisplayMetadata } from "@/track/track.utils";
import { useAudioPlayback, useBackupSync, usePrefetchSync } from "./useAudioEngine";

export const AudioLogic = () => {
    useBackupSync(); //syncs to server backed queue a few seconds before a track ends to ensure data integrity. in the future we could add a flag for this
    usePrefetchSync();

    const { queue, pop, reorder } = useQueue(); //get the latest queue from tanstack
    const { settings } = useSettings();
    
    //current track
    const currentTrack = queue?.[0];
    const nextTrack = queue?.[1];
    const lastTrack = queue?.at(-1);
    
    console.log(`%c[AudioLogic]%c Current track: ${currentTrack}`, "color: #ff00ff;", "color: inherit;");
    
    //autoplay logic
    const onEndedHandlerRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        onEndedHandlerRef.current = () => {
            console.log(`%c[AudioLogic]%c Executing end logic for: ${currentTrack?.title}`, "color: #ff00ff;", "color: inherit;");
            
            switch (settings.loopmode) {
                case 0: // No loop
                    pop({ queueTrack: currentTrack });
                    if (nextTrack) {
                        audioEngine.playTrack({ trackId: nextTrack.id, forceRestart: true });
                    } else {
                        audioEngine.clear();
                    }
                    break;
                case 1: // Loop all
                    if (queue.length > 1 && nextTrack && lastTrack) {
                        const newTargetPosition = lastTrack.position + 1;
                        reorder({ queueTrack: currentTrack, targetPosition: newTargetPosition }); //replace with reorder to end
                        audioEngine.playTrack({ trackId: nextTrack.id, forceRestart: true }) //play
                    } else {
                        audioEngine.playTrack({ trackId: currentTrack.id, forceRestart: true }) //play
                    }
                    break;
                case 2: // Loop one
                    audioEngine.playTrack({ trackId: currentTrack.id, forceRestart: true });
                    break;
            }        
        };
    }, [currentTrack, nextTrack, lastTrack, settings.loopmode]);

    //attach the listener ONCE on mount
    useEffect(() => {
        console.log("%c[AudioLogic]%c Subscribing to audioEngine ONLY ONCE", "color: #ff00ff;", "color: inherit;");
        
        const unsubscribe = audioEngine.on("ended", () => {
            if (onEndedHandlerRef.current) { // When the event fires, call whatever is currently in the Ref
                onEndedHandlerRef.current();
            }
        });

        return () => {
            console.log("%c[AudioLogic]%c Cleaning up permanent listener", "color: #ff00ff;", "color: inherit;");
            unsubscribe();
        };
    }, []); //runs once and never again


    const { isPaused } = useAudioPlayback(); //hook into playstate

    //mediaSession
    useEffect(() => {
        if (!("mediaSession" in navigator) || !currentTrack) return;

        //get and update mediaSession metadata
        const { 
            titleDisplay: currentTitle,
            artistDisplay: currentArtist
        } = getTrackDisplayMetadata(currentTrack);
    
        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentTitle,
                artist: currentArtist,
                album: "Scuttle",
                artwork: [
                    {
                        src: "/static/defaultMediaSessionLogo.png", //new URL(defaultMediaSessionLogo, window.location.origin).href,
                        sizes: "512x512",
                        type: "image/png"
                    }
                ]
            });
        } catch (err) {
            console.error(`%c[AudioLogic - MediaSession]%c Metadata update failed: ${err}`, "color: #ff00ff;", "color: inherit;");
        }

        // mediaSession functionality
        navigator.mediaSession.setActionHandler("nexttrack", () => {
            if (nextTrack) {
                console.log("%c[AudioLogic - MediaSession]%c Manual skip", "color: #ff00ff;", "color: inherit;");
                pop({ queueTrack: currentTrack });
                audioEngine.playTrack({ trackId: nextTrack.id, forceRestart: true });
            } else {
                console.log("%c[AudioLogic - MediaSession]%c Manual skip but no tracks remaining. Pausing and restarting.", "color: #ff00ff;", "color: inherit;");
                audioEngine.pauseTrack();
                audioEngine.seek(0);
            }
        });

        navigator.mediaSession.setActionHandler("previoustrack", () => {
            console.log("%c[AudioLogic - MediaSession]%c Manual previous", "color: #ff00ff;", "color: inherit;");
            audioEngine.playTrack({ trackId: currentTrack.id, forceRestart: true });
        });

        navigator.mediaSession.setActionHandler("play", () => audioEngine.playTrack({ trackId: currentTrack.id, forceRestart: false }));
        navigator.mediaSession.setActionHandler("pause", () => audioEngine.pauseTrack());

        navigator.mediaSession.playbackState = isPaused ? "paused" : "playing";

        return () => {
            navigator.mediaSession.setActionHandler("nexttrack", null);
            navigator.mediaSession.setActionHandler("previoustrack", null);
            navigator.mediaSession.setActionHandler("play", null);
            navigator.mediaSession.setActionHandler("pause", null);
        };
    }, [currentTrack, nextTrack, isPaused]); //trigger whenever currentTrack or play state changes

    return null;
};
