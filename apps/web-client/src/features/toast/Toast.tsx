import { motion } from "framer-motion";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

import { BOTTOM_SHELF, PLAYER_CONFIG } from "@/features/player/player.constants";
import { toastCustomStyle } from "@/features/toast/toast.constants";

import type { ToastProps } from "@/features/toast/toast.types";


export const Toast = ({ isExpanded }: ToastProps) => {
    const minimumOffset = PLAYER_CONFIG.marginBottom; //minimum required offset
    const liftAmount = BOTTOM_SHELF.totalHeight; //how much to lift the toasts by when the player is closed

    return (
        <motion.div
            initial={false}
            animate={{
                y: isExpanded ? -(minimumOffset) : -(minimumOffset + liftAmount), //this is the minimumOffset here
                zIndex: isExpanded ? 60 : 40,
            }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 40,
                mass: 1,
            }} // same transition values as GlobalPlayer
            style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                pointerEvents: "none",
            }} // sandwiches the zIndex of the GlobalPlayer so it hides behind the MiniView but is still above the ExpandedView
        >
            <Toaster 
                position="bottom-center"
                offset={0} //ignore the margins on the sides because we handle that within each individual toast for dynamic sizing based on content
                mobileOffset={0} //return this to { left: `${minimumOffset}px`, right... } for margins. see: https://sonner.emilkowal.ski/toaster#customizing-offsets
                visibleToasts={1}
            />
        </motion.div>
    );
}

// makeToast wrapper
const makeToastCustom = (msg: string) => {
    toast(
        <div style={toastCustomStyle}>
            <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block', //required for ellipsis to work on a span, and appy styling again to inner jsx content
            }}>
                {msg}
            </span>
        </div>,
        {
            style: {
                ...toastCustomStyle, //this is the entire toast unit, but doesn't seem to apply text-related css to innards
            }
        }
    );
};
//makeToastBase.error = (msg: string) => {} //specialized versions

export const makeToast = makeToastCustom; //export single makeToast with default message version
