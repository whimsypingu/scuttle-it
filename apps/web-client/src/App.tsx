import { lazy, Suspense, useEffect, useState } from 'react'

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, persister } from '@/store/queryClient';

import { MainLayout } from '@/features/player/MainLayout';

import { OfflineProvider } from '@/features/offline/OfflineProvider';
import { AuthGate } from '@/features/auth/AuthGate';

import { NavBar } from '@/features/player/NavBar';
import { Toast } from '@/features/toast/Toast';

import type { Tab } from '@/features/player/player.types';
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

			console.log("[App.tsx] Preloading all tabs in the background for offline caching.");
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
		<OfflineProvider>
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={{
				persister,
				dehydrateOptions: {
					shouldDehydrateQuery: (query) => {
						if (query.queryKey[0] === "auth") return false;
						return query.state.status === "success";
					}
				},
				maxAge: 1000 * 60 * 60 * 24 * 7, //7 days cache validity
				buster: "persister-v1", //dev
			}}
		>
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
		</PersistQueryClientProvider>
		</OfflineProvider>
	);
}

export default App
