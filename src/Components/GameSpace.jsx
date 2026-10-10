import React, { useState, useEffect, useRef } from 'react';
import Slider from '@mui/material/Slider';
import { Button, Switch, FormControlLabel, FormHelperText } from '@mui/material';
import SearchGrid from './SearchGrid';
import InstructionModule from './InstructionModule';
import StreakBadge from './StreakBadge';
import ResetConfirmDialog from './ResetConfirmDialog';
import SettingsModule from './SettingsModule';
import { Settings, RotateCcw, CircleHelp } from 'lucide-react';
import './GameSpace.css';
import { LINK_BLUE, SWITCH_SX, CELL_SIZE } from './Constants';
import { generateUniqueRandomNumbers } from './GameLogic';
import { isZoomedIn } from './zoom';

const INITIAL_FIELD_BG = 'rgba(255,255,255,.1)';
const STREAK_STORAGE_KEY = 'successfulStreakCount';
const BEST_STREAK_STORAGE_KEY = 'bestStreakCount';
const CONFIRM_RESET_STORAGE_KEY = 'confirmNewGame';
const REDUCE_MOTION_STORAGE_KEY = 'reduceMotion';
const HIGH_CONTRAST_STORAGE_KEY = 'highContrast';
// A grid is axis x CELL_SIZE wide and must keep SIDE_GAP clear on BOTH sides, so
// an N x N grid needs N * 50 + 2 * 8 px:
//   4 x 4: 216   5 x 5: 266   6 x 6: 316   7 x 7: 366   8 x 8: 416   9 x 9: 466   10 x 10: 516
// The biggest grid offered is the largest N that fits, never below 5 x 5 (a
// screen too narrow even for that is not worth designing around).
const SIDE_GAP = 8;
const MIN_AXIS = 4;
const MIN_WIDEST_AXIS = 5;
const MAX_AXIS = 10;
const MAX_SHIPS = 10;
// Where only 4 x 4 and 5 x 5 fit, ships stop at 5 as well.
const MAX_SHIPS_NARROW = 5;
// At most a third of the squares can hold ships, rounded down (16 -> 5, 25 -> 8).
const shipCapFor = (axis) => Math.min(MAX_SHIPS, Math.floor((axis * axis) / 3));
// The slider rail, with everything past `cap` greyed out: the thumb can't go there.
function railWithDisabledEnd(cap, min, max) {
	const percent = ((cap - min) / (max - min)) * 100;
	return `linear-gradient(to right, rgba(25, 118, 210, 0.38) ${percent}%, rgba(150, 156, 168, 0.55) ${percent}%)`;
}

// Height matters too: the Fire button has to be on screen without scrolling.
// Everything on the board except the grid (header, controls, Fire button and
// their spacing) is measured at about 250px, or 275px on phones under 400px wide
// where the status line wraps onto a second line. Reserve a little more than
// that and let the grid have the rest:  rows <= (screen height - overhead) / 50.
//   wide:    6 rows: 554   7 rows: 604   8 rows: 654   9 rows: 704   10 rows: 754
//   narrow:  6 rows: 579   7 rows: 629   8 rows: 679   9 rows: 729   10 rows: 779
const VERTICAL_OVERHEAD = 254;
const VERTICAL_OVERHEAD_NARROW = 279;
const NARROW_WIDTH = 400;
function widestGridFor(width, height) {
	const byWidth = Math.floor((width - 2 * SIDE_GAP) / CELL_SIZE);
	const overhead = width < NARROW_WIDTH ? VERTICAL_OVERHEAD_NARROW : VERTICAL_OVERHEAD;
	const byHeight = Math.floor((height - overhead) / CELL_SIZE);
	return Math.max(MIN_WIDEST_AXIS, Math.min(MAX_AXIS, byWidth, byHeight));
}

// A click in the margin just left or right of a slider's ends picks the end,
// so you don't have to land exactly on the thumb or the rail's last pixel.
const clickBeyondEnds = (min, max, set) => (event) => {
	if (event.target !== event.currentTarget) return;
	const slider = event.currentTarget.querySelector('.MuiSlider-root');
	if (!slider) return;
	const { left, right } = slider.getBoundingClientRect();
	if (event.clientX < left) set(min);
	else if (event.clientX > right) set(max);
};


// 'true' / 'false' saved by a setting, or null if never set (or storage is blocked).
function readStoredFlag(key) {
	try {
		const stored = localStorage.getItem(key);
		return stored === 'true' ? true : stored === 'false' ? false : null;
	} catch {
		return null;
	}
}

// Until the player chooses, follow the device's own reduced-motion setting.
function systemPrefersReducedMotion() {
	return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function systemPrefersHighContrast() {
	return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-contrast: more)').matches;
}

// Anything can end up in localStorage — a half-written value, an older format, a
// user poking at devtools. parseInt('') is NaN, and NaN rendered straight into
// the streak display is permanently broken with no way back, so fall back to 0
// rather than trusting what we read.
function readStoredCount(key) {
	try {
		const stored = Number.parseInt(localStorage.getItem(key), 10);
		return Number.isInteger(stored) && stored >= 0 ? stored : 0;
	} catch {
		return 0; // storage blocked
	}
}

function GameSpace() {
	const [readyToPlay, setReadyToPlay] = useState(false);
	const [chosenAxis, setAxis] = useState(6);
	const [screenSize, setScreenSize] = useState(() => ({
		width: window.innerWidth,
		height: window.innerHeight,
		zoomed: isZoomedIn(),
	}));
	useEffect(() => {
		const onResize = () =>
			setScreenSize({ width: window.innerWidth, height: window.innerHeight, zoomed: isZoomedIn() });
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);
	// Grids too big for the screen are not offered; a bigger earlier choice is
	// trimmed to fit, and comes back if the screen grows again.
	// Zoomed in, the page scrolls both ways, so nothing needs to be kept on screen
	// and every size is offered.
	const maxAxis = screenSize.zoomed ? MAX_AXIS : widestGridFor(screenSize.width, screenSize.height);
	const axis = Math.min(chosenAxis, maxAxis);
	const maxValue = axis * axis;
	// Read saved values once, up front, rather than in an effect that sets state
	// after the first paint. A saved streak can never be above the best, whatever
	// was stored.
	const [successfulStreakCount, setSuccessfulStreakCount] = useState(() => readStoredCount(STREAK_STORAGE_KEY));
	const [bestStreakCount, setBestStreakCount] = useState(() =>
		Math.max(readStoredCount(BEST_STREAK_STORAGE_KEY), readStoredCount(STREAK_STORAGE_KEY)),
	);
	const [chosenShips, setShip] = useState(2);
	// Phones that only offer 4 x 4 and 5 x 5 only count ships up to 5. The ship
	// count follows the grid down if a smaller one is picked.
	const shipSliderMax = maxAxis <= MIN_WIDEST_AXIS ? MAX_SHIPS_NARROW : MAX_SHIPS;
	const shipCap = Math.min(shipSliderMax, shipCapFor(axis));
	const ships = Math.min(chosenShips, shipCap);
	const gridLimited = maxAxis < MAX_AXIS;
	const shipsLimited = shipCap < shipSliderMax;
	// The part of the ship slider past the cap is greyed out: the thumb cannot go there.
	const shipRailBackground = railWithDisabledEnd(shipCap, 1, shipSliderMax);
	const gridRailBackground = railWithDisabledEnd(maxAxis, MIN_AXIS, MAX_AXIS);
	const [round, setRound] = useState({ axis: 6, ships: 2 });
	const [fieldBg, setFieldBg] = useState(INITIAL_FIELD_BG);
	const [shipLocations, setShipLocations] = useState([]);
	const [openInstructions, setOpenInstructions] = useState(false);
	// True once the player has scanned or targeted anything this round; only then
	// is there something to lose, so only then do we ask before leaving.
	const [roundTouched, setRoundTouched] = useState(false);
	// Only an explicit 'false' turns the warning off.
	const [confirmNewGame, setConfirmNewGame] = useState(() => readStoredFlag(CONFIRM_RESET_STORAGE_KEY) !== false);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [openSettings, setOpenSettings] = useState(false);
	// A saved choice wins; until then, follow the device's setting.
	const [reduceMotion, setReduceMotion] = useState(
		() => readStoredFlag(REDUCE_MOTION_STORAGE_KEY) ?? systemPrefersReducedMotion(),
	);
	const [highContrast, setHighContrast] = useState(
		() => readStoredFlag(HIGH_CONTRAST_STORAGE_KEY) ?? systemPrefersHighContrast(),
	);
	const beginAction = useRef(null);
	const wasPlaying = useRef(false);

	// ButtonBase's focusVisible() focuses the button AND turns on its keyboard-focus
	// look (the pulsing ripple). A plain .focus() after a mouse click is not
	// treated as keyboard focus by the browser, so no focus ring would show.
	const focusBegin = () => beginAction.current?.focusVisible();

	// Coming back to the setup screen (New Game, or after a result), put focus on
	// Start scanning. Otherwise it lands on nothing and keyboard and screen reader
	// users have to find their way back from the top of the page.
	useEffect(() => {
		if (wasPlaying.current && !readyToPlay) focusBegin();
		wasPlaying.current = readyToPlay;
	}, [readyToPlay]);
	// One piece of state, not two. The label is derived, so the button caption
	// and the behaviour cannot drift apart — the same fix already applied to the
	// Scan/Target/Unlock buttons in SearchGrid.
	const [diagonalMode, setDiagonalMode] = useState(false);
	const diagonalModeStatus = diagonalMode ? 'On' : 'Off';
	// Just the numbers: the "6 × 6" readout above the slider says what they mean.
	// Sizes the screen can't fit stay on the slider, dimmed.
	const axisMarks = Array.from({ length: MAX_AXIS - MIN_AXIS + 1 }, (_, i) => {
		const value = MIN_AXIS + i;
		return { value, label: value > maxAxis ? <span className='MarkDisabled'>{value}</span> : String(value) };
	});

	// Counts above what the grid allows stay on the slider, dimmed.
	const shipMarks = Array.from({ length: shipSliderMax }, (_, i) => ({
		value: i + 1,
		label: i + 1 > shipCap ? <span className='MarkDisabled'>{i + 1}</span> : String(i + 1),
	}));
	// Pressing past a limit changes nothing, which is silent for anyone who can't see
	// the dimmed numbers. Say why; the counter makes a repeated press speak again.
	const [limitNotice, setLimitNotice] = useState({ text: '', count: 0 });
	const noteLimit = (text) => setLimitNotice((prev) => ({ text, count: prev.count + 1 }));
	const changeAxis = (event, value) => {
		if (value > maxAxis) noteLimit(`${maxAxis} by ${maxAxis} is the largest grid this window fits.`);
		setAxis(Math.min(value, maxAxis));
	};
	const changeShips = (event, value) => {
		if (value > shipCap) noteLimit(`${shipCap} ships is the most this grid allows. Choose a larger grid to find more.`);
		setShip(Math.min(value, shipCap));
	};

	const handleGenerateClick = () => {
		// Deliberately does NOT seed with the previous game's ships. Passing them
		// as `existing` meant that when the count was unchanged the set was already
		// full and the function returned the OLD positions untouched — every replay
		// hid the ships in exactly the same cells.
		setShipLocations(generateUniqueRandomNumbers(ships, maxValue));
	};

	useEffect(() => {
		// Update local storage whenever successfulStreakCount changes
		const timer = setTimeout(() => {
			localStorage.setItem(STREAK_STORAGE_KEY, String(successfulStreakCount));
		}, 100);

		return () => clearTimeout(timer);
	}, [successfulStreakCount]);

	useEffect(() => {
		const timer = setTimeout(() => {
			localStorage.setItem(BEST_STREAK_STORAGE_KEY, String(bestStreakCount));
		}, 100);

		return () => clearTimeout(timer);
	}, [bestStreakCount]);

	const changeConfirmNewGame = (value) => {
		setConfirmNewGame(value);
		try {
			localStorage.setItem(CONFIRM_RESET_STORAGE_KEY, String(value));
		} catch {
			/* not worth failing the game over */
		}
	};

	useEffect(() => {
		// On the root element so dialogs and snackbars (rendered in portals) are covered too.
		document.documentElement.dataset.reduceMotion = String(reduceMotion);
	}, [reduceMotion]);

	const changeReduceMotion = (value) => {
		setReduceMotion(value);
		try {
			localStorage.setItem(REDUCE_MOTION_STORAGE_KEY, String(value));
		} catch {
			/* not worth failing the game over */
		}
	};

	// Header out of the way while reading down the page, back as soon as you scroll
	// up. It only matters where the page scrolls (zoomed in, or a short window).
	useEffect(() => {
		let lastY = window.scrollY;
		const onScroll = () => {
			const y = window.scrollY;
			if (y <= 0) document.documentElement.dataset.headerHidden = 'false';
			else if (y > lastY + 6 && y > 80) document.documentElement.dataset.headerHidden = 'true';
			else if (y < lastY - 6) document.documentElement.dataset.headerHidden = 'false';
			// Small jitters leave it as it was, and do not move the reference point.
			if (Math.abs(y - lastY) > 6 || y <= 0) lastY = y;
		};
		document.documentElement.dataset.headerHidden = 'false';
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	// The page scrolls (see index.css) only while zoomed in.
	useEffect(() => {
		document.documentElement.dataset.zoomed = String(screenSize.zoomed);
	}, [screenSize.zoomed]);

	useEffect(() => {
		document.documentElement.dataset.highContrast = String(highContrast);
	}, [highContrast]);

	const changeHighContrast = (value) => {
		setHighContrast(value);
		try {
			localStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, String(value));
		} catch {
			/* not worth failing the game over */
		}
	};

	const startNewGame = () => {
		setReadyToPlay(false);
		setRoundTouched(false);
		// Was setFieldBg('white'), which had no route back — one reset changed the
		// board background for the rest of the session. Restore the starting
		// value instead.
		setFieldBg(INITIAL_FIELD_BG);
		setShipLocations([]);
	};

	const handleNewGameClick = () => {
		if (roundTouched && confirmNewGame) setConfirmOpen(true);
		else startNewGame();
	};

	// First item in the header's left group on both screens, so it never shifts.
	// Written out on wide screens, an icon on phones (see .hdr-label / .hdr-icon).
	const settingsButton = (
		<Button variant='text' sx={{ color: LINK_BLUE }} onClick={() => setOpenSettings(true)}>
			<Settings className='hdr-icon' size={20} aria-hidden='true' />
			<span className='hdr-label'>Settings</span>
		</Button>
	);

	const incrementStreakCount = () => {
		const next = successfulStreakCount + 1;
		setSuccessfulStreakCount(next);
		// The best streak only ever goes up.
		setBestStreakCount((best) => Math.max(best, next));
	};

	const resetStreakCount = () => {
		setSuccessfulStreakCount(0);
	};

	return (
		<div>
			<div hidden={readyToPlay}>
				<div className='HeaderRow'>
					<span className='left'>{settingsButton}</span>
					<span className='right'>
						<StreakBadge streak={successfulStreakCount} best={bestStreakCount} />
					</span>
				</div>
				<h1 className='LandingTitle'>Welcome to Cloaked!</h1>
				<p className='Premise'>Find the cloaked ships before they fire at you.</p>

				<section className='SetupCard' aria-labelledby='setup-title'>
					<h2 id='setup-title' className='SetupTitle'>
						Game setup
					</h2>

					<div className='SettingRow'>
						<div className='SettingHeader'>
							<span id='grid-label' className='SettingLabel'>
								Grid Size
							</span>
							<span className='SettingValue'>
								{axis} × {axis}
							</span>
						</div>
						<div className='SliderWrap' onClick={clickBeyondEnds(MIN_AXIS, MAX_AXIS, (v) => changeAxis(null, v))}>
						<Slider
							value={axis}
							aria-labelledby='grid-label'
							slotProps={{ input: gridLimited ? { 'aria-describedby': 'grid-help' } : {} }}
							getAriaValueText={(v) => `${v} by ${v}${gridLimited && v === maxAxis ? ', the largest this screen fits' : ''}`}
							step={1}
							marks={axisMarks}
							min={MIN_AXIS}
							max={MAX_AXIS}
							onChange={changeAxis}
							sx={gridLimited ? { '& .MuiSlider-rail': { opacity: 1, background: gridRailBackground } } : undefined}
						/>
						</div>
					</div>

					{gridLimited && (
						<FormHelperText id='grid-help' className='SettingHelp SettingNote'>A larger window is required for larger grids.</FormHelperText>
					)}

					<div className='SettingRow'>
						<div className='SettingHeader'>
							<span id='ships-label' className='SettingLabel'>
								Cloaked Ships
							</span>
							<span className='SettingValue'>{ships}</span>
						</div>
						<div className='SliderWrap' onClick={clickBeyondEnds(1, shipSliderMax, (v) => changeShips(null, v))}>
						<Slider
							value={ships}
							aria-labelledby='ships-label'
							// Read out the limit with the value, and tie the slider to the
							// warning so the reason it stops is announced too.
							getAriaValueText={(v) => (shipsLimited && v === shipCap ? `${v}, the most this grid allows` : String(v))}
							slotProps={{ input: shipsLimited ? { 'aria-describedby': 'ships-help' } : {} }}
							step={1}
							marks={shipMarks}
							min={1}
							max={shipSliderMax}
							onChange={changeShips}
							sx={shipsLimited ? { '& .MuiSlider-rail': { opacity: 1, background: shipRailBackground } } : undefined}
						/>
						</div>
					</div>

					{shipsLimited && (
						<FormHelperText id='ships-help' className='SettingHelp SettingNote'>A larger grid is required to find more than {shipCap} ships.</FormHelperText>
					)}

					<div className='SettingRow'>
						<FormControlLabel
							label='Diagonal Mode'
							labelPlacement='start'
							className='DiagonalSetting'
							control={
								<Switch
									checked={diagonalMode}
									onChange={(e) => setDiagonalMode(e.target.checked)}
									inputProps={{ role: 'switch', 'aria-describedby': 'diagonal-help' }}
									sx={SWITCH_SX}
								/>
							}
						/>
						<FormHelperText id='diagonal-help' className='SettingHelp'>
							Scans also check squares that touch at a corner.
						</FormHelperText>
					</div>

					<div className='visually-hidden' role='status' aria-live='polite'>
						<span key={limitNotice.count}>{limitNotice.text}</span>
					</div>

					<div className='SetupActions'>
						<Button
							action={beginAction}
							variant='contained'
							size='large'
							onClick={() => {
								// Fix the board at what was chosen. The slider follows the window, but
								// resizing mid-round (leaving full screen) must not rebuild the board.
								setRound({ axis, ships });
								setReadyToPlay(true);
								setRoundTouched(false);
								handleGenerateClick();
							}}
						>
							Start scanning
						</Button>
						<Button
							variant='text'
							sx={{ color: LINK_BLUE }}
							onClick={() => {
								setOpenInstructions(true);
							}}
						>
							How to Play
						</Button>
					</div>
				</section>
			</div>

			{readyToPlay && (
				<div>
					<h1 className='visually-hidden'>Cloaked</h1>
					<div className='HeaderRow'>
						<span className='left'>
							{settingsButton}
							<Button sx={{ color: LINK_BLUE }} onClick={handleNewGameClick}>
								<RotateCcw className='hdr-icon' size={20} aria-hidden='true' />
								<span className='hdr-label'>New Game</span>
							</Button>
							<Button
								variant='text'
								sx={{ color: LINK_BLUE }}
								onClick={() => {
									setOpenInstructions(true);
								}}
							>
								<CircleHelp className='hdr-icon' size={20} aria-hidden='true' />
								<span className='hdr-label'>How to Play</span>
							</Button>
						</span>
						<span className='right'>
							<StreakBadge streak={successfulStreakCount} best={bestStreakCount} />
						</span>
					</div>

					<SearchGrid
						axis={round.axis}
						ships={round.ships}
						fieldBg={fieldBg}
						shipLocations={shipLocations}
						setReadyToPlay={setReadyToPlay}
						onRoundTouched={() => setRoundTouched(true)}
						onNewGame={handleNewGameClick}
						setShipLocations={setShipLocations}
						diagonalMode={diagonalMode}
						diagonalModeStatus={diagonalModeStatus}
						successfulStreakCount={successfulStreakCount}
						setSuccessfulStreakCount={incrementStreakCount}
						resetSuccessfulStreakCount={resetStreakCount}
					/>
				</div>
			)}

			<InstructionModule openInstructions={openInstructions} setOpenInstructions={setOpenInstructions} />
			<SettingsModule
				open={openSettings}
				onClose={() => setOpenSettings(false)}
				confirmNewGame={confirmNewGame}
				setConfirmNewGame={changeConfirmNewGame}
				reduceMotion={reduceMotion}
				setReduceMotion={changeReduceMotion}
				highContrast={highContrast}
				setHighContrast={changeHighContrast}
			/>
			<ResetConfirmDialog
				open={confirmOpen}
				onCancel={() => setConfirmOpen(false)}
				onExited={focusBegin}
				onConfirm={(dontAsk) => {
					if (dontAsk) changeConfirmNewGame(false);
					setConfirmOpen(false);
					startNewGame();
				}}
			/>
		</div>
	);
}

export default GameSpace;
