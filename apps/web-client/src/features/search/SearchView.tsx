
export const MockSearch = () => {
    const itemCount = 12;
    const items = Array.from({ length: itemCount }, (_, i) => i + 1);

    return (
        <>
        <h1 className="text-2xl font-bold mb-4">Search</h1>
        <div className="grid grid-cols-2 gap-4">
            {items.map(i => (
                <div key={i} className="bg-card aspect-square rounded-md shadow-lg p-4">
                    <div className="w-full h-3/4 bg-zinc-800 rounded mb-2" />
                    <div className="h-4 w-3/4 bg-zinc-700 rounded" />
                </div>
            ))}
        </div>
        </>
    );
};
