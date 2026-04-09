import type { Loopmode } from "@/settings/settings.types";

export const cycleLoopmode = (current: Loopmode): Loopmode => {
    return ((current + 1) % 3) as Loopmode;
};