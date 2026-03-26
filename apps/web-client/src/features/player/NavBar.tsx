import { Home, Search, Library, User } from 'lucide-react';
import { NAV_CONFIG } from '@/features/player/player.constants';

import type { NavBarProps } from '@/features/player/player.types';

export const NavBar = ({ activeTab, onTabChange }: NavBarProps) => {
    return (
        <>
        <nav 
            className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-white/5"
            style={{ height: `${NAV_CONFIG.height}px` }}
        >
            <div className="flex justify-around items-start gap-2 h-full px-4 py-0">
                <NavItem 
                    icon={<Home />} 
                    active={activeTab === "home"}
                    onClick={() => onTabChange("home")}
                />
                <NavItem 
                    icon={<Search />} 
                    active={activeTab === "search"}
                    onClick={() => onTabChange("search")}
                />
                <NavItem 
                    icon={<Library />} 
                    active={activeTab === "library"}
                    onClick={() => onTabChange("library")}
                />
                <NavItem 
                    icon={<User />} 
                    active={activeTab === "user"}
                    onClick={() => onTabChange("user")}
                />
            </div>
        </nav>
        </>
    );
};

// Internal Helper for consistency
const NavItem = ({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) => (
    <button 
        className={`
            flex flex-col items-center justify-center gap-1 
            h-full flex-grow
            transition-colors ${active ? 'text-white' : 'text-zinc-500 active:text-zinc-300'}
        `}
        onClick={onClick}
    >
        <div className="h-[50%] aspect-square [&>svg]:w-full [&>svg]:h-full">
            {icon}
        </div>
    </button>
);