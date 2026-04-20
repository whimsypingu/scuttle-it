import { handleWSPoke } from '@/store/sync/pokeHandler';
import { MIN_RECONNECT_DELAY, MAX_RECONNECT_DELAY, WEBSOCKET_CLOSE_CODE, RECONNECT_DELAY_FACTOR } from '@/store/sync/sync.constants';

import type { WSPoke } from '@/store/sync/sync.types';


let socket: WebSocket | null = null;
let reconnectDelay: number = MIN_RECONNECT_DELAY; //starting delay, increased by exponential backoff on failure

/**
 * Initializes the WebSocket connection if required with reconnection logic and returns the WebSocket connection.
 * @returns socket
 */
export function getWebSocket(): WebSocket | null {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("WebSocket already connected");
        return socket;
    };

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"; //use wss if https, otherwise ws for http
    const host = window.location.host; // includes hostname + port
    const wsUrl = `${protocol}//${host}/websocket`;

    socket = new WebSocket(wsUrl); //ex. "ws://localhost:8000/websocket");

    socket.onopen = () => {
        console.log("WebSocket connected");
        reconnectDelay = MIN_RECONNECT_DELAY; //reset
    };

    socket.onmessage = (event: MessageEvent) => {
        try {
            const poke = JSON.parse(event.data) as WSPoke;
            console.log(poke); //

            handleWSPoke(poke);
        } catch (err) {
            console.log("WebSocket parse error:", err);
        }
    };

    socket.onclose = (event) => {
        socket = null;
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);

        if (event.code !== WEBSOCKET_CLOSE_CODE) { //only on an unexpected closure retry connection
            console.log(`WebSocket reconnecting in ${reconnectDelay}ms`);
            setTimeout(getWebSocket, reconnectDelay);

            //exponential backoff
            reconnectDelay = Math.min(reconnectDelay * RECONNECT_DELAY_FACTOR, MAX_RECONNECT_DELAY);
        }
    };

    socket.onerror = (err) => {
        console.log("WebSocket error:", err);
    };

    return socket;
}


/**
 * Cleanly closes the socket, with a specific closure Code to prevent the onclose backoff from firing
 */
export function destroyWebSocket(): void {
    if (socket) {
        console.log("WebSocket destroying connection");

        //set handlers to null
        socket.onopen = null;
        socket.onmessage = null;
        socket.onclose = null;
        socket.onerror = null;
        socket.close(WEBSOCKET_CLOSE_CODE); //normal closure
        socket = null;
    }
}

