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
			<DialogContent>
				<Typography variant='h6'>Searching for cloaked ships is easy!</Typography>
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
					Black means no ship detected in the clicked or neighboring squares.
				</Typography>
				<Typography className='padded' variant='body2'>
					Blue indicates at least one cloaked ship nearby.
				</Typography>
				<Typography className='padded' variant='body2'>
					Red means your scans have been detected, and the enemy has fired. Game over!
				</Typography>
				<Typography variant='h6'>4. Locking Targets:</Typography>
				<Typography className='padded' variant='body2'>
					Click the "Target" button to activate Targeting mode, then click a square. Targeted squares turn Green.
					Targeting doesn't confirm a ship is there.
				</Typography>
				<Typography variant='h6'>5. Continuing Scans:</Typography>
				<Typography className='padded' variant='body2'>
					To resume scanning, click the "Scan" button to go back to Scanning mode.
				</Typography>
				<Typography variant='h6'>6. Firing Strategy:</Typography>
				<Typography className='padded' variant='body2'>
					Don't 'Fire' until you've locked onto all the ships or you will lose.
				</Typography>
				<Typography variant='h6'>7. Accuracy Tip:</Typography>
				<Typography className='padded' variant='body2'>
					Avoid firing at too many targets. Accuracy drops, and you risk losing.
				</Typography>
				<Typography variant='h6'>8. Unlocking Targets:</Typography>
				<Typography className='padded' variant='body2'>
					To unlock a target, click the "Unlock" button, then click the square. Return to Scanning mode by clicking the
					"Scan" button.
				</Typography>
			</DialogContent>
			<Button
				onClick={() => {
					handleClose();
				}}
			>
				Close
			</Button>
		</Dialog>
	);
}
export default InstructionModule;
