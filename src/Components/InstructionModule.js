import React from 'react';
import { Dialog, DialogContent, Button } from '@mui/material';
import Typography from '@mui/material/Typography';

function InstructionModule(props) {
	const handleClose = (value) => {
		props.setOpenInstructions(false);
	};

	return (
		<Dialog onClose={handleClose} open={props.openInstructions}>
			<DialogContent>
				<Typography variant='h5'>Welcome! Searching for cloaked ships is easy!</Typography>
				<Typography variant='h6'>1. Scanning for Ships:</Typography>
				<Typography variant='body2'>You start in "Scan" mode. click on a square to check for hidden ships.</Typography>
				<Typography variant='body2'></Typography>
				<Typography variant='h6'>2. Diagonal Mode:</Typography>
				<Typography variant='body2'>
					With Diagonal Mode Off, scans check for cloaked ships up, down, left, or right.
				</Typography>
				<Typography variant='body2'>Turn Diagonal Mode On to include diagonal scans in your search.</Typography>
				<Typography variant='h6'>3. Scan Results:</Typography>
				<Typography variant='body2'>Black means no ship detected in the clicked or neighboring squares.</Typography>
				<Typography variant='body2'>Blue indicates at least one cloaked ship nearby.</Typography>
				<Typography variant='body2'>
					Red means your scans have been detected, and the enemy has fired. Game over!
				</Typography>
				<Typography variant='h6'>4. Locking Targets:</Typography>
				<Typography variant='body2'>
					Click "Target" to activate Targeting mode, then click a square. Targeted squares turn Green. Targeting doesn't
					confirm a ship is there.
				</Typography>
				<Typography variant='h6'>5. Continuing Scans:</Typography>
				<Typography variant='body2'>To resume scanning, hit "Scan" to go back to Scanning mode.</Typography>
				<Typography variant='h6'>6. Firing Strategy:</Typography>
				<Typography variant='body2'>Don't 'Fire' until you've locked onto all the ships or you will lose.</Typography>
				<Typography variant='h6'>7.Accuracy Tip:</Typography>
				<Typography variant='body2'>Avoid firing at too many targets. Accuracy drops, and you risk losing.</Typography>
				<Typography variant='h6'>8. Unlocking Targets:</Typography>
				<Typography variant='body2'>
					To unlock a target, click "Unlock," then click the square. After clearing, return to Scanning mode with the
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
