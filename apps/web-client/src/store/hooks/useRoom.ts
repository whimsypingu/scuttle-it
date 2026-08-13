import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { makeToast } from "@/features/toast/Toast";
import { audioEngine } from "@/features/audio/audioEngine";
import { getOrDefaultRoomId, setRoomId, scuttleFetch, getOrCreateDeviceId } from "@/lib/utils";
import { getWebSocket } from "@/store/sync/websocket";

import type { CreateJoinRoomResponse } from "@/store/hooks/hooks.responses";


export const useRoom = () => {
    const queryClient = useQueryClient();
    const queryKey = ["room"];
    
    //fetch jobs
    const getRoom = useQuery({
        queryKey,
        queryFn: async () => {
            const roomId = await getOrDefaultRoomId();
            return roomId;
        },
        staleTime: Infinity, //only stale when mutated
    });

    //change room
    const handleRoomChange = async (data: CreateJoinRoomResponse) => {
        await setRoomId(data.roomId);

        queryClient.setQueryData(queryKey, data.roomId); //set the active room id in tanstack cache
        audioEngine.clear();
        audioEngine.setMain(data.isMain);
        queryClient.refetchQueries({ queryKey: ["tracks", "play_queue" ] }); //reset audio and queue state

        //clean up url state without forcing a full page reload
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("n");
        newUrl.searchParams.delete("s"); //strip only the room change parameters
        window.history.replaceState(
            {}, 
            document.title, 
            newUrl.pathname + newUrl.search + newUrl.hash
        );

        //reconnect websocket connection
        const deviceId = await getOrCreateDeviceId();
        getWebSocket(data.roomId, deviceId);
    };

    //request a new room
    const createRoomMutation = useMutation({
        mutationFn: async () => {
            const response = await scuttleFetch(`/room/create`, {
                method: "POST",
            });
            if (!response.ok) throw new Error("Failed to create room");

            const data = await response.json();
            return data as CreateJoinRoomResponse;
        },
        onSuccess: async (data) => {
            await handleRoomChange(data);

            //debug
            const printout = `${data.roomId} ${data.isMain}`;
            console.log(printout);
            makeToast("New Room: ", printout);
        }
    });

    //join a room
    const joinRoomMutation = useMutation({
        mutationFn: async (roomId: string) => {
            const trimmedRoomId = roomId.trim();
            if (!trimmedRoomId) throw new Error("Join code cannot be empty");

            const response = await scuttleFetch(`/room/join/${trimmedRoomId}`, {
                method: "GET",
            });
            if (!response.ok) throw new Error("Failed to join room");

            const data = await response.json();
            return data as CreateJoinRoomResponse;
        },
        onSuccess: async (data) => {
            await handleRoomChange(data);

            //debug
            const printout = `${data.roomId} ${data.isMain}`;
            console.log(printout);
            makeToast("Joined Room: ", printout);
        }
    });

    return {
        roomId: getRoom.data,
        createRoom: createRoomMutation.mutate,
        joinRoom: joinRoomMutation.mutate,
        joinRoomAsync: joinRoomMutation.mutateAsync,
    };
};

    