import React, { useState } from 'react';
import { Paper, Button, Snackbar, Alert, AlertTitle } from '@mui/material';
import { styled } from '@mui/material/styles';

function Square(props) {
	const [currentBackgroundColor, setCurrentBackgroundColor] = useState(props.bg);
	const shipLocations = props.shipLocations;
	const [snackbarMessageClick, setSnackbarMessageClick] = useState('');
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

		if (shipLocations.length === 1) {
			setSnackbarMessageClick('Your scans alerted the enemy and they fired first. The ship was in cell:');
		} else {
			setSnackbarMessageClick('Your scans alerted the enemy and they fired first. Ships were in cells:');
		}

		if (isInArray(id, shipLocations) && clickMode === 'Scan' && isInArray(id, targeted)) {
			setCurrentBackgroundColor('red');
			setCurrentFontColor('white');
			props.removeTargeted(id);
			setTimeout(() => {
				setScanDialogueOpen(true);
			}, 200);
		} else if (isInArray(id, shipLocations) && clickMode === 'Scan') {
			setCurrentBackgroundColor('red');
			setCurrentFontColor('white');
			setTimeout(() => {
				setScanDialogueOpen(true);
			}, 200);
		} else if (clickMode === 'Target') {
			setCurrentBackgroundColor('green');
			setCurrentFontColor('white');
			props.updateTargeted(id);
		} else if (clickMode === 'Unlock' && isInArray(id, targeted)) {
			setCurrentBackgroundColor('white');
			setCurrentFontColor('black');
			props.removeTargeted(id);
		} else if (clickMode === 'Scan' && isInArray(id, targeted)) {
			setCurrentBackgroundColor('black');
			setCurrentFontColor('white');
			props.removeTargeted(id);
		} else if (clickMode === 'Unlock') {
			setCurrentBackgroundColor('white');
			setCurrentFontColor('black');
		} else if (isInArray(a, shipLocations) && id % axis !== 1) {
			setCurrentBackgroundColor('blue');
			setCurrentFontColor('white');
		} else if (isInArray(b, shipLocations) && id % axis !== 0) {
			setCurrentBackgroundColor('blue');
			setCurrentFontColor('white');
		} else if (isInArray(c, shipLocations)) {
			setCurrentBackgroundColor('blue');
			setCurrentFontColor('white');
		} else if (isInArray(d, shipLocations)) {
			setCurrentBackgroundColor('blue');
			setCurrentFontColor('white');
		} else if (isInArray(e, shipLocations) && e % axis !== 0 && diagonalMode === true) {
			setCurrentBackgroundColor('blue');
			setCurrentFontColor('white');
		} else if (isInArray(f, shipLocations) && f % axis !== 1 && diagonalMode === true) {
			setCurrentBackgroundColor('blue');
			setCurrentFontColor('white');
		} else if (isInArray(g, shipLocations) && g % axis !== 0 && diagonalMode === true) {
			setCurrentBackgroundColor('blue');
			setCurrentFontColor('white');
		} else if (isInArray(h, shipLocations) && h % axis !== 1 && diagonalMode === true) {
			setCurrentBackgroundColor('blue');
			setCurrentFontColor('white');
		} else {
			setCurrentBackgroundColor('black');
			setCurrentFontColor('white');
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
				{props.title}
			</PaperPlace>

			<Snackbar open={scanDialogueOpen} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
				<Alert variant='filled' severity='error' onClose={handleClose}>
					<AlertTitle>Game Over!</AlertTitle>
					<div>
						{snackbarMessageClick} {hiddenShips}
					</div>
					<Button color='inherit' variant='outlined' onClick={handleClose} autoFocus>
						Reset Game
					</Button>
				</Alert>
			</Snackbar>
		</div>
	);
}

export default Square;
