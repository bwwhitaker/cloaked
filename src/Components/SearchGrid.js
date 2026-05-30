import React, { useState } from 'react';
import Square from './Square';
import { Grid, Button, Snackbar, Alert, AlertTitle } from '@mui/material';
import { styled } from '@mui/material/styles';
import { CELL } from './CellStatus';
import './GameSpace.css';
import { CELL_SIZE, REVEAL_DELAY } from './Constants';

const ModeButton = styled(Button)({
	textAlign: 'center',
	justifyContent: 'center',
	marginLeft: '10px',
});

function SearchGrid(props) {
	const axisX = parseInt(props.axis);
	const gridSize = axisX * axisX;
	const width = axisX * CELL_SIZE;
	const ships = parseInt(props.ships);
	const bg = props.fieldBg;
	const shipsToPass = props.shipLocations;
	const diagonalMode = props.diagonalMode;
	const diagonalModeStatus = props.diagonalModeStatus;
	const [targeted, setTargeted] = useState([]);
	const [scanBackground, setScanBackground] = useState('#1976d2');
	const [targetBackground, setTargetBackground] = useState('');
	const [unlockBackground, setUnlockBackground] = useState('');
	const [unlockFontColor, setUnlockFontColor] = useState('White');
	const [scanCount, setScanCount] = useState(0);
	const [clickMode, setClickMode] = useState('Scan');

	const [cellStatus, setCellStatus] = useState({}); // { [id]: CELL.* }
	const [scanningId, setScanningId] = useState(null);
	const [scanDialog, setScanDialog] = useState({
		open: false,
		severity: 'error',
		title: 'Game Over!',
		message: '',
	});

	// Win / lose snackbar
	const [fireSnackbarOpen, setFireSnackbarOpen] = useState(false);
	const [fireSnackbarColor, setFireSnackbarColor] = useState('warning');
	const [snackbarTitle, setSnackbarTitle] = useState('');
	const [snackbarMessage1, setSnackbarMessage1] = useState('');
	const [snackbarMessage2, setSnackbarMessage2] = useState('');

	const isInArray = (value, array) => array.includes(value);

	const setStatus = (id, status, delay = 0) => {
		setTimeout(() => {
			setCellStatus((prev) => ({ ...prev, [id]: status }));
		}, delay);
	};

	const showScanning = (id) => {
		setScanningId(id);
		setTimeout(() => setScanningId(null), REVEAL_DELAY);
	};

	const updateTargeted = (id) => setTargeted((prev) => [...prev, id]);
	const removeTargeted = (id) => setTargeted((prev) => prev.filter((v) => v !== id));
	const clearStreak = () => props.resetsuccessfulScanCount();
	const incrementScanCount = () => setScanCount((prev) => prev + 1);
	const resetScanCount = () => setScanCount(0);

	const handleClose = () => {
		setFireSnackbarOpen(false);
		props.setReadyToPlay(false);
		props.setShipLocations([]);
	};

	const handleScanDialogClose = () => {
		setScanDialog((prev) => ({ ...prev, open: false }));
		props.setReadyToPlay(false);
		props.setShipLocations([]);
	};

	const shipCells = () => [...shipsToPass].sort((a, b) => a - b).join(', ');

	const gameOverMsg = () =>
		shipsToPass.length === 1
			? `Your scans alerted the enemy and they fired first. The ship was in cell: ${shipCells()}`
			: `Your scans alerted the enemy and they fired first. Ships were in cells: ${shipCells()}`;

	const isAdjacentToShip = (id) => {
		const a = id - 1;
		const b = id + 1;
		const c = id - axisX;
		const d = id + axisX;
		const e = id - axisX - 1;
		const f = id - axisX + 1;
		const g = id + axisX - 1;
		const h = id + axisX + 1;

		if (isInArray(a, shipsToPass) && id % axisX !== 1) return true; // left
		if (isInArray(b, shipsToPass) && id % axisX !== 0) return true; // right
		if (isInArray(c, shipsToPass)) return true; // up
		if (isInArray(d, shipsToPass)) return true; // down
		if (!diagonalMode) return false;
		if (isInArray(e, shipsToPass) && e % axisX !== 0) return true; // up-left
		if (isInArray(f, shipsToPass) && f % axisX !== 1) return true; // up-right
		if (isInArray(g, shipsToPass) && g % axisX !== 0) return true; // down-left
		if (isInArray(h, shipsToPass) && h % axisX !== 1) return true; // down-right
		return false;
	};

	const handleSquareClick = (id) => {
		const mode = clickMode;

		if (mode === 'Scan') {
			showScanning(id);
			incrementScanCount();
		}

		const onShip = isInArray(id, shipsToPass);

		if (onShip && mode === 'Scan') {
			setStatus(id, CELL.SHIP, REVEAL_DELAY);
			// "lucky" only on a first scan that wasn't already a targeted cell
			const lucky = scanCount < 1 && !isInArray(id, targeted);
			if (isInArray(id, targeted)) removeTargeted(id);
			if (!lucky) clearStreak();
			setTimeout(() => {
				setScanDialog(
					lucky
						? {
								open: true,
								severity: 'info',
								title: 'That was lucky!',
								message: `Your first scan found a ship. Since they got startled and fled, we won't reset your streak.`,
							}
						: { open: true, severity: 'error', title: 'Game Over!', message: gameOverMsg() },
				);
			}, REVEAL_DELAY);
		} else if (mode === 'Target') {
			setStatus(id, CELL.TARGETED, 0);
			updateTargeted(id);
		} else if (mode === 'Unlock') {
			setStatus(id, CELL.HIDDEN, REVEAL_DELAY);
			if (isInArray(id, targeted)) removeTargeted(id);
		} else if (mode === 'Scan' && isInArray(id, targeted)) {
			setStatus(id, CELL.CLEAR, REVEAL_DELAY);
			removeTargeted(id);
		} else if (isAdjacentToShip(id)) {
			setStatus(id, CELL.ADJACENT, REVEAL_DELAY);
		} else {
			setStatus(id, CELL.CLEAR, REVEAL_DELAY);
		}
	};

	let myGridkeys = [];
	for (let i = 1; i <= gridSize; i++) {
		myGridkeys.push(i);
	}

	const message = ships === 1 ? 'There is 1 cloaked ship!' : `There are ${ships} cloaked ships!`;

	function Fire() {
		const sortNums = (arr) => [...new Set(arr)].sort((a, b) => a - b);
		if (JSON.stringify(sortNums(shipsToPass)) === JSON.stringify(sortNums(targeted))) {
			setFireSnackbarOpen(true);
			setSnackbarMessage1('You found and destroyed all of the ships!');
			setSnackbarMessage2('');
			setFireSnackbarColor('success');
			setSnackbarTitle('You Win!');
			props.setsuccessfulScanCount();
			resetScanCount();
		} else {
			const hiddenShips = shipCells();
			setFireSnackbarOpen(true);
			setFireSnackbarColor('error');
			setSnackbarTitle('Game Over!');
			setSnackbarMessage1(`Your scans were not accurate. They fired back and destroyed your ship.`);
			setSnackbarMessage2(
				ships === 1 ? `The ship was in cell: ${hiddenShips}.` : `Ships were in cells: ${hiddenShips}.`,
			);
			clearStreak();
			resetScanCount();
		}
	}

	return (
		<div>
			<div className='CenterAligning'>
				<div className='GameSpaceVertical'>{message}</div>
				<div className='DiagonalModeMessage'>Diagonal Scannning Mode is {diagonalModeStatus}.</div>
				<div className='GameSpaceVertical'>
					Mode:
					<ModeButton
						variant='outlined'
						sx={{ backgroundColor: scanBackground, color: 'white' }}
						onClick={() => {
							setClickMode('Scan');
							setUnlockBackground('');
							setTargetBackground('');
							setScanBackground('#1976d2');
							setUnlockFontColor('White');
						}}
					>
						Scan
					</ModeButton>
					<ModeButton
						variant='outlined'
						sx={{ backgroundColor: targetBackground, color: 'white' }}
						onClick={() => {
							setClickMode('Target');
							setUnlockBackground('');
							setTargetBackground('Green');
							setScanBackground('');
							setUnlockFontColor('White');
						}}
					>
						Target
					</ModeButton>
					<ModeButton
						variant='outlined'
						sx={{ backgroundColor: unlockBackground, color: unlockFontColor }}
						onClick={() => {
							setClickMode('Unlock');
							setUnlockBackground('White');
							setTargetBackground('');
							setScanBackground('');
							setUnlockFontColor('Black');
						}}
					>
						Unlock
					</ModeButton>
				</div>
				<div className='GridSpacing'>
					<Grid width={width} container justifyContent={'center'} spacing={0} columns={gridSize}>
						{myGridkeys.map((key) => (
							<Grid item xs={axisX} key={key}>
								<Square
									key={key}
									title={key}
									bg={bg}
									status={cellStatus[key]}
									scanning={scanningId === key}
									onSquareClick={handleSquareClick}
								/>
							</Grid>
						))}
					</Grid>
				</div>
			</div>
			<div className='GameSpaceVertical'>
				<Button variant='contained' color='error' onClick={() => Fire()}>
					Fire!
				</Button>
			</div>

			<Snackbar open={fireSnackbarOpen} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
				<Alert variant='filled' severity={fireSnackbarColor} onClose={handleClose}>
					<AlertTitle>{snackbarTitle}</AlertTitle>
					<div>{snackbarMessage1}</div>
					<div>{snackbarMessage2}</div>
					<div className='top-padding'>
						<Button color='inherit' variant='outlined' onClick={handleClose} autoFocus>
							Reset Game
						</Button>
					</div>
				</Alert>
			</Snackbar>

			<Snackbar
				open={scanDialog.open}
				onClose={handleScanDialogClose}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
			>
				<Alert variant='filled' severity={scanDialog.severity} onClose={handleScanDialogClose}>
					<AlertTitle>{scanDialog.title}</AlertTitle>
					<div>{scanDialog.message}</div>
					<div className='top-padding'>
						<Button color='inherit' variant='outlined' onClick={handleScanDialogClose} autoFocus>
							Reset Game
						</Button>
					</div>
				</Alert>
			</Snackbar>
		</div>
	);
}

export default SearchGrid;
