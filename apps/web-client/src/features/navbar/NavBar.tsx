import { Home, Search, Library, User } from 'lucide-react';
import { NAV_CONFIG } from '@/constants/layout';

export const NavBar = () => {
    return (
        /* The 'bottom-[-40px]' and extra height handle the iOS 'void' bleed.
        We use 'pt-3' to push the icons to the top of the visible area.
        */
        <nav 
            className="fixed bottom-0 left-0 right-0 z-40 bg-panel border-t border-white/5"
            style={{ height: `${NAV_CONFIG.height}px` }}
        >
            <div className="flex justify-around items-start h-full px-4 pt-3">
                <NavItem icon={<Home size={20} />} active />
                <NavItem icon={<Search size={20} />} />
                <NavItem icon={<Library size={20} />} />
                <NavItem icon={<User size={20} />} />
            </div>
        </nav>
    );
};

// Internal Helper for consistency
const NavItem = ({ icon, active = false }: { icon: React.ReactNode, active?: boolean }) => (
    <button className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-white' : 'text-zinc-500 active:text-zinc-300'}`}>
        {icon}
    </button>
);