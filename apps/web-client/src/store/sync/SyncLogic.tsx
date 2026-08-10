import { useEffect } from "react";

import { useSession } from "@/store/hooks/useSession";
import { customSessionIdExists, getOrDefaultSessionId } from "@/lib/utils";
import { getWebSocket, destroyWebSocket } from "@/store/sync/websocket";


export const SyncLogic = () => {
    const { createSession, joinSessionAsync } = useSession();

    useEffect(() => {
        //initialize websocket
        getWebSocket();

        //check for ?n=true on startup
        const initSession = async () => {
            const params = new URLSearchParams(window.location.search);

            const forceNewSession = params.has("n"); //force a new session with a ?n flag
            if (forceNewSession) {
                console.log("[SyncLogic] Force creating new session");
                createSession();
                return;
            }

            const joinCode = params.get("s")?.trim(); //join a session with the ?s=ABCD flag
            if (joinCode) {
                try {
                    console.log(`[SyncLogic] Joining session: ${joinCode}`);
                    await joinSessionAsync(joinCode);
                    return; //successful
                } catch (err) {
                    console.log(`[SyncLogic] Failed to join session ${joinCode}, creating new session`);
                    createSession();
                    return;
                }
            }

            const sessionExists = await customSessionIdExists(); //check if a custom session already exists
            if (sessionExists) {
                const existingSessionId = await getOrDefaultSessionId();
                try {
                    console.log(`[SyncLogic] Joining existing cached session: ${existingSessionId}`);
                    await joinSessionAsync(existingSessionId);
                    return; //success
                } catch (err) {
                    console.log(`[SyncLogic] Failed to join existing cached session ${existingSessionId}, creating new session`);
                    createSession(); //stored session was purged, so create a new one
                    return;
                }
            }

            console.log(`[SyncLogic] Joining default session`);
            const defaultSessionId = await getOrDefaultSessionId();
            await joinSessionAsync(defaultSessionId);
        };
        initSession();

        //clean up websocket
        return () => {
            destroyWebSocket();
        };
    }, [createSession]);

    return null;
};
