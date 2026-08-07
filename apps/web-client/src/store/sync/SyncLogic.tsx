import { useEffect } from "react";

import { useSession } from "@/store/hooks/useSession";
import { customSessionIdExists } from "@/lib/utils";
import { getWebSocket, destroyWebSocket } from "@/store/sync/websocket";


export const SyncLogic = () => {
    const { createSession } = useSession();

    useEffect(() => {
        //initialize websocket
        getWebSocket();

        //check for ?n=true on startup
        const initSession = async () => {
            const params = new URLSearchParams(window.location.search);
            const forceNewSession = params.get("n") === "true"; //flag indicating that a new session should be created

            if (forceNewSession) {
                createSession();
                return;
            }

            const forceCustomSession = params.has("n"); //flag existence indicates that at the least, this should not be a DEFAULT SESSION
            const sessionExists = await customSessionIdExists(); //check if a custom session already exists

            if (forceCustomSession && !sessionExists) {
                createSession();
                return;
            }
        };
        initSession();

        //clean up websocket
        return () => {
            destroyWebSocket();
        };
    }, [createSession]);

    return null;
};
