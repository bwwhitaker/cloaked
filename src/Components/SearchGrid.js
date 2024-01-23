import React, { useState } from 'react';
import Square from './Square';
import { Grid, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Dialog, DialogContent, DialogContentText, DialogTitle, DialogActions } from '@mui/material';
import './GameSpace.css';

function SearchGrid(props) {
	const axisX = parseInt(props.axis);
	const gridSize = axisX * axisX;
	const width = axisX * 50;
	const ships = parseInt(props.ships);
	const bg = props.fieldBg;
	const shipsToPass = props.shipLocations;
	const [targeted, setTargeted] = useState([]);
	const [scanBackground, setScanBackground] = useState('Blue');
	const [targetBackground, setTargetBackground] = useState('');
	const [unlockBackground, setUnlockBackground] = useState('');
	const [unlockFontColor, setUnlockFontColor] = useState('White');
	const updateTargeted = (id) => {
		setTargeted((prevTargeted) => [...prevTargeted, id]);
	};
	const [fireDialogueOpen, setFireDialogueOpen] = useState(false);
	const handleClose = (value) => {
		setFireDialogueOpen(!fireDialogueOpen);
		props.setReadyToPlay(false);
		props.setShipLocations([]);
	};

	const handleScanCloakedShip = (value) => {
		props.setReadyToPlay(false);
		props.setShipLocations([]);
	};
	const [dialogueTitle, setDialogueTitle] = useState('');

	const [dialogueMessage, setDialogueMessage] = useState('');

	const [clickMode, setClickMode] = useState('Scan');

	console.log(clickMode);

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

	console.log(shipsToPass);
	// console.log(targeted);

	function Fire() {
		if (JSON.stringify(shipsToPass.sort()) === JSON.stringify(targeted.sort())) {
			setFireDialogueOpen(true);
			setDialogueMessage('You found all of the ships and destroyed them. You win!');
			setDialogueTitle('Congrats!');
		} else {
			setFireDialogueOpen(true);
			setDialogueTitle('Game Over!');
			setDialogueMessage(
				`Your scans were not accurate. Ships were in cells: ${shipsToPass.sort()} They fired back and destroyed your ship. You lose!`
			);
		}
	}

	const ScanButton = styled(Button)(() => ({
		textAlign: 'center',
		backgroundColor: scanBackground,
		color: 'White',
		justifyContent: 'center',
		marginLeft: '10px',
	}));

	const TargetButton = styled(Button)(() => ({
		textAlign: 'center',
		backgroundColor: targetBackground,
		color: 'White',
		justifyContent: 'center',
		marginLeft: '10px',
	}));

	const UnlockButton = styled(Button)(() => ({
		textAlign: 'center',
		backgroundColor: unlockBackground,
		color: unlockFontColor,
		justifyContent: 'center',
		marginLeft: '10px',
	}));

	return (
		<div>
			<div className='CenterAligning'>
				<div className='GameSpaceVertical'>{message}</div>
				<div className='GameSpaceVertical'>
					Mode:
					<ScanButton
						variant='outlined'
						onClick={() => {
							setClickMode('Scan');
							setUnlockBackground('');
							setTargetBackground('');
							setScanBackground('Blue');
							setUnlockFontColor('White');
						}}
					>
						Scan
					</ScanButton>
					<TargetButton
						variant='outlined'
						onClick={() => {
							setClickMode('Target');
							setUnlockBackground('');
							setTargetBackground('Green');
							setScanBackground('');
							setUnlockFontColor('White');
						}}
					>
						Target
					</TargetButton>
					<UnlockButton
						variant='outlined'
						onClick={() => {
							setClickMode('Unlock');
							setUnlockBackground('White');
							setTargetBackground('');
							setScanBackground('');
							setUnlockFontColor('Black');
						}}
					>
						Unlock
					</UnlockButton>
				</div>
				<div className='GridSpacing'>
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
									clickMode={clickMode}
									handleScanCloakedShip={handleScanCloakedShip}
								/>
							</Grid>
						))}
					</Grid>
				</div>
			</div>
			<div className='GameSpaceVertical'>
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
			<Dialog
				open={fireDialogueOpen}
				onClose={handleClose}
				aria-labelledby='alert-dialog-title'
				aria-describedby='alert-dialog-description'
			>
				<DialogTitle id='alert-dialog-title'>{dialogueTitle}</DialogTitle>
				<DialogContent>
					<DialogContentText id='alert-dialog-description'>{dialogueMessage}</DialogContentText>
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

export default SearchGrid;
