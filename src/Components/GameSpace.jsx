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
import { LINK_BLUE, SWITCH_SX } from './Constants';
import { generateUniqueRandomNumbers } from './GameLogic';

const INITIAL_FIELD_BG = 'rgba(255,255,255,.1)';
const STREAK_STORAGE_KEY = 'successfulStreakCount';
const BEST_STREAK_STORAGE_KEY = 'bestStreakCount';
const CONFIRM_RESET_STORAGE_KEY = 'confirmNewGame';
const REDUCE_MOTION_STORAGE_KEY = 'reduceMotion';

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
	const [axis, setAxis] = useState(6);
	const maxValue = axis * axis;
	// Read saved values once, up front, rather than in an effect that sets state
	// after the first paint. A saved streak can never be above the best, whatever
	// was stored.
	const [successfulStreakCount, setSuccessfulStreakCount] = useState(() => readStoredCount(STREAK_STORAGE_KEY));
	const [bestStreakCount, setBestStreakCount] = useState(() =>
		Math.max(readStoredCount(BEST_STREAK_STORAGE_KEY), readStoredCount(STREAK_STORAGE_KEY)),
	);
	const [ships, setShip] = useState(2);
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
	const [reduceMotion, setReduceMotion] = useState(() => readStoredFlag(REDUCE_MOTION_STORAGE_KEY) ?? systemPrefersReducedMotion());
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
	const axisMarks = [
		{
			value: 4,
			label: '4 × 4',
		},
		{
			value: 5,
			label: '5 × 5',
		},
		{
			value: 6,
			label: '6 × 6',
		},
		{
			value: 7,
			label: '7 × 7',
		},
		{
			value: 8,
			label: '8 × 8',
		},
	];

	const shipMarks = [
		{
			value: 1,
			label: '1',
		},
		{
			value: 2,
			label: '2',
		},
		{
			value: 3,
			label: '3',
		},
		{
			value: 4,
			label: '4',
		},
		{
			value: 5,
			label: '5',
		},
	];
	const changeAxis = (event, value) => setAxis(value);
	const changeShips = (event, value) => setShip(value);

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
				<p className='Premise'>Find cloaked ships before they find you.</p>

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
						<Slider
							value={axis}
							aria-labelledby='grid-label'
							getAriaValueText={(v) => `${v} by ${v}`}
							step={1}
							marks={axisMarks}
							min={4}
							max={8}
							onChange={changeAxis}
						/>
					</div>

					<div className='SettingRow'>
						<div className='SettingHeader'>
							<span id='ships-label' className='SettingLabel'>
								Cloaked Ships
							</span>
							<span className='SettingValue'>{ships}</span>
						</div>
						<Slider
							value={ships}
							aria-labelledby='ships-label'
							step={1}
							marks={shipMarks}
							min={1}
							max={5}
							onChange={changeShips}
						/>
					</div>

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
							Harder: scans also check squares that touch at a corner.
						</FormHelperText>
					</div>

					<div className='SetupActions'>
						<Button
							action={beginAction}
							variant='contained'
							size='large'
							onClick={() => {
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
					<div className='HeaderRow'>
						<span className='left'>
							{settingsButton}
							<Button
								sx={{ color: LINK_BLUE }}
								onClick={handleNewGameClick}
							>
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
						axis={axis}
						ships={ships}
						fieldBg={fieldBg}
						shipLocations={shipLocations}
						setReadyToPlay={setReadyToPlay}
						onRoundTouched={() => setRoundTouched(true)}
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
