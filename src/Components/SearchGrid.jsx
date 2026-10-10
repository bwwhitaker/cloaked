import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Square from './Square';
import { Grid, Button, Snackbar, Alert, AlertTitle, Backdrop } from '@mui/material';
import { styled } from '@mui/material/styles';
import { CELL } from './CellStatus';
import { Trophy, ShieldX, SearchAlert, ScanSearch, Crosshair, LockOpen } from 'lucide-react';
import './GameSpace.css';
import { CELL_SIZE, REVEAL_DELAY } from './Constants';
import { isZoomedIn } from './zoom';
import { isAdjacentToShip, isWin, isLuckyFirstScan, cellName } from './GameLogic';

// One segment of the Scan / Target / Unlock control. Segments share a single
// outlined container (see .SegmentedControl) and split its width equally.
const ModeButton = styled(Button)({
	flex: 1,
	minWidth: 0,
	gap: 8,
	minHeight: 36, // still well over WCAG's 24px minimum target, and no extra vertical padding
	paddingTop: 0,
	paddingBottom: 0,
	borderRadius: 0,
	border: 'none',
	textAlign: 'center',
	justifyContent: 'center',
	'& + &': { borderLeft: '1px solid rgba(255, 255, 255, 0.2)' },
	// Autofocus runs while the board is mounting, so MUI's focus ripple was drawn
	// off-centre. The outline below is the focus indicator instead.
	'& .MuiTouchRipple-root': { display: 'none' },
	'&:hover': { backgroundColor: 'rgba(144, 202, 249, 0.18)' },
	'&:focus-visible': { outline: '3px solid #ffffff', outlineOffset: '-3px' },
});

// The icons match the ones drawn on the board for the same actions.
const MODE_ICON = { Scan: ScanSearch, Target: Crosshair, Unlock: LockOpen };

// The three click modes, and the styling each one gets WHEN ACTIVE. Inactive
// buttons fall back to INACTIVE_MODE_STYLE. Because the look is derived from
// `clickMode` at render time, there is exactly one source of truth and the
// buttons can never drift out of sync — which is what the four separate
// background/color state variables risked in the original.
// The alert buttons take focus while the snackbar is still scaling in, so MUI's
// focus ripple was measured mid-animation and ended up off-centre. Use a plain
// outline for keyboard focus instead.
const ALERT_BUTTON_SX = {
	'& .MuiTouchRipple-root': { display: 'none' },
	'&.Mui-focusVisible': { outline: '3px solid #ffffff', outlineOffset: '3px' },
};

// MUI's filled info alert (white on #0288d1) is only 3.9:1; this is about 7.5:1.
const INFO_ALERT_SX = { backgroundColor: '#01579b' };

const MODES = ['Scan', 'Target', 'Unlock'];

const ACTIVE_MODE_STYLE = {
	Scan: { backgroundColor: '#1976d2', color: 'white' },
	Target: { backgroundColor: '#ffb300', color: '#111111' },
	Unlock: { backgroundColor: 'white', color: 'black' },
};

const INACTIVE_MODE_STYLE = { backgroundColor: 'transparent', color: 'white' };

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
	// Roving tabindex: only one cell is a Tab stop, arrow keys move within the grid.
	const [activeId, setActiveId] = useState(1);
	// Spoken (visually hidden) result of the last action.
	// The counter re-keys the text node, so a message identical to the last one
	// (re-scanning the same cell) is still read out.
	const [announcement, setAnnouncementState] = useState({ text: '', count: 0 });
	const setAnnouncement = (text) => setAnnouncementState((prev) => ({ text, count: prev.count + 1 }));
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

	// The window can shrink mid-round (leaving full screen) while the board keeps
	// its size. If that pushes the Fire button below the bottom edge, or the grid
	// past a side edge, lock the board until the window grows again or the player
	// starts over. Measured, not guessed: only something really off screen locks.
	const fireButton = useRef(null);
	const gridBox = useRef(null);
	const [windowTooSmall, setWindowTooSmall] = useState(false);
	const lockedRef = useRef(false);
	const focusBeforeLock = useRef(null);
	useEffect(() => {
		const check = () => {
			const fire = fireButton.current;
			const grid = gridBox.current;
			if (!fire || !grid) return;
			const gridRect = grid.getBoundingClientRect();
			// Zoomed in, the page scrolls, so being off screen is fine.
			const tooSmall =
				!isZoomedIn() &&
				(fire.getBoundingClientRect().bottom > window.innerHeight + 1 ||
				gridRect.left < -1 ||
				gridRect.right > window.innerWidth + 1);
			// Note where focus is before the lock screen takes it.
			if (tooSmall && !lockedRef.current) focusBeforeLock.current = document.activeElement;
			lockedRef.current = tooSmall;
			setWindowTooSmall(tooSmall);
		};
		check();
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	}, []);

	// While locked, nothing behind the lock screen can be reached: it is made inert
	// (no focus, no clicks, hidden from screen readers), and focus returns to where
	// it was once the window is big enough again.
	useEffect(() => {
		if (!windowTooSmall) return undefined;
		let page = gridBox.current;
		while (page && page.parentElement !== document.body) page = page.parentElement;
		page?.setAttribute('inert', '');
		return () => {
			page?.removeAttribute('inert');
			const back = focusBeforeLock.current;
			if (back instanceof HTMLElement && document.contains(back)) back.focus();
		};
	}, [windowTooSmall]);

	// Tell the parent once there is something to lose, so it knows whether
	// starting a new game needs a confirmation.
	const touched = scanCount > 0 || targeted.length > 0;
	useEffect(() => {
		if (touched) props.onRoundTouched?.();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [touched]);
	useEffect(() => () => timers.current.forEach(clearTimeout), []);

	const schedule = (fn, delay = 0) => {
		const id = setTimeout(fn, delay);
		timers.current.push(id);
		return id;
	};

	const isInArray = (value, array) => array.includes(value);

	const ANNOUNCE = {
		[CELL.TARGETED]: 'targeted',
		[CELL.ADJACENT]: 'scanned, ship adjacent',
		[CELL.CLEAR]: 'scanned, clear',
		[CELL.SHIP]: 'ship found',
		[CELL.DESTROYED]: 'ship destroyed',
		[CELL.HIDDEN]: 'unlocked',
	};

	const setStatus = (id, status, delay = 0) => {
		schedule(() => {
			setCellStatus((prev) => ({ ...prev, [id]: status }));
			setAnnouncement(`${cellName(id, axisX)}: ${ANNOUNCE[status]}`);
		}, delay);
	};

	const focusCell = (id) => {
		setActiveId(id);
		document.querySelector(`[data-cell-id="${id}"]`)?.focus();
	};

	const handleModeKeyDown = (e) => {
		const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
		if (!step) return;
		e.preventDefault();
		const next = MODES[(MODES.indexOf(clickMode) + step + MODES.length) % MODES.length];
		setClickMode(next);
		document.querySelector(`[data-mode="${next}"]`)?.focus();
	};

	const handleGridKeyDown = (e) => {
		const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -axisX, ArrowDown: axisX };
		let next = activeId;
		if (e.key in moves) {
			const col = (activeId - 1) % axisX;
			if (e.key === 'ArrowLeft' && col === 0) return;
			if (e.key === 'ArrowRight' && col === axisX - 1) return;
			next = activeId + moves[e.key];
		} else if (e.key === 'Home') next = activeId - ((activeId - 1) % axisX);
		else if (e.key === 'End') next = activeId + (axisX - 1 - ((activeId - 1) % axisX));
		else return;
		e.preventDefault();
		if (next >= 1 && next <= gridSize) focusCell(next);
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

	const shipCells = () =>
		[...shipsToPass]
			.sort((a, b) => a - b)
			.map((id) => cellName(id, axisX))
			.join('; ');

	const gameOverMsg = () =>
		shipsToPass.length === 1
			? 'Your scans alerted the cloaked ship and it fired first.'
			: 'Your scans alerted the cloaked ships and they fired first.';

	// On a loss, show where the ships were on the board itself. The grid shows
	// it to sighted players; the live region carries the same positions for
	// screen reader users, who can't see the highlighted cells.
	const revealAllShips = () => {
		setCellStatus((prev) => ({ ...prev, ...Object.fromEntries(shipsToPass.map((id) => [id, CELL.SHIP])) }));
		setAnnouncement(`${shipsToPass.length === 1 ? 'Ship was' : 'Ships were'} at ${shipCells()}.`);
	};

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
		const lucky = isLuckyFirstScan(scanCount, id, targeted, shipsToPass);
		if (isInArray(id, targeted)) removeTargeted(id);
		if (!lucky) clearStreak();
		schedule(() => {
			if (!lucky) revealAllShips();
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

	// While a result is showing, the board is locked. Without this, a click on
	// Fire! (or a cell) behind the lucky-shot alert fired a second, empty shot
	// and wiped the streak the alert had just spared.
	const resultOpen = scanDialog.open || fireSnackbarOpen;

	const handleSquareClick = (id) => {
		if (resultOpen) return;
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

	// The backdrop handles outside clicks; the Snackbar's own click-away would
	// otherwise run the same reset a second time.
	const ignoreClickAway = (fn) => (event, reason) => {
		if (reason === 'clickaway') return;
		fn();
	};

	// Each result alert gets its own icon: win, lose, and the lucky first scan.
	const resultIcon = (severity) => {
		if (severity === 'success') return <Trophy size={22} aria-hidden='true' />;
		if (severity === 'error') return <ShieldX size={22} aria-hidden='true' />;
		if (severity === 'info') return <SearchAlert size={22} aria-hidden='true' />; // the lucky first scan
		return undefined;
	};

	const gridKeys = Array.from({ length: gridSize }, (_, i) => i + 1);

	// Counted from what the board shows, so re-targeting a square or scanning a
	// targeted one cannot throw it off.
	const targetedCount = Object.values(cellStatus).filter((status) => status === CELL.TARGETED).length;

	const shipsLabel = ships === 1 ? '1 cloaked ship' : `${ships} cloaked ships`;

	function Fire() {
		if (resultOpen) return;
		if (isWin(shipsToPass, targeted)) {
			// Every targeted cell is a ship, so show their cloaks coming down.
			setCellStatus((prev) => ({ ...prev, ...Object.fromEntries(shipsToPass.map((id) => [id, CELL.DESTROYED])) }));
			const newStreak = props.successfulStreakCount + 1;
			setAnnouncement(
				`${shipsToPass.length === 1 ? 'Ship' : 'Ships'} destroyed at ${shipCells()}. Victory! Victory Streak: ${newStreak}.`,
			);
			setFireSnackbarOpen(true);
			setSnackbarMessage1(
				shipsToPass.length === 1
					? 'You found and destroyed the cloaked ship!'
					: 'You found and destroyed the cloaked ships!',
			);
			setSnackbarMessage2(`Victory Streak: ${newStreak}`);
			setFireSnackbarColor('success');
			setSnackbarTitle('You Win!');
			props.setSuccessfulStreakCount();
			resetScanCount();
		} else {
			revealAllShips();
			setFireSnackbarOpen(true);
			setFireSnackbarColor('error');
			setSnackbarTitle('Game Over!');
			setSnackbarMessage1(
				shipsToPass.length === 1
					? 'Your scans were not accurate. The cloaked ship fired back and destroyed your ship.'
					: 'Your scans were not accurate. The cloaked ships fired back and destroyed your ship.',
			);
			setSnackbarMessage2(ships === 1 ? 'The cloaked ship has been revealed.' : 'The cloaked ships have been revealed.');
			clearStreak();
			resetScanCount();
		}
	}

	return (
		<div>
			<div className='CenterAligning'>
				<section className='ControlPanel' aria-label='Round controls'>
					<ul className='RoundStatus' aria-label='Round settings'>
						<li className='StatusChip'>{shipsLabel}</li>
						<li className='StatusChip'>Diagonal mode {String(diagonalModeStatus).toLowerCase()}</li>
						{/* Just a tally, never "of N": players may target more than there are
						    ships (and lose), so it must not read as a limit or a hint. */}
						<li className='StatusChip'>Targeted: {targetedCount}</li>
					</ul>
					<span id='mode-label' className='visually-hidden'>
						Mode
					</span>
					<div className='SegmentedControl' role='radiogroup' aria-labelledby='mode-label'>
					{MODES.map((mode) => {
						const ModeIcon = MODE_ICON[mode];
						return (
						<ModeButton
							key={mode}
							role='radio'
							aria-checked={clickMode === mode}
							data-mode={mode}
							variant='text'
							sx={clickMode === mode ? ACTIVE_MODE_STYLE[mode] : INACTIVE_MODE_STYLE}
							// Radio group keyboard model: the selected mode is the only Tab
							// stop and arrow keys move between modes, so Tab goes straight on
							// to the grid.
							tabIndex={clickMode === mode ? 0 : -1}
							// The board only mounts when a game starts. Landing on Scan means
							// keyboard and screen reader users skip New Game and How to Play
							// and hear the current mode.
							autoFocus={mode === 'Scan'}
							onClick={() => setClickMode(mode)}
							onKeyDown={handleModeKeyDown}
						>
							<ModeIcon size={18} aria-hidden='true' />
							{mode}
						</ModeButton>
						);
					})}
					</div>
				</section>
				<div ref={gridBox} className='GridSpacing' role='group' aria-label='Scan grid' onKeyDown={handleGridKeyDown}>
					<Grid width={width} container justifyContent={'center'} spacing={0} columns={gridSize}>
						{gridKeys.map((key) => (
							<Grid item xs={axisX} key={key}>
								<Square
									key={key}
									id={key}
									name={cellName(key, axisX)}
									focusable={activeId === key}
									onFocusCell={setActiveId}
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
			<div className='visually-hidden' role='status' aria-live='polite'>
				<span key={announcement.count}>{announcement.text}</span>
			</div>
			{/* The running total, spoken after each square's own announcement. */}
			<div className='visually-hidden' aria-live='polite' data-testid='targeted-tally'>
				{targetedCount} targeted
			</div>
			<div className='GameSpaceVertical'>
				<Button ref={fireButton} variant='contained' color='error' sx={{ minHeight: 36, py: 0 }} onClick={() => Fire()}>
					Fire!
				</Button>
			</div>

			{/* Clicking anywhere outside the result alert returns to the landing page.
			    The streak lives in GameSpace, so nothing here touches it. */}
			<Backdrop
				open={resultOpen}
				data-testid='result-backdrop'
				onClick={scanDialog.open ? handleScanDialogClose : handleClose}
				sx={{ zIndex: 1399, backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
			/>

			{windowTooSmall &&
				createPortal(
					<div
						className='window-too-small'
						role='alertdialog'
						aria-modal='true'
						aria-labelledby='window-too-small-msg'
						// The one button is the only thing to focus, so Tab stays on it.
						onKeyDown={(e) => e.key === 'Tab' && e.preventDefault()}
					>
						<p id='window-too-small-msg'>Increase window size to continue or start a new game.</p>
						{/* Same path as the header's New Game, so it asks first when a round is under way. */}
						<Button variant='outlined' color='inherit' autoFocus onClick={props.onNewGame ?? handleClose}>
							New Game
						</Button>
					</div>,
					document.body,
				)}

			<Snackbar open={fireSnackbarOpen} onClose={ignoreClickAway(handleClose)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
				<Alert
					variant='filled'
					severity={fireSnackbarColor}
					icon={resultIcon(fireSnackbarColor)}
					onClose={handleClose}
				>
					<AlertTitle>{snackbarTitle}</AlertTitle>
					<div>{snackbarMessage1}</div>
					<div>{snackbarMessage2}</div>
					<div className='top-padding'>
						<Button color='inherit' variant='outlined' sx={ALERT_BUTTON_SX} onClick={handleClose} autoFocus>
							New Game
						</Button>
					</div>
				</Alert>
			</Snackbar>

			<Snackbar
				open={scanDialog.open}
				onClose={ignoreClickAway(handleScanDialogClose)}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
			>
				<Alert
					variant='filled'
					sx={scanDialog.severity === 'info' ? INFO_ALERT_SX : undefined}
					severity={scanDialog.severity}
					icon={resultIcon(scanDialog.severity)}
					onClose={handleScanDialogClose}
				>
					<AlertTitle>{scanDialog.title}</AlertTitle>
					<div>{scanDialog.message}</div>
					<div className='top-padding'>
						<Button color='inherit' variant='outlined' sx={ALERT_BUTTON_SX} onClick={handleScanDialogClose} autoFocus>
							New Game
						</Button>
					</div>
				</Alert>
			</Snackbar>
		</div>
	);
}

export default SearchGrid;
