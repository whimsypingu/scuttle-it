import { useState, useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export const HoldToDeleteButton = ({ onDelete }: { onDelete: () => void }) => {
    const [isHolding, setIsHolding] = useState(false);
    const controls = useAnimationControls();
    const HOLD_DURATION = 3; //seconds

    useEffect(() => {
        if (isHolding) {
            //start the fill animation
            controls.start({
                width: "100%",
                transition: { duration: HOLD_DURATION, ease: "linear" }
            }).then(() => {
                // If it completes, trigger delete
                if (isHolding) {
                    onDelete();
                }
            });
        } else {
            //reset the fill immediately if let go
            controls.start({ width: "0%", transition: { duration: 0.2 } });
        }
    }, [isHolding, controls, onDelete]);

    return (
        <div className="flex flex-col gap-2 items-center w-full">
            <Button
                variant="secondary"
                className="relative overflow-hidden w-full group border-destructive/20 hover:border-destructive/50 transition-colors"
                onPointerDown={() => setIsHolding(true)}
                onPointerUp={() => setIsHolding(false)}
                onPointerLeave={() => setIsHolding(false)}
            >
                {/* The "Filling" Background */}
                <motion.div
                    initial={{ width: "0%" }}
                    animate={controls}
                    className="absolute left-0 top-0 h-full bg-destructive/80 z-0"
                />

                {/* The Button Content (needs relative z-index to stay above the fill) */}
                <div className="relative z-10 flex items-center gap-2 pointer-events-none select-none">
                    <TrashIcon size={18} weight="bold" className={isHolding ? "animate-bounce" : ""} />
                    <span>{isHolding ? "Hold to Delete..." : "Delete Permanently"}</span>
                </div>
            </Button>
            
            {/* <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-bold">
                Press and hold to confirm
            </p> */}
        </div>
    );
};