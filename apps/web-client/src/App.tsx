import { useState } from 'react'

import { MainLayout } from '@/layouts/MainLayout'
import { GlobalPlayer } from '@/features/player/GlobalPlayer';
import { NavBar } from '@/features/navbar/NavBar';

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

function App() {
	const [isExpanded, setIsExpanded] = useState(false);

    return (
    <div className="relative h-dvh w-full overflow-hidden bg-surface">

		{!isExpanded && (
			<>
				<MainLayout>
					<MockLibrary />
				</MainLayout>

				<NavBar />
			</>
		)}

		<GlobalPlayer isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
		
    </div>
    )
}

export default App
