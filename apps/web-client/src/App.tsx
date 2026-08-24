import { lazy, Suspense, useEffect, useState } from 'react'

import { QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '@/features/player/MainLayout';

import { OfflineProvider } from '@/features/offline/OfflineProvider';
import { AuthGate } from '@/features/auth/AuthGate';

import { NavBar } from '@/features/player/NavBar';
import { Toast } from '@/features/toast/Toast';

import type { Tab } from '@/features/player/player.types';
import { queryClient } from '@/store/queryClient';
import { AudioLogic } from '@/features/audio/AudioLogic';
import { SyncLogic } from '@/store/sync/SyncLogic';

import { EditPopup } from '@/features/edit/EditPopup';
import { EditProvider } from '@/features/edit/EditProvider';

import { NAV_ITEMS } from '@/features/player/player.constants';

const loadGlobalPlayer = () => import('@/features/player/GlobalPlayer').then(m => ({ default: m.GlobalPlayer }));
const loadHomeTab = () => import('@/features/home/HomeTab').then(m => ({ default: m.HomeTab }));
const loadSearchTab = () => import('@/features/search/SearchTab').then(m => ({ default: m.SearchTab }));
const loadLibraryTab = () => import('@/features/library/LibraryTab').then(m => ({ default: m.LibraryTab }));
const loadProfileTab = () => import('@/features/profile/ProfileTab').then(m => ({ default: m.ProfileTab }));

const GlobalPlayer = lazy(loadGlobalPlayer);
const HomeTab = lazy(loadHomeTab);
const SearchTab = lazy(loadSearchTab);
const LibraryTab = lazy(loadLibraryTab);
const ProfileTab = lazy(loadProfileTab);

// const GlobalPlayer = lazy(() => import('@/features/player/GlobalPlayer').then(m => ({ default: m.GlobalPlayer })));

// const HomeTab = lazy(() => import('@/features/home/HomeTab').then(m => ({ default: m.HomeTab })));
// const SearchTab = lazy(() => import('@/features/search/SearchTab').then(m => ({ default: m.SearchTab })));
// const LibraryTab = lazy(() => import('@/features/library/LibraryTab').then(m => ({ default: m.LibraryTab })));
// const ProfileTab = lazy(() => import('@/features/profile/ProfileTab').then(m => ({ default: m.ProfileTab })));


function App() {
	const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
	const [activeTab, setActiveTab] = useState<Tab>(() => {
		const params = new URLSearchParams(window.location.search);
		const openTab = params.get("tab");
		return NAV_ITEMS.some(item => item.tab === openTab) ? openTab as Tab : "home";
	});
	const [tabResetSignal, setTabResetSignal] = useState(0); //reset tab signal

	const handleTabChange = (newTab: Tab) => {
		if (newTab === activeTab) {
			setTabResetSignal(prev => prev + 1);
		} else {
			setActiveTab(newTab);

			const newUrl = `${window.location.pathname}?tab=${newTab}`;
			window.history.replaceState({ tab: newTab }, '', newUrl);
		}
	}

	// Simple helper to render the right content based on tab
	const renderContent = () => {
		const TabComponent = {
			home: HomeTab,
			search: SearchTab,
			library: LibraryTab,
			profile: ProfileTab
		}[activeTab] || HomeTab;

		return (
			<Suspense fallback={<div className="flex-1 bg-surface" />}>
				<TabComponent tabResetSignal={tabResetSignal} />
			</Suspense>
		);
	};
	
	// preload all tab chunks into browser and sw cache after first paint
	useEffect(() => {
		const preloadAllTabs = async () => {
			if ('serviceWorker' in navigator) {
				await navigator.serviceWorker.ready;
			}

			console.log("PRELOAD ALL TABS TRIGGERED");
			loadGlobalPlayer();
			loadHomeTab();
			loadSearchTab();
			loadLibraryTab();
			loadProfileTab();
		};

		//does not work on safari so workaround with setTimeout: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
		if ('requestIdleCallback' in window) {
			window.requestIdleCallback(preloadAllTabs);
		} else {
			setTimeout(preloadAllTabs, 200);
		}
	}, []);


	return (
		<QueryClientProvider client={queryClient}>
		<OfflineProvider>
		<AuthGate>
			<AudioLogic />
			<SyncLogic />

			<EditProvider>
				<div className="relative h-dvh w-full overflow-hidden bg-surface">

					<MainLayout
						activeTab={activeTab}
						onTabChange={handleTabChange}
					>
						{renderContent()}
					</MainLayout>

					{!isPlayerExpanded && (
						<NavBar
							activeTab={activeTab}
							onTabChange={handleTabChange}
						/>
					)}

					<Suspense fallback={null}>
						<GlobalPlayer isExpanded={isPlayerExpanded} setIsExpanded={setIsPlayerExpanded} />
					</Suspense>
					
					<Toast isExpanded={isPlayerExpanded} />
					
					<EditPopup />
				</div>
			</EditProvider>
		</AuthGate>
		</OfflineProvider>
		</QueryClientProvider>
	);
}

export default App
