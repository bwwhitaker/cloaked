import React, { useState } from 'react';
import Square from './Square';
import { Grid, Button, Snackbar, Alert, AlertTitle } from '@mui/material';
import { styled } from '@mui/material/styles';
import './GameSpace.css';

function SearchGrid(props) {
	const axisX = parseInt(props.axis);
	const gridSize = axisX * axisX;
	const width = axisX * 50;
	const ships = parseInt(props.ships);
	const bg = props.fieldBg;
	const shipsToPass = props.shipLocations;
	const diagonalMode = props.diagonalMode;
	const diagonalModeStatus = props.diagonalModeStatus;
	const [targeted, setTargeted] = useState([]);
	const [scanBackground, setScanBackground] = useState('Blue');
	const [targetBackground, setTargetBackground] = useState('');
	const [unlockBackground, setUnlockBackground] = useState('');
	const [unlockFontColor, setUnlockFontColor] = useState('White');
	const updateTargeted = (id) => {
		setTargeted((prevTargeted) => [...prevTargeted, id]);
	};
	const [fireSnackbarOpen, setFireSnackbarOpen] = useState(false);
	const handleClose = (value) => {
		setFireSnackbarOpen(!fireSnackbarOpen);
		props.setReadyToPlay(false);
		props.setShipLocations([]);
	};

	const handleScanCloakedShip = (value) => {
		props.setReadyToPlay(false);
		props.setShipLocations([]);
	};

	const [snackbarMessage1, setSnackbarMessage1] = useState('');
	const [snackbarTitle, setSnackbarTitle] = useState('');
	const [clickMode, setClickMode] = useState('Scan');
	const [snackbarMessage2, setSnackbarMessage2] = useState('');

	const [fireSnackbarColor, setFireSnackbarColor] = useState('');

	// console.log(clickMode);

	const removeTargeted = (id) => {
		if (targeted.includes(id)) {
			setTargeted((prevTargeted) => prevTargeted.filter((value) => value !== id));
		} else {
			//console.log('cannot complete action');
		}
	};

	let myGridkeys = [];
	for (let i = 1; i <= gridSize; i++) {
		myGridkeys.push(i);
	}

	let message;
	if (ships === 1) {
		message = 'There is 1 cloaked ship!';
	} else {
		message = `There are ${ships} cloaked ships!`;
	}

	//console.log(shipsToPass);
	// console.log(targeted);

	function Fire() {
		if (JSON.stringify(shipsToPass.sort()) === JSON.stringify(targeted.sort())) {
			setFireSnackbarOpen(true);
			setSnackbarMessage1('You found and destroyed all of the ships!');
			setFireSnackbarColor('success');
			setSnackbarTitle('You Win!');
		} else {
			let hiddenShips = shipsToPass
				.sort(function (a, b) {
					return a - b;
				})
				.toString()
				.replace(/,/g, ', ');
			setFireSnackbarOpen(true);
			setFireSnackbarColor('error');
			setSnackbarTitle('Game Over!');
			if (ships === 1) {
				setSnackbarMessage1(`Your scans were not accurate. They fired back and destroyed your ship.`);
				setSnackbarMessage2(`The ship was in cell: ${hiddenShips}.`);
			} else {
				setSnackbarMessage1(`Your scans were not accurate. They fired back and destroyed your ship.`);
				setSnackbarMessage2(`Ships were in cells: ${hiddenShips}.`);
			}
		}
	}

	const ScanButton = styled(Button)(() => ({
		textAlign: 'center',
		backgroundColor: scanBackground,
		color: 'White',
		justifyContent: 'center',
		marginLeft: '10px',
	}));

	const TargetButton = styled(Button)(() => ({
		textAlign: 'center',
		backgroundColor: targetBackground,
		color: 'White',
		justifyContent: 'center',
		marginLeft: '10px',
	}));

	const UnlockButton = styled(Button)(() => ({
		textAlign: 'center',
		backgroundColor: unlockBackground,
		color: unlockFontColor,
		justifyContent: 'center',
		marginLeft: '10px',
	}));

	return (
		<div>
			<div className='CenterAligning'>
				<div className='GameSpaceVertical'>{message}</div>
				<div className='DiagonalModeMessage'>Diagnonal Scannning Mode is {diagonalModeStatus}.</div>
				<div className='GameSpaceVertical'>
					Mode:
					<ScanButton
						variant='outlined'
						onClick={() => {
							setClickMode('Scan');
							setUnlockBackground('');
							setTargetBackground('');
							setScanBackground('Blue');
							setUnlockFontColor('White');
						}}
					>
						Scan
					</ScanButton>
					<TargetButton
						variant='outlined'
						onClick={() => {
							setClickMode('Target');
							setUnlockBackground('');
							setTargetBackground('Green');
							setScanBackground('');
							setUnlockFontColor('White');
						}}
					>
						Target
					</TargetButton>
					<UnlockButton
						variant='outlined'
						onClick={() => {
							setClickMode('Unlock');
							setUnlockBackground('White');
							setTargetBackground('');
							setScanBackground('');
							setUnlockFontColor('Black');
						}}
					>
						Unlock
					</UnlockButton>
				</div>
				<div className='GridSpacing'>
					<Grid width={width} container justifyContent={'center'} spacing={0} columns={gridSize}>
						{myGridkeys.map((key) => (
							<Grid item xs={axisX}>
								<Square
									key={key}
									title={key}
									bg={bg}
									shipLocations={shipsToPass}
									axis={axisX}
									updateTargeted={updateTargeted}
									targeted={targeted}
									removeTargeted={removeTargeted}
									clickMode={clickMode}
									handleScanCloakedShip={handleScanCloakedShip}
									diagonalMode={diagonalMode}
								/>
							</Grid>
						))}
					</Grid>
				</div>
			</div>
			<div className='GameSpaceVertical'>
				<Button
					variant='contained'
					color='error'
					onClick={() => {
						//console.log('fire');
						Fire();
					}}
				>
					Fire!
				</Button>
			</div>

			<Snackbar open={fireSnackbarOpen} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
				<Alert variant='filled' severity={fireSnackbarColor} onClose={handleClose}>
					<AlertTitle>{snackbarTitle}</AlertTitle>
					<div>{snackbarMessage1}</div>
					<div>{snackbarMessage2}</div>
					<Button color='inherit' variant='outlined' onClick={handleClose} autoFocus>
						Reset Game
					</Button>
				</Alert>
			</Snackbar>
		</div>
	);
}

export default SearchGrid;
