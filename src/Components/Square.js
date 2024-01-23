import React, { useState } from 'react';
import { Paper, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Dialog, DialogContent, DialogContentText, DialogTitle, DialogActions } from '@mui/material';

function Square(props) {
	const [currentBackgroundColor, setCurrentBackgroundColor] = useState(props.bg);
	const shipLocations = props.shipLocations;
	const axis = props.axis;
	const targeted = props.targeted;
	const [scanDialogueOpen, setScanDialogueOpen] = useState(false);
	const handleClose = (value) => {
		setScanDialogueOpen(!scanDialogueOpen);
		props.handleScanCloakedShip();
	};

	const isInArray = (value, array) => {
		return array.includes(value);
	};

	function ButtonClick(id) {
		const clickMode = props.clickMode;
		let a = id - 1;
		let b = id + 1;
		let c = id - axis;
		let d = id + axis;

		if (isInArray(id, shipLocations) && clickMode === 'Scan' && isInArray(id, targeted)) {
			setCurrentBackgroundColor('red');
			props.removeTargeted(id);
			setTimeout(() => {
				setScanDialogueOpen(true);
			}, 200);
		} else if (isInArray(id, shipLocations) && clickMode === 'Scan') {
			setCurrentBackgroundColor('red');
			setTimeout(() => {
				setScanDialogueOpen(true);
			}, 200);
		} else if (clickMode === 'Target') {
			setCurrentBackgroundColor('green');
			props.updateTargeted(id);
		} else if (clickMode === 'Unlock' && isInArray(id, targeted)) {
			setCurrentBackgroundColor('white');
			props.removeTargeted(id);
		} else if (clickMode === 'Scan' && isInArray(id, targeted)) {
			setCurrentBackgroundColor('black');
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
			<Dialog
				open={scanDialogueOpen}
				onClose={handleClose}
				aria-labelledby='alert-dialog-title'
				aria-describedby='alert-dialog-description'
			>
				<DialogTitle id='alert-dialog-title'>{'Game Over!'}</DialogTitle>
				<DialogContent>
					<DialogContentText id='alert-dialog-description'>{`Your scans alerted the enemy and they fired on you first. You lose!`}</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose} autoFocus>
						Reset Game
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}

export default Square;