import { NAV_CONFIG } from "@/features/player/player.constants";

export const MockLibrary = () => {
    const itemCount = 12;
    const items = Array.from({ length: itemCount }, (_, i) => i + 1);

    return (
        <>
        <div 
            className="w-full h-full flex flex-col px-4 overflow-hidden touch-none"
            style={{ paddingBottom: `${NAV_CONFIG.height}px` }}
        >
            {/* HEADER */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md py-4">
                <h1 className="text-2xl font-light">Library</h1>
            </div>

            {/* CONTENT AREA */}
            <div className="grid grid-cols-2 gap-4">
                {items.map(i => (
                    <div key={i} className="bg-card aspect-square rounded-md shadow-lg p-4">
                        <div className="w-full h-3/4 bg-zinc-800 rounded mb-2" />
                        <div className="h-4 w-3/4 bg-zinc-700 rounded" />
                    </div>
                ))}
            </div>
        </div>
        </>
    );
};
