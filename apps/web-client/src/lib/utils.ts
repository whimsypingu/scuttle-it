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
const SESSION_ID_KEY = "scuttle_session_id";

const DEFAULT_SESSION_ID = "000"; //see schema initialization description in /audio-server

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
 * Handles getting and setting the persistent session ID and accompanying methods
 * @returns Custom UUID
 */
export async function getOrDefaultSessionId(): Promise<string> {
    let sessionId = await get<string>(SESSION_ID_KEY);

    //fallback
    if (!sessionId) {
        sessionId = DEFAULT_SESSION_ID;
        await set(SESSION_ID_KEY, sessionId);
    }

    return sessionId;
}
export async function setSessionId(sessionId: string): Promise<string> {
    await set(SESSION_ID_KEY, sessionId);
    return sessionId;
}
export async function customSessionIdExists(): Promise<boolean> {
    let sessionId = await get<string>(SESSION_ID_KEY);
    return Boolean(sessionId && sessionId !== DEFAULT_SESSION_ID);
}



/**
 * Custom fetch wrapper that automatically attaches device context headers.
 */
export async function scuttleFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const deviceId = await getOrCreateDeviceId();
    const sessionId = await getOrDefaultSessionId();

    // debug
    // console.log("device, session ids:", deviceId, sessionId);

    const headers = new Headers(init.headers);

    headers.set("Scuttle-Device-ID", deviceId);
    headers.set("Scuttle-Session-ID", sessionId);

    return fetch(input, {
        ...init,
        headers,
    });
}