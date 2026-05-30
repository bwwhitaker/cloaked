import './App.css';
import GameSpace from './Components/GameSpace';
import React from 'react';
import { useEffect, useState } from 'react';

function App() {
	// `window.screen.orientation` is unavailable in some browsers (and in the
	// jsdom test environment), so read it defensively and default to an empty
	// string — `orientation.includes(...)` below stays safe either way.
	const [orientation, setOrientation] = useState(window.screen?.orientation?.type ?? '');
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const screenOrientation = window.screen?.orientation;

		const handleOrientationChange = () => {
			setOrientation(screenOrientation?.type ?? '');
		};

		const checkIfMobile = () => {
			const userAgent = navigator.userAgent || navigator.vendor || window.opera;
			if (/android/i.test(userAgent) || (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream)) {
				setIsMobile(true);
			} else {
				setIsMobile(false);
			}
		};

		checkIfMobile();
		screenOrientation?.addEventListener('change', handleOrientationChange);

		return () => {
			screenOrientation?.removeEventListener('change', handleOrientationChange);
		};
	}, []);

	return (
		<div className='App'>
			{isMobile && orientation.includes('landscape') && (
				<div className='orientation-message'>Please rotate your device back to portrait mode.</div>
			)}
			<div className='App-header'>
				<GameSpace />
			</div>
		</div>
	);
}

export default App;
