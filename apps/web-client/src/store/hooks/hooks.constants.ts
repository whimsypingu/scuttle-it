import { QueueIcon, SortAscendingIcon } from "@phosphor-icons/react";
import type { Sortmode, SortmodeConfig } from "./hooks.types";

//all available sortmodes with their corresponding icons
export const SORTMODE_CONFIG: Record<Sortmode, SortmodeConfig> = {
    0: { 
        icon: QueueIcon, 
        detail: "Manual",
    },
    1: { 
        icon: SortAscendingIcon, //kind of the opposite?
        detail: "Date",
    }
};
