import { Home, Search, Library, User } from 'lucide-react';
import { NAV_CONFIG } from '@/features/player/player.constants';

export const NavBar = () => {
    return (
        /* The 'bottom-[-40px]' and extra height handle the iOS 'void' bleed.
        We use 'pt-3' to push the icons to the top of the visible area.
        */
        <nav 
            className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-white/5"
            style={{ height: `${NAV_CONFIG.height}px` }}
        >
            <div className="flex justify-around items-start gap-2 h-full px-4 py-0">
                <NavItem icon={<Home />} active />
                <NavItem icon={<Search />} />
                <NavItem icon={<Library />} />
                <NavItem icon={<User />} />
            </div>
        </nav>
    );
};

// Internal Helper for consistency
const NavItem = ({ icon, active = false }: { icon: React.ReactNode, active?: boolean }) => (
    <button className={`
        flex flex-col items-center justify-center gap-1 
        h-full flex-grow
        transition-colors ${active ? 'text-white' : 'text-zinc-500 active:text-zinc-300'}
    `}>
        <div className="h-[50%] aspect-square [&>svg]:w-full [&>svg]:h-full">
            {icon}
        </div>
    </button>
);