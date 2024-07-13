import React from 'react';
import { Dialog, DialogContent, Button } from '@mui/material';
import Typography from '@mui/material/Typography';
import './InstructionModule.css';

function InstructionModule(props) {
	const handleClose = (value) => {
		props.setOpenInstructions(false);
	};

	return (
		<Dialog onClose={handleClose} open={props.openInstructions}>
			<section className='instruction-module'>
				<DialogContent>
					<div className='center'>
						<Typography variant='h5'>Searching for cloaked ships is easy!</Typography>
					</div>
					<Typography variant='h6'>1. Scanning for Ships:</Typography>
					<Typography className='padded' variant='body2'>
						You start in "Scan" mode. Click on a square to check for hidden ships.
					</Typography>
					<Typography className='padded' variant='body2'></Typography>
					<Typography variant='h6'>2. Diagonal Mode:</Typography>
					<Typography className='padded' variant='body2'>
						With Diagonal Mode Off, scans check for cloaked ships up, down, left, or right.
					</Typography>
					<Typography className='padded' variant='body2'>
						Turn Diagonal Mode On to include diagonal scans in your search.
					</Typography>
					<Typography variant='h6'>3. Scan Results:</Typography>
					<Typography className='padded' variant='body2'>
						Black square = no ship detected in the clicked or neighboring squares.
					</Typography>
					<Typography className='padded' variant='body2'>
						Blue square = at least one cloaked ship nearby.
					</Typography>
					<Typography className='padded' variant='body2'>
						Red square = your scans was detected, and the enemy has fired. Game over!
					</Typography>
					<Typography variant='h6'>4. Locking Targets:</Typography>
					<Typography className='padded' variant='body2'>
						Click the "Target" button to activate Targeting mode, then click a square.
					</Typography>
					<Typography className='padded' variant='body2'>
						Targeted squares turn Green. Targeting doesn't confirm a ship is there.
					</Typography>
					<Typography variant='h6'>5. Unlocking Targets:</Typography>
					<Typography className='padded' variant='body2'>
						To unlock a target, click the "Unlock" button, then click the square.
					</Typography>{' '}
					<Typography className='padded' variant='body2'>
						Return to Scanning mode by clicking the "Scan" button.
					</Typography>
					<Typography variant='h6'>6. Continuing Scans:</Typography>
					<Typography className='padded' variant='body2'>
						To resume scanning, click the "Scan" button to go back to Scanning mode.
					</Typography>
					<Typography variant='h6'>7. Firing Strategy:</Typography>
					<Typography className='padded' variant='body2'>
						Don't 'Fire' until you've locked onto all the ships or you will lose.
					</Typography>
					<Typography variant='h6'>8. Accuracy Is Essential:</Typography>
					<Typography className='padded' variant='body2'>
						Don't 'Fire' at too many targets. The cloaked ships will be able to escape.
					</Typography>
				</DialogContent>

				<Button
					onClick={() => {
						handleClose();
					}}
				>
					Close
				</Button>
			</section>
		</Dialog>
	);
}
export default InstructionModule;
