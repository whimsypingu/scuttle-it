import { motion } from "framer-motion";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

import { BOTTOM_SHELF, PLAYER_CONFIG } from "@/features/player/player.constants";
import { toastBaseStyle } from "@/features/toast/toast.constants";

import type { ToastProps } from "@/features/toast/toast.types";


export const Toast = ({ isExpanded }: ToastProps) => {
    const minimumOffset = PLAYER_CONFIG.marginBottom; //minimum required offset
    const liftAmount = BOTTOM_SHELF.totalHeight; //how much to lift the toasts by when the player is closed

    // const dynamicOffset = isExpanded ? minimumOffset : (minimumOffset + liftAmount);
    
    // return (
    //     <Toaster 
    //         position="bottom-center"
    //         offset={dynamicOffset}
    //         mobileOffset={dynamicOffset}
    //         visibleToasts={1}
    //         toastOptions={{
    //             style: {
    //                 zIndex: isExpanded ? 40 : 60
    //             }
    //         }}
    //     />
    // );

    return (
        <motion.div
            initial={false}
            animate={{
                y: isExpanded ? 0 : -(liftAmount),
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
                // zIndex: 9999, //isExpanded ? 40 : 60 
                pointerEvents: "none",
            }} // sandwiches the zIndex of the GlobalPlayer so it hides behind the MiniView but is still above the ExpandedView
        >
            <Toaster 
                position="bottom-center"
                offset={minimumOffset}
                mobileOffset={minimumOffset}
                visibleToasts={1}
            />
        </motion.div>
    );
}

// makeToast wrapper
const makeToastBase = (msg: string) => {
    toast(msg);
}
//makeToastBase.error = (msg: string) => {} //specialized versions

export const makeToast = makeToastBase; //export single makeToast with default message version
