import { useState } from 'react'

import { MainLayout } from '@/features/player/MainLayout';
import { GlobalPlayer } from '@/features/player/GlobalPlayer';
import { NavBar } from '@/features/player/NavBar';

import type { Tab } from '@/features/player/player.types';

import { MockHome } from '@/features/home/HomeView';
import { MockLibrary } from '@/features/library/LibraryView';
import { MockSearch } from '@/features/search/SearchView';

// Mock components for different tabs
const MockProfile = () => <div className="p-4"><h1 className="text-2xl font-bold">Your Profile</h1></div>;

function App() {
	const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
	const [activeTab, setActiveTab] = useState<Tab>("home");
	const [tabResetSignal, setTabResetSignal] = useState(0); //reset tab signal

	const handleTabChange = (newTab: Tab) => {
		if (newTab === activeTab) {
			setTabResetSignal(prev => prev + 1);
		} else {
			setActiveTab(newTab);
		}
	}

	// Simple helper to render the right content based on tab
	const renderContent = () => {
		const TabComponent = {
			home: MockHome,
			search: MockSearch,
			library: MockLibrary,
			user: MockProfile
		}[activeTab] || MockHome

		return <TabComponent tabResetSignal={tabResetSignal} />
	};

	return (
		<div className="relative h-dvh w-full overflow-hidden bg-surface">

			{!isPlayerExpanded && (
				<>
				<MainLayout
					activeTab={activeTab}
					onTabChange={handleTabChange}
				>
					{renderContent()}
				</MainLayout>

				<NavBar
					activeTab={activeTab}
					onTabChange={handleTabChange}
				/>
				</>
			)}

			<GlobalPlayer isExpanded={isPlayerExpanded} setIsExpanded={setIsPlayerExpanded} />
			
		</div>
	)
}

export default App
