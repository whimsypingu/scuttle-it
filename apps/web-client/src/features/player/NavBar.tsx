import { NAV_CONFIG, NAV_ITEMS } from '@/features/player/player.constants';

import type { NavBarProps, NavItemProps } from '@/features/player/player.types';

export const NavBar = ({ activeTab, onTabChange }: NavBarProps)  => {
    return (
        <>
        <nav 
            className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-white/5"
            style={{ height: `${NAV_CONFIG.height}px` }}
        >
            <div className="flex justify-around items-start gap-2 h-full px-4 py-0">
                {NAV_ITEMS.map(({ tab, icon }) => (
                    <>
                    <NavItem
                        key={tab}
                        icon={icon}
                        active={activeTab === tab}
                        onClick={() => onTabChange(tab)}
                    />
                    </>
                ))}
            </div>
        </nav>
        </>
    );
};

// Internal Helper for consistency
const NavItem = ({ icon: IconComponent, active, onClick }: NavItemProps) => (
    <button 
        className={`
            flex flex-col items-center justify-center gap-1 
            h-full flex-grow
            transition-colors ${active ? 'text-white' : 'text-zinc-500 active:text-zinc-300'}
        `}
        onClick={onClick}
    >
        <div className="h-[50%] aspect-square [&>svg]:w-full [&>svg]:h-full">
            <IconComponent strokeWidth={active ? 2.5 : 2} />
        </div>
    </button>
);