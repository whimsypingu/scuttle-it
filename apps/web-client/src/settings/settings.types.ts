import type { IconProps } from "@phosphor-icons/react";

//all available track actions with their required properties to execute the functions
export type LoopmodeProps = 
    | { loopmode: 0; desc: "None" }
    | { loopmode: 1; desc: "All" }
    | { loopmode: 2; desc: "One" };
export type Loopmode = LoopmodeProps["loopmode"];

export interface Settings {
    loopmode: Loopmode;
}

export interface LoopmodeConfig { //corresponding phosphor icon and color pairing to show for loopmode
    icon: React.ComponentType<IconProps>;
    color: string;
}
