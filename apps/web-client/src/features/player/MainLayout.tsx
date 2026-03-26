import { NAV_CONFIG } from '@/features/player/player.constants';

import type { MainLayoutProps } from '@/features/player/player.types';

export const MainLayout = ({ children }: MainLayoutProps) => {
    return (
        <>
        <div className="flex flex-col h-dvh bg-background overflow-hidden">

            {/* Scrollable Content Area */}
            <main className={`flex-1 overflow-y-auto no-scrollbar pb-${NAV_CONFIG.height}`}>
                {children}
            </main>
        </div>
        </>
    );
};