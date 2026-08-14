import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { generateUUID } from "@/lib/generate";
import { set, get } from "idb-keyval";


//tailwind boilerplate idk what ts is
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}


// constants to find custom identifiers
const DEVICE_ID_KEY = "scuttle_device_id";
const ROOM_ID_KEY = "scuttle_room_id";

const DEFAULT_ROOM_ID = "000"; //see schema initialization description in /audio-server

/**
 * Retrieves an existing unique device ID from indexeddb or creates a persistent one
 * @returns Custom UUID representing unit information
 */
export async function getOrCreateDeviceId(): Promise<string> {
    let deviceId = await get<string>(DEVICE_ID_KEY);

    //fallback generation
    if (!deviceId) {
        deviceId = generateUUID();
        await set(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
}

/**
 * Handles getting and setting the persistent room ID and accompanying methods
 * @returns Custom UUID
 */
export async function getOrDefaultRoomId(): Promise<string> {
    let roomId = await get<string>(ROOM_ID_KEY);

    //fallback
    if (!roomId) {
        roomId = DEFAULT_ROOM_ID;
        await set(ROOM_ID_KEY, roomId);
    }

    return roomId;
}
export async function setRoomId(roomId: string): Promise<string> {
    await set(ROOM_ID_KEY, roomId);
    return roomId;
}
export async function customRoomIdExists(): Promise<boolean> {
    let roomId = await get<string>(ROOM_ID_KEY);
    return Boolean(roomId && roomId !== DEFAULT_ROOM_ID);
}



/**
 * Custom fetch wrapper that automatically attaches device context headers.
 */
export async function scuttleFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const deviceId = await getOrCreateDeviceId();
    const roomId = await getOrDefaultRoomId();

    // debug
    // console.log("device, room ids:", deviceId, roomId);

    const headers = new Headers(init.headers);

    headers.set("Scuttle-Device-ID", deviceId);
    headers.set("Scuttle-Room-ID", roomId);

    return fetch(input, {
        ...init,
        headers,
    });
}