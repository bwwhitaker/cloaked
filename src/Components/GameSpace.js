import React, { useState } from 'react';
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

	console.log(diagonalMode);

	return (
		<div>
			<div hidden={readyToPlay}>
				<h1>Welcome to Cloaked!</h1>
				<p>Prepare to hunt for cloaked enemy ships.</p>
				<Grid container>
					Grid Size:
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
					Cloaked Ships:
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
					Diagnonal Mode:
					<Button
						variant='text'
						color='error'
						label={diagonalMode}
						onClick={() => {
							setDiagonalMode(!diagonalMode);
							if (diagonalModeStatus === 'Off') {
								setDiagonalModeStatus('On');
							} else {
								setDiagonalModeStatus('Off');
							}
						}}
					>
						{diagonalModeStatus}
					</Button>
				</Grid>
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
								//console.log('opening');
							}}
						>
							Show Instructions
						</Button>
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
					/>
				</div>
			)}

			<InstructionModule openInstructions={openInstructions} setOpenInstructions={setOpenInstructions} />
		</div>
	);
}

Grid.propTypes = {};

export default GameSpace;
