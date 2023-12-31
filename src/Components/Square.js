import React, { useEffect, useState } from 'react';
import { Paper, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

function Square(props) {
	const [currentBackgroundColor, setCurrentBackgroundColor] = useState(props.bg);
	const shipLocations = props.shipLocations;
	const axis = props.axis;
	const [isTPressed, setIsTPressed] = useState(false);
	const [isUPressed, setIsUPressed] = useState(false);
	const targeted = props.targeted;

	const isInArray = (value, array) => {
		return array.includes(value);
	};

	useEffect(() => {
		const handleTKeyDown = (event) => {
			if (event.key === 't') {
				setIsTPressed(true);
			}
		};

		const handleTKeyUp = (event) => {
			if (event.key === 't') {
				setIsTPressed(false);
			}
		};
		const handleUKeyDown = (event) => {
			if (event.key === 'u') {
				setIsUPressed(true);
			}
		};

		const handleUKeyUp = (event) => {
			if (event.key === 'u') {
				setIsUPressed(false);
			}
		};

		document.addEventListener('keydown', handleTKeyDown);
		document.addEventListener('keyup', handleTKeyUp);
		document.addEventListener('keydown', handleUKeyDown);
		document.addEventListener('keyup', handleUKeyUp);

		return () => {
			document.removeEventListener('keydown', handleTKeyDown);
			document.removeEventListener('keyup', handleTKeyUp);
			document.removeEventListener('keydown', handleUKeyDown);
			document.removeEventListener('keyup', handleUKeyUp);
		};
	}, []);

	function ButtonClick(id) {
		//console.log(id);

		//console.log(shipLocations);
		let a = id - 1;
		let b = id + 1;
		let c = id - axis;
		let d = id + axis;
		//console.log(a);
		if (isInArray(id, shipLocations) && isTPressed === false && isUPressed === false) {
			setCurrentBackgroundColor('red');
			//console.log('boom');
			setTimeout(() => {
				alert(`Your scans alerted the enemy and they fired on you first. You lose!`);
			}, 200);
		} else if (isTPressed === true) {
			setCurrentBackgroundColor('green');
			props.updateTargeted(id);
		} else if (isUPressed === true && isInArray(id, targeted)) {
			setCurrentBackgroundColor('white');
			//console.log('removing target from list');
			props.removeTargeted(id);
		} else if (isUPressed === true) {
			setCurrentBackgroundColor('white');
			//console.log('clearing target');
		} else if (isInArray(a, shipLocations) && id % axis !== 1) {
			//console.log('close a');
			setCurrentBackgroundColor('blue');
		} else if (isInArray(b, shipLocations) && id % axis !== 0) {
			//console.log('close b');
			setCurrentBackgroundColor('blue');
		} else if (isInArray(c, shipLocations)) {
			//console.log('close');
			setCurrentBackgroundColor('blue');
		} else if (isInArray(d, shipLocations)) {
			//console.log('close');
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
