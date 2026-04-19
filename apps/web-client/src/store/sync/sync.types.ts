import type { WS_POKE_TYPES } from "@/store/sync/sync.constants";

export type WSPokeType = typeof WS_POKE_TYPES[keyof typeof WS_POKE_TYPES];

export interface WSPoke {
    type: WSPokeType;
    payload: any;
}
