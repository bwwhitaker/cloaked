import React, { useState, useEffect } from 'react';
import Slider from '@mui/material/Slider';
import { Grid, Button } from '@mui/material';
import SearchGrid from './SearchGrid';
import InstructionModule from './InstructionModule';
import './GameSpace.css';
import { lightBlue } from '@mui/material/colors';
import { generateUniqueRandomNumbers } from './GameLogic';

const INITIAL_FIELD_BG = 'rgba(255,255,255,.1)';
const STREAK_STORAGE_KEY = 'successfulStreakCount';

function GameSpace() {
	const [readyToPlay, setReadyToPlay] = useState(false);
	const [axis, setAxis] = useState(6);
	const maxValue = axis * axis;
	const [successfulStreakCount, setSuccessfulStreakCount] = useState(0);
	const [ships, setShip] = useState(2);
	const [fieldBg, setFieldBg] = useState(INITIAL_FIELD_BG);
	const [shipLocations, setShipLocations] = useState([]);
	const [openInstructions, setOpenInstructions] = useState(false);
	// One piece of state, not two. The label is derived, so the button caption
	// and the behaviour cannot drift apart — the same fix already applied to the
	// Scan/Target/Unlock buttons in SearchGrid.
	const [diagonalMode, setDiagonalMode] = useState(false);
	const diagonalModeStatus = diagonalMode ? 'On' : 'Off';
	const axisMarks = [
		{
			value: 4,
			label: '4 x 4',
		},
		{
			value: 5,
			label: '5 x 5',
		},
		{
			value: 6,
			label: '6 x 6',
		},
		{
			value: 7,
			label: '7 x 7',
		},
		{
			value: 8,
			label: '8 x 8',
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
	const changeAxis = (event, value) => {
		setAxis(value);
	};

	const changeShips = (event, value) => {
		setShip(value);
	};

	const handleGenerateClick = () => {
		// Deliberately does NOT seed with the previous game's ships. Passing them
		// as `existing` meant that when the count was unchanged the set was already
		// full and the function returned the OLD positions untouched — every replay
		// hid the ships in exactly the same cells.
		setShipLocations(generateUniqueRandomNumbers(ships, maxValue));
	};

	useEffect(() => {
		// Anything can end up in localStorage — a half-written value, an older
		// format, a user poking at devtools. parseInt('') is NaN, and NaN rendered
		// straight into "Streak Count:" is a permanently broken display with no way
		// back, so fall back to 0 rather than trusting what we read.
		const stored = Number.parseInt(localStorage.getItem(STREAK_STORAGE_KEY), 10);
		if (Number.isInteger(stored) && stored >= 0) {
			setSuccessfulStreakCount(stored);
		}
	}, []);

	useEffect(() => {
		// Update local storage whenever successfulStreakCount changes
		const timer = setTimeout(() => {
			localStorage.setItem(STREAK_STORAGE_KEY, String(successfulStreakCount));
		}, 100);

		return () => clearTimeout(timer);
	}, [successfulStreakCount]);

	const incrementStreakCount = () => {
		setSuccessfulStreakCount((prevCount) => prevCount + 1);
	};

	const resetStreakCount = () => {
		setSuccessfulStreakCount(0);
	};

	return (
		<div>
			<div hidden={readyToPlay}>
				<div className='HeaderRow'>
					<span className='left'>
						<Button
							variant='text'
							onClick={() => {
								setOpenInstructions(true);
							}}
						>
							Instructions
						</Button>
					</span>
					<span className='right'>Streak Count: {successfulStreakCount}</span>
				</div>
				<h1>Welcome to Cloaked!</h1>
				<h3>Scanning Parameters:</h3>
				<div className='grid-container'>
					<Grid container>
						<h5>Grid Size:</h5>
						<Slider
							defaultValue={6}
							aria-label='Grid Size'
							valueLabelDisplay='auto'
							step={1}
							marks={axisMarks}
							min={4}
							max={8}
							onChangeCommitted={changeAxis}
						/>
						<h5>Cloaked Ships:</h5>
						<Slider
							defaultValue={2}
							aria-label='Cloaked Ships Count'
							valueLabelDisplay='auto'
							step={1}
							marks={shipMarks}
							min={1}
							max={5}
							onChangeCommitted={changeShips}
						/>
						<h5>
							Diagonal Mode:
							<Button
								variant='text'
								color='primary'
								onClick={() => setDiagonalMode((prev) => !prev)}
							>
								{diagonalModeStatus}
							</Button>
						</h5>
					</Grid>
				</div>
				<div className='CenterAligning'>
					<Button
						variant='outlined'
						onClick={() => {
							setReadyToPlay(true);
							handleGenerateClick();
						}}
					>
						Begin Search
					</Button>
				</div>
			</div>

			{readyToPlay && (
				<div>
					<div className='HeaderRow'>
						<span className='left'>
							<Button
								sx={{
									color: lightBlue[800],
									'&.Mui-checked': {
										color: lightBlue[600],
									},
								}}
								onClick={() => {
									setReadyToPlay(false);
									// Was setFieldBg('white'), which had no route back — one
									// reset changed the board background for the rest of the
									// session. Restore the starting value instead.
									setFieldBg(INITIAL_FIELD_BG);
									setShipLocations([]);
								}}
							>
								Reset Game
							</Button>
							<Button
								variant='text'
								onClick={() => {
									setOpenInstructions(true);
								}}
							>
								Instructions
							</Button>
						</span>
						<span className='right'>Streak Count: {successfulStreakCount}</span>
					</div>

					<SearchGrid
						axis={axis}
						ships={ships}
						fieldBg={fieldBg}
						shipLocations={shipLocations}
						setReadyToPlay={setReadyToPlay}
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
		</div>
	);
}

export default GameSpace;
