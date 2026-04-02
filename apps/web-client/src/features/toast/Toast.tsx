import { Toaster } from "@/components/ui/sonner";

import { BOTTOM_SHELF } from "@/features/player/player.constants";

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
        />
    )
}