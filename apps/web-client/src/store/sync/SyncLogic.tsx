import { useEffect } from "react";
import { getWebSocket, destroyWebSocket } from "@/store/sync/websocket";

export const SyncLogic = () => {
    useEffect(() => {
        getWebSocket();

        return () => {
            destroyWebSocket();
        };
    }, []);

    return null;
};
