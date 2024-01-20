import React, { useState } from 'react';
import Slider from '@mui/material/Slider';
import { Grid, Button } from '@mui/material';
import SearchGrid from './SearchGrid';
import InstructionModule from './InstructionModule';

function GameSpace() {
	const generateUniqueRandomNumbers = (count, maxValue, existingArray) => {
		const randomNumbers = new Set(existingArray);
		while (randomNumbers.size < count) {
			const randomNumber = Math.floor(Math.random() * maxValue) + 1;
			randomNumbers.add(randomNumber);
		}
		//console.log(randomNumbers);
		return Array.from(randomNumbers);
	};

	const [readyToPlay, setReadyToPlay] = useState(false);
	const [axis, setAxis] = useState(6);
	let maxValue = axis * axis;
	const [ships, setShip] = useState(2);
	const [fieldBg, setFieldBg] = useState('white');
	const [shipLocations, setShipLocations] = useState([]);
	const [openInstructions, setOpenInstructions] = useState(false);

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

	return (
		<div>
			<div hidden={readyToPlay}>
				<Grid container>
					How large of a map do you want?
					<Slider
						defaultValue={6}
						aria-label='Grid Axis'
						valueLabelDisplay='auto'
						step={1}
						marks={axisMarks}
						min={4}
						max={8}
						onChangeCommitted={changeAxis}
					/>
					How Many Ships to Find?
					<Slider
						defaultValue={2}
						aria-label='Ship Number'
						valueLabelDisplay='auto'
						step={1}
						marks={shipMarks}
						min={1}
						max={5}
						onChangeCommitted={changeShips}
					/>
					<Button
						variant='contained'
						onClick={() => {
							setReadyToPlay(!readyToPlay);
							handleGenerateClick();
						}}
					>
						Generate Grid
					</Button>
				</Grid>
			</div>

			{readyToPlay && (
				<div>
					<Button
						variant='outlined'
						onClick={() => {
							setReadyToPlay(!readyToPlay);
							setFieldBg('white');
							setShipLocations([]);
						}}
					>
						Modify Grid
					</Button>
					<Button
						onClick={() => {
							setOpenInstructions(true);
							console.log('opening');
						}}
					>
						Show Instructions
					</Button>
					<SearchGrid axis={axis} ships={ships} fieldBg={fieldBg} shipLocations={shipLocations} />
				</div>
			)}

			<InstructionModule openInstructions={openInstructions} setOpenInstructions={setOpenInstructions} />
		</div>
	);
}

Grid.propTypes = {};

export default GameSpace;
