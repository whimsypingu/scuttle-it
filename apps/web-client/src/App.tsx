import { useState } from 'react'

import { AudioProvider } from '@/features/audio/AudioProvider';
import { MainLayout } from '@/features/player/MainLayout';
import { GlobalPlayer } from '@/features/player/GlobalPlayer';
import { NavBar } from '@/features/player/NavBar';
import { Toast } from '@/features/toast/Toast';

import { MockHome } from '@/features/home/HomeView';
import { MockLibrary } from '@/features/library/LibraryView';
import { MockSearch } from '@/features/search/SearchView';
import { MockProfile } from '@/features/profile/ProfileView';

import type { Tab } from '@/features/player/player.types';


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
			profile: MockProfile
		}[activeTab] || MockHome

		return <TabComponent tabResetSignal={tabResetSignal} />
	};

	return (
		<AudioProvider>
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
				
				<Toast />
			</div>
		</AudioProvider>
	)
}

export default App
