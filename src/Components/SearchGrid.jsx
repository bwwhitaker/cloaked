import React, { useState, useRef, useEffect } from 'react';
import Square from './Square';
import { Grid, Button, Snackbar, Alert, AlertTitle } from '@mui/material';
import { styled } from '@mui/material/styles';
import { CELL } from './CellStatus';
import './GameSpace.css';
import { CELL_SIZE, REVEAL_DELAY } from './Constants';
import { isAdjacentToShip, isWin, isLuckyFirstScan } from './GameLogic';

const ModeButton = styled(Button)({
	textAlign: 'center',
	justifyContent: 'center',
	marginLeft: '10px',
});

// The three click modes, and the styling each one gets WHEN ACTIVE. Inactive
// buttons fall back to INACTIVE_MODE_STYLE. Because the look is derived from
// `clickMode` at render time, there is exactly one source of truth and the
// buttons can never drift out of sync — which is what the four separate
// background/color state variables risked in the original.
const MODES = ['Scan', 'Target', 'Unlock'];

const ACTIVE_MODE_STYLE = {
	Scan: { backgroundColor: '#1976d2', color: 'white' },
	Target: { backgroundColor: 'green', color: 'white' },
	Unlock: { backgroundColor: 'white', color: 'black' },
};

const INACTIVE_MODE_STYLE = { backgroundColor: '', color: 'white' };

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

	// Track every pending timeout so we can cancel them on unmount (e.g. the
	// player resets mid-animation), which avoids setState-on-unmounted warnings
	// and stray status flips after the board is gone.
	const timers = useRef([]);
	useEffect(() => () => timers.current.forEach(clearTimeout), []);

	const schedule = (fn, delay = 0) => {
		const id = setTimeout(fn, delay);
		timers.current.push(id);
		return id;
	};

	const isInArray = (value, array) => array.includes(value);

	const setStatus = (id, status, delay = 0) => {
		schedule(() => setCellStatus((prev) => ({ ...prev, [id]: status })), delay);
	};

	const showScanning = (id) => {
		setScanningId(id);
		schedule(() => setScanningId(null), REVEAL_DELAY);
	};

	const updateTargeted = (id) => setTargeted((prev) => [...prev, id]);
	const removeTargeted = (id) => setTargeted((prev) => prev.filter((v) => v !== id));
	const clearStreak = () => props.resetSuccessfulStreakCount();
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

	// --- Per-mode click handlers -------------------------------------------
	// handleSquareClick dispatches on the current mode. Each mode owns its own
	// branch, so behaviour no longer depends on the ORDER of a long if/else
	// chain. (In the original, the "scan clears a previously targeted cell"
	// branch sat after the Target/Unlock branches and could never also surface
	// adjacency — it's folded into handleScan below.)

	const revealShip = (id) => {
		setStatus(id, CELL.SHIP, REVEAL_DELAY);
		// "Lucky" only on the very first scan of a cell that wasn't targeted.
		// scanCount is still the pre-increment value within this render pass.
		const lucky = isLuckyFirstScan(scanCount, id, targeted);
		if (isInArray(id, targeted)) removeTargeted(id);
		if (!lucky) clearStreak();
		schedule(() => {
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
	};

	const handleScan = (id) => {
		showScanning(id);
		incrementScanCount();

		if (isInArray(id, shipsToPass)) {
			revealShip(id);
			return;
		}

		// Scanning a cell you'd previously marked also clears that mark...
		if (isInArray(id, targeted)) removeTargeted(id);

		// ...and either way, the scan reveals whether a ship is adjacent.
		const status = isAdjacentToShip(id, shipsToPass, axisX, diagonalMode) ? CELL.ADJACENT : CELL.CLEAR;
		setStatus(id, status, REVEAL_DELAY);
	};

	const handleTarget = (id) => {
		setStatus(id, CELL.TARGETED, 0);
		updateTargeted(id);
	};

	const handleUnlock = (id) => {
		setStatus(id, CELL.HIDDEN, REVEAL_DELAY);
		if (isInArray(id, targeted)) removeTargeted(id);
	};

	const handleSquareClick = (id) => {
		switch (clickMode) {
			case 'Scan':
				handleScan(id);
				break;
			case 'Target':
				handleTarget(id);
				break;
			case 'Unlock':
				handleUnlock(id);
				break;
			default:
				break;
		}
	};

	const gridKeys = Array.from({ length: gridSize }, (_, i) => i + 1);

	const message = ships === 1 ? 'There is 1 cloaked ship!' : `There are ${ships} cloaked ships!`;

	function Fire() {
		if (isWin(shipsToPass, targeted)) {
			setFireSnackbarOpen(true);
			setSnackbarMessage1('You found and destroyed all of the ships!');
			setSnackbarMessage2('');
			setFireSnackbarColor('success');
			setSnackbarTitle('You Win!');
			props.setSuccessfulStreakCount();
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
					{MODES.map((mode) => (
						<ModeButton
							key={mode}
							variant='outlined'
							sx={clickMode === mode ? ACTIVE_MODE_STYLE[mode] : INACTIVE_MODE_STYLE}
							onClick={() => setClickMode(mode)}
						>
							{mode}
						</ModeButton>
					))}
				</div>
				<div className='GridSpacing'>
					<Grid width={width} container justifyContent={'center'} spacing={0} columns={gridSize}>
						{gridKeys.map((key) => (
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
