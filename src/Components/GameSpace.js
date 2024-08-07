import React, { useState, useEffect } from 'react';
import Slider from '@mui/material/Slider';
import { Grid, Button } from '@mui/material';
import SearchGrid from './SearchGrid';
import InstructionModule from './InstructionModule';
import './GameSpace.css';
import { lightBlue } from '@mui/material/colors';

function GameSpace() {
	const generateUniqueRandomNumbers = (count, maxValue, existingArray) => {
		const randomNumbers = new Set(existingArray);
		while (randomNumbers.size < count) {
			const randomNumber = Math.floor(Math.random() * maxValue) + 1;
			randomNumbers.add(randomNumber);
		}
		return Array.from(randomNumbers);
	};

	const [readyToPlay, setReadyToPlay] = useState(false);
	const [axis, setAxis] = useState(6);
	let maxValue = axis * axis;
	const [succesfulScanCount, setSuccesfulScanCount] = useState(0);
	const [ships, setShip] = useState(2);
	const [fieldBg, setFieldBg] = useState('white');
	const [shipLocations, setShipLocations] = useState([]);
	const [openInstructions, setOpenInstructions] = useState(false);
	const [diagonalMode, setDiagonalMode] = useState(false);
	const [diagonalModeStatus, setDiagonalModeStatus] = useState('Off');
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
		const newShipLocations = generateUniqueRandomNumbers(ships, maxValue, shipLocations);
		setShipLocations(newShipLocations);
	};

	useEffect(() => {
		// Retrieve the streak count from local storage or initialize it if not present
		const storedCount = localStorage.getItem('succesfulScanCount');
		if (storedCount !== null) {
			console.log('Retrieved from local storage:', storedCount);
			setSuccesfulScanCount(parseInt(storedCount, 10));
		}
	}, []);

	useEffect(() => {
		// Update local storage whenever succesfulScanCount changes
		const timer = setTimeout(() => {
			if (succesfulScanCount !== null && succesfulScanCount >= 0) {
				console.log('Updating local storage to:', succesfulScanCount);
				localStorage.setItem('succesfulScanCount', succesfulScanCount);
			}
		}, 100);

		return () => clearTimeout(timer);
	}, [succesfulScanCount]);

	const incrementStreakCount = () => {
		setSuccesfulScanCount((prevCount) => prevCount + 1);
	};

	const resetStreakCount = () => {
		setSuccesfulScanCount(0);
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
					<span className='right'>Streak Count: {succesfulScanCount}</span>
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
								onClick={() => {
									setDiagonalMode(!diagonalMode);
									setDiagonalModeStatus(diagonalModeStatus === 'Off' ? 'On' : 'Off');
								}}
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
							setReadyToPlay(!readyToPlay);
							setShipLocations([]);
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
									setReadyToPlay(!readyToPlay);
									setFieldBg('white');
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
						<span className='right'>Streak Count: {succesfulScanCount}</span>
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
						succesfulScanCount={succesfulScanCount}
						setSuccesfulScanCount={incrementStreakCount}
						resetSuccesfulScanCount={resetStreakCount}
					/>
				</div>
			)}

			<InstructionModule openInstructions={openInstructions} setOpenInstructions={setOpenInstructions} />
		</div>
	);
}

Grid.propTypes = {};

export default GameSpace;
