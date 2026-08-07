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
            const forceNewSession = params.get("n") === "true";

            //check if a session already exists
            const sessionExists = await customSessionIdExists();

            if (forceNewSession || !sessionExists) {
                createSession();
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
