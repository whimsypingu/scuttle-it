import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

import { BOTTOM_SHELF } from "@/features/player/player.constants";
import { TOAST_PADDING_PX } from "@/features/toast/toast.constants";

export const Toast = () => {
    return (
        <Toaster 
            position="bottom-center"
            offset={{
                bottom: `${BOTTOM_SHELF.totalHeightWithMargins}px`
            }}
            mobileOffset={{
                bottom: `${BOTTOM_SHELF.totalHeightWithMargins}px`
            }}
            visibleToasts={1}
            style={{
                zIndex: 50,
            }}
        />
    )
}

export const makeToast = {
    message: (msg: string) => {
        //toast(msg);
        toast(msg, {
            // unstyled: true,
            // className: `
            //     flex items-center
            //     bg-[var(--color-panel)]
            //     rounded-[var(--radius-md)]
            //     text-[var(--color-muted-foreground)]
            //     text-xs font-medium
            //     whitespace-nowrap
            //     shadow-2xl
            // `,
            style: {
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",

            //     backgroundColor: "var(--color-panel)",
            //     borderRadius: "var(--radius-md)",
                padding: `${TOAST_PADDING_PX}px`,

                color: "var(--color-foreground)",
            //     fontSize: "13px",
            //     fontWeight: "500",
            //     whiteSpace: "nowrap"
            }
        })
    }
}