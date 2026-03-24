import React from 'react';

interface MainLayoutProps {
    children: React.ReactNode;
    PlayerElement: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
    return (
    <div className="flex flex-col h-dvh bg-surface overflow-hidden">

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-30">
            {children}
        </main>

        {/* Persistent Player Area */}
        {/* <footer className="fixed bottom-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
            <div className="pointer-events-auto">
            {PlayerElement}
            </div>
            <div className="h-12 flex justify-around items-center text-zinc-500 text-xs">
                <span>Home</span>
                <span>Search</span>
                <span className="text-white">Library</span>
            </div>
        </footer> */}
    </div>
    );
};