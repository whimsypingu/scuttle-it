import { motion } from "framer-motion";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

import { BOTTOM_SHELF, PLAYER_CONFIG } from "@/features/player/player.constants";
import { TOAST_PADDING_PX } from "@/features/toast/toast.constants";

import type { ToastProps } from "@/features/toast/toast.types";

export const Toast = ({ isExpanded }: ToastProps) => {
    const minimumOffset = PLAYER_CONFIG.marginBottom; //minimum required offset
    const liftAmount = BOTTOM_SHELF.totalHeight; //how much to lift the toasts by when the player is expanded

    return (
        <motion.div
            initial={false}
            animate={{
                y: isExpanded ? 0 : -liftAmount,
            }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 40,
                mass: 1,
            }} // same transition values as GlobalPlayer
            style={{
                zIndex: isExpanded ? 40 : 60 
            }} // sandwiches the zIndex of the GlobalPlayer so it hides behind the MiniView but is still above the ExpandedView
        >
            <Toaster 
                position="bottom-center"
                offset={minimumOffset}
                mobileOffset={minimumOffset}
                visibleToasts={1}
            />            
        </motion.div>
    )
}

export const makeToast = {
    message: (msg: string) => {
        toast(msg, {
            style: {
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",

                padding: `${TOAST_PADDING_PX}px`,

                color: "var(--color-muted-foreground)",
                whiteSpace: "nowrap"
            }
        })
    }
}