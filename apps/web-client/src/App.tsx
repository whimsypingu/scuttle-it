import { useState } from 'react'

import { MainLayout } from '@/layouts/MainLayout'
import { GlobalPlayer } from '@/features/player/GlobalPlayer';
import { NavBar } from '@/features/player/NavBar';

import type { Tab } from '@/features/player/player.types';

// These will be real components soon!
const MockLibrary = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Your Library</h1>
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
        <div key={i} className="bg-card aspect-square rounded-md shadow-lg p-4">
           <div className="w-full h-3/4 bg-zinc-800 rounded mb-2" />
           <div className="h-4 w-3/4 bg-zinc-700 rounded" />
        </div>
      ))}
    </div>
  </div>
);

// Mock components for different tabs
const MockHome = () => <div className="p-4"><h1 className="text-2xl font-bold">Home View</h1></div>;
const MockSearch = () => <div className="p-4"><h1 className="text-2xl font-bold">Search View</h1></div>;
//const MockLibrary = () => <div className="p-4"><h1 className="text-2xl font-bold">Library View</h1></div>;
const MockProfile = () => <div className="p-4"><h1 className="text-2xl font-bold">Your Profile</h1></div>;

function App() {
	const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
	const [activeTab, setActiveTab] = useState<Tab>("home");

	// Simple helper to render the right content based on tab
    const renderContent = () => {
        switch (activeTab) {
            case 'home': return <MockHome />;
            case 'search': return <MockSearch />;
            case 'library': return <MockLibrary />;
            case 'user': return <MockProfile />;
            default: return <MockHome />;
        }
    };

    return (
    <div className="relative h-dvh w-full overflow-hidden bg-surface">

		{!isPlayerExpanded && (
			<>
				<MainLayout>
					{renderContent()}
				</MainLayout>

				<NavBar
					activeTab={activeTab}
					onTabChange={setActiveTab}
				/>
			</>
		)}

		<GlobalPlayer isExpanded={isPlayerExpanded} setIsExpanded={setIsPlayerExpanded} />
		
    </div>
    )
}

export default App
