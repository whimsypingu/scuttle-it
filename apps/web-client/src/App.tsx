import { lazy, Suspense, useState } from 'react'

import { QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '@/features/player/MainLayout';

import { NavBar } from '@/features/player/NavBar';
import { Toast } from '@/features/toast/Toast';

import type { Tab } from '@/features/player/player.types';
import { queryClient } from '@/store/queryClient';
import { AudioLogic } from '@/features/audio/AudioLogic';


const GlobalPlayer = lazy(() => import('@/features/player/GlobalPlayer').then(m => ({ default: m.GlobalPlayer })));

const MockHome = lazy(() => import('@/features/home/HomeView').then(m => ({ default: m.MockHome })));
const MockSearch = lazy(() => import('@/features/search/SearchView').then(m => ({ default: m.MockSearch })));
const MockLibrary = lazy(() => import('@/features/library/LibraryView').then(m => ({ default: m.MockLibrary })));
const MockProfile = lazy(() => import('@/features/profile/ProfileView').then(m => ({ default: m.MockProfile })));


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

		return (
			<Suspense fallback={<div className="flex-1 bg-surface" />}>
				<TabComponent tabResetSignal={tabResetSignal} />
			</Suspense>
		);
	};

	return (
		<QueryClientProvider client={queryClient}>
			<AudioLogic />
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

				<Suspense fallback={null}>
					<GlobalPlayer isExpanded={isPlayerExpanded} setIsExpanded={setIsPlayerExpanded} />
				</Suspense>
				
				<Toast isExpanded={isPlayerExpanded} />
			</div>
		</QueryClientProvider>
	);
}

export default App
