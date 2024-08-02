import React, { useState } from 'react';
import { Paper, Button, Snackbar, Alert, AlertTitle } from '@mui/material';
import { styled } from '@mui/material/styles';
import Scanning from './Scanning';
import './GameSpace.css';

function Square(props) {
	const [currentBackgroundColor, setCurrentBackgroundColor] = useState(props.bg);
	const shipLocations = props.shipLocations;
	const [snackbarMessageClick, setSnackbarMessageClick] = useState('');
	const [snackbarSeverity, setSnackbarSeverity] = useState('error');
	const [snackbarTitle, setSnackbarTitle] = useState('Game Over!');
	const hiddenShips = shipLocations
		.sort(function (a, b) {
			return a - b;
		})
		.toString()
		.replace(/,/g, ', ');
	const axis = props.axis;
	const diagonalMode = props.diagonalMode;
	const targeted = props.targeted;
	const [scanDialogueOpen, setScanDialogueOpen] = useState(false);
	const handleClose = (value) => {
		setScanDialogueOpen(!scanDialogueOpen);
		props.handleScanCloakedShip();
	};
	const [currentFontColor, setCurrentFontColor] = useState('black');

	const isInArray = (value, array) => {
		return array.includes(value);
	};

	const updateColors = (backgroundColor, fontColor, delay) => {
		setTimeout(() => {
			setCurrentBackgroundColor(backgroundColor);
			setCurrentFontColor(fontColor);
		}, delay);
	};

	const [scanning, setScanning] = useState(false);
	function showScanning() {
		setScanning(true);
		setTimeout(function () {
			setScanning(false);
		}, 250);
	}

	function SquareClick(id) {
		const clickMode = props.clickMode;
		let a = id - 1;
		let b = id + 1;
		let c = id - axis;
		let d = id + axis;
		let e = id - axis - 1;
		let f = id - axis + 1;
		let g = id + axis - 1;
		let h = id + axis + 1;
		if (clickMode === 'Scan') {
			showScanning();
			props.incrementScanCount();
		}

		if (shipLocations.length === 1) {
			setSnackbarMessageClick(
				`Your scans alerted the enemy and they fired first. The ship was in cell: ${hiddenShips}`
			);
		} else {
			setSnackbarMessageClick(`Your scans alerted the enemy and they fired first. Ships were in cells: ${hiddenShips}`);
		}

		if (isInArray(id, shipLocations) && clickMode === 'Scan' && isInArray(id, targeted)) {
			console.log('first click');
			updateColors('red', 'white', 250);
			props.clearStreak();
			props.removeTargeted(id);
			setScanning(true);
			setTimeout(() => {
				setScanDialogueOpen(true);
			}, 250);
		} else if (isInArray(id, shipLocations) && clickMode === 'Scan' && props.scanCount < 1) {
			setSnackbarTitle('That was lucky!');
			setSnackbarSeverity('info');
			setSnackbarMessageClick(
				`Your first scan found a ship. Since they got startled and fled, we won't reset your streak.`
			);
			updateColors('red', 'white', 250);
			setTimeout(() => {
				setScanDialogueOpen(true);
			}, 250);
		} else if (isInArray(id, shipLocations) && clickMode === 'Scan') {
			updateColors('red', 'white', 250);
			props.clearStreak();
			setTimeout(() => {
				setScanDialogueOpen(true);
			}, 250);
		} else if (clickMode === 'Target') {
			updateColors('green', 'white', 0);
			props.updateTargeted(id);
		} else if (clickMode === 'Unlock' && isInArray(id, targeted)) {
			updateColors('white', 'black', 250);
			props.removeTargeted(id);
		} else if (clickMode === 'Scan' && isInArray(id, targeted)) {
			updateColors('black', 'white', 250);
			props.removeTargeted(id);
		} else if (clickMode === 'Unlock') {
			updateColors('white', 'black', 250);
			props.setClickCount();
		} else if (isInArray(a, shipLocations) && id % axis !== 1) {
			updateColors('blue', 'white', 250);
		} else if (isInArray(b, shipLocations) && id % axis !== 0) {
			updateColors('blue', 'white', 250);
		} else if (isInArray(c, shipLocations)) {
			updateColors('blue', 'white', 250);
		} else if (isInArray(d, shipLocations)) {
			updateColors('blue', 'white', 250);
		} else if (isInArray(e, shipLocations) && e % axis !== 0 && diagonalMode === true) {
			updateColors('blue', 'white', 250);
		} else if (isInArray(f, shipLocations) && f % axis !== 1 && diagonalMode === true) {
			updateColors('blue', 'white', 250);
		} else if (isInArray(g, shipLocations) && g % axis !== 0 && diagonalMode === true) {
			updateColors('blue', 'white', 250);
		} else if (isInArray(h, shipLocations) && h % axis !== 1 && diagonalMode === true) {
			updateColors('blue', 'white', 250);
		} else {
			updateColors('black', 'white', 250);
		}
	}

	const PaperPlace = styled(Paper)(() => ({
		textAlign: 'center',
		fontSize: '15px',
		height: 50,
		width: 50,
		lineHeight: '50px',
		backgroundColor: currentBackgroundColor,
		justifyContent: 'center',
		transition: 'background-color 0.3s ease',
		'&:hover': {
			cursor: 'pointer',
		},
		color: currentFontColor,
	}));

	return (
		<div>
			<PaperPlace
				square
				variant='outlined'
				key={props.title}
				onClick={() => {
					SquareClick(props.title);
				}}
			>
				{' '}
				{scanning ? <Scanning /> : props.title}
			</PaperPlace>

			<Snackbar open={scanDialogueOpen} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
				<Alert variant='filled' severity={snackbarSeverity} onClose={handleClose}>
					<AlertTitle>{snackbarTitle}</AlertTitle>
					<div>{snackbarMessageClick}</div>
					<div className='top-padding'>
						<Button color='inherit' variant='outlined' onClick={handleClose} autoFocus>
							Reset Game
						</Button>
					</div>
				</Alert>
			</Snackbar>
		</div>
	);
}

export default Square;
