import React, { useState } from 'react';
import Square from './Square';
import { Grid, Button } from '@mui/material';

function SearchGrid(props) {
	const axisX = parseInt(props.axis);
	const gridSize = axisX * axisX;
	const width = axisX * 50;
	const ships = parseInt(props.ships);
	const bg = props.fieldBg;
	const shipsToPass = props.shipLocations;
	let [targeted, setTargeted] = useState([]);

	const updateTargeted = (id) => {
		setTargeted((prevTargeted) => [...prevTargeted, id]);
	};

	console.log(targeted);

	const removeTargeted = (id) => {
		if (targeted.includes(id)) {
			setTargeted((prevTargeted) => prevTargeted.filter((value) => value !== id));
		} else {
			console.log('cannot complete action');
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

	function Fire() {
		if (JSON.stringify(shipsToPass.sort()) === JSON.stringify(targeted.sort())) {
			alert('You found all of the ships and destroyed them. You win!');
		} else {
			alert(
				`Your scans were not accurate. Ships were in cells: ${shipsToPass} They fired back and destroyed your ship. You lose!`
			);
		}
	}

	return (
		<div>
			<div>
				{message}
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
							/>
						</Grid>
					))}
				</Grid>
			</div>
			<Button
				variant='contained'
				color='error'
				onClick={() => {
					console.log('fire');
					Fire();
				}}
			>
				Fire!
			</Button>
		</div>
	);
}

export default SearchGrid;
