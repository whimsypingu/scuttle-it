import { useEffect } from "react";

import { useRoom } from "@/store/hooks/useRoom";
import { customRoomIdExists, getOrCreateDeviceId, getOrDefaultRoomId } from "@/lib/utils";
import { getWebSocket, destroyWebSocket } from "@/store/sync/websocket";


export const SyncLogic = () => {
    const { createRoom, joinRoomAsync } = useRoom();

    //check for ?n=true on startup
    const initRoom = async (): Promise<void> => {
        const params = new URLSearchParams(window.location.search);

        const forceNewRoom = params.has("n"); //force a new room with a ?n flag
        if (forceNewRoom) {
            console.log("[SyncLogic] Force creating new room");
            createRoom();
            return;
        }

        const joinCode = params.get("s")?.trim(); //join a room with the ?s=ABCD flag
        if (joinCode) {
            try {
                console.log(`[SyncLogic] Joining room: ${joinCode}`);
                await joinRoomAsync(joinCode);
                return; //successful
            } catch (err) {
                console.log(`[SyncLogic] Failed to join room ${joinCode}, creating new room`);
                createRoom();
                return;
            }
        }

        const roomExists = await customRoomIdExists(); //check if a custom room already exists
        if (roomExists) {
            const existingRoomId = await getOrDefaultRoomId();
            try {
                console.log(`[SyncLogic] Joining existing cached room: ${existingRoomId}`);
                await joinRoomAsync(existingRoomId);
                return; //success
            } catch (err) {
                console.log(`[SyncLogic] Failed to join existing cached room ${existingRoomId}, creating new room`);
                createRoom(); //stored room was purged, so create a new one
                return;
            }
        }

        console.log(`[SyncLogic] Joining default room`);
        const defaultRoomId = await getOrDefaultRoomId();
        await joinRoomAsync(defaultRoomId);
    };

    useEffect(() => {

        const startSync = async () => {
            await initRoom();

            const roomId = await getOrDefaultRoomId();
            const deviceId = await getOrCreateDeviceId();

            getWebSocket(roomId, deviceId);
        };

        startSync();

        //clean up websocket
        return () => {
            destroyWebSocket();
        };
    }, [createRoom]);

    return null;
};
