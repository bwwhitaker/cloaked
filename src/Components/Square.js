import React, { useState } from 'react';
import { Paper, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

function Square(props) {
	const [currentBackgroundColor, setCurrentBackgroundColor] = useState(props.bg);
	const shipLocations = props.shipLocations;
	const axis = props.axis;
	const targeted = props.targeted;

	const isInArray = (value, array) => {
		return array.includes(value);
	};

	function ButtonClick(id) {
		const clickMode = props.clickMode;
		let a = id - 1;
		let b = id + 1;
		let c = id - axis;
		let d = id + axis;

		if (isInArray(id, shipLocations) && clickMode === 'Scan') {
			setCurrentBackgroundColor('red');
			setTimeout(() => {
				alert(`Your scans alerted the enemy and they fired on you first. You lose!`);
			}, 200);
		} else if (clickMode === 'Target') {
			setCurrentBackgroundColor('green');
			props.updateTargeted(id);
		} else if (clickMode === 'Unlock' && isInArray(id, targeted)) {
			setCurrentBackgroundColor('white');
			props.removeTargeted(id);
		} else if (clickMode === 'Unlock') {
			setCurrentBackgroundColor('white');
		} else if (isInArray(a, shipLocations) && id % axis !== 1) {
			setCurrentBackgroundColor('blue');
		} else if (isInArray(b, shipLocations) && id % axis !== 0) {
			setCurrentBackgroundColor('blue');
		} else if (isInArray(c, shipLocations)) {
			setCurrentBackgroundColor('blue');
		} else if (isInArray(d, shipLocations)) {
			setCurrentBackgroundColor('blue');
		} else {
			setCurrentBackgroundColor('black');
		}
	}

	const PaperPlace = styled(Paper)(() => ({
		textAlign: 'center',
		height: 50,
		width: 50,
		lineHeight: '50px',
		backgroundColor: currentBackgroundColor,
		justifyContent: 'center',
	}));

	const ButtonPlace = styled(Button)(() => ({
		maxWidth: '48px',
		maxHeight: '48px',
		minWidth: '48px',
		minHeight: '48px',
		padding: 0,
		outlineColor: 'black',
		backgroundColor: currentBackgroundColor,
	}));

	return (
		<div>
			<PaperPlace square variant='outlined'>
				<ButtonPlace
					key={props.title}
					onClick={() => {
						ButtonClick(props.title);
					}}
				>
					{props.title}
				</ButtonPlace>
			</PaperPlace>
		</div>
	);
}

export default Square;
