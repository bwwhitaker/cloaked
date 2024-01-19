import './App.css';
import GameSpace from './Components/GameSpace';
import React, { useEffect, useState } from 'react';

const MobileErrorMessage = () => {
	return (
		<div>
			<h1>Error: Mobile Devices Not Supported</h1>
			<p>This application is not supported on mobile devices. Please use a desktop or laptop to access the content.</p>
		</div>
	);
};

function App() {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkIfMobile = () => {
			setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)); // Adjust this threshold based on your needs
		};

		// Check on initial mount
		checkIfMobile();

		// Check on window resize
		window.addEventListener('resize', checkIfMobile);

		// Cleanup event listener on component unmount
		return () => {
			window.removeEventListener('resize', checkIfMobile);
		};
	}, []);
	return (
		<div className='App'>
			<div className='App-header'>{isMobile ? <MobileErrorMessage /> : <GameSpace />}</div>
		</div>
	);
}

export default App;
