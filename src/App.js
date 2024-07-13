import './App.css';
import GameSpace from './Components/GameSpace';
import React from 'react';
import { useEffect, useState } from 'react';

function App() {
	const [orientation, setOrientation] = useState(window.screen.orientation.type);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const handleOrientationChange = () => {
			setOrientation(window.screen.orientation.type);
		};

		const checkIfMobile = () => {
			const userAgent = navigator.userAgent || navigator.vendor || window.opera;
			if (/android/i.test(userAgent) || (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream)) {
				setIsMobile(true);
			} else {
				setIsMobile(false);
			}
		};

		window.screen.orientation.addEventListener('change', handleOrientationChange);
		checkIfMobile();

		return () => {
			window.screen.orientation.removeEventListener('change', handleOrientationChange);
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
