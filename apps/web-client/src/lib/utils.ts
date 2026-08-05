import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { generateUUID } from "@/lib/generate";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}


/**
 * Retrieves an existing unique device ID from localStorage, or creates a persistent one
 * @returns Custom UUID representing this device
 */
export function getOrCreateDeviceId(): string {
    const deviceIdKey = "scuttle_device_id";
    let deviceId = localStorage.getItem(deviceIdKey);

    //fallback generation
    if (!deviceId) {
        deviceId = generateUUID(); 
        localStorage.setItem(deviceIdKey, deviceId);
    }
    return deviceId;
}


/**
 * Custom fetch wrapper that automatically attaches device context headers.
 */
export async function scuttleFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const deviceId = getOrCreateDeviceId();

    const headers = new Headers(init.headers);
    if (deviceId) {
        headers.set("Scuttle-Device-ID", deviceId);
    }

    //future-proof: add Scuttle-Session-ID or auth headers later
    //const sessionId = localStorage.getItem("scuttle_session_id");
    //if (sessionId) headers.set("Scuttle-Session-ID", sessionId);

    return fetch(input, {
        ...init,
        headers,
    });
}