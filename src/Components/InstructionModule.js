import React from 'react';
import { Dialog, DialogContent, Button } from '@mui/material';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

function InstructionModule(props) {
	const handleClose = (value) => {
		props.setOpenInstructions(false);
	};

	return (
		<Dialog onClose={handleClose} open={props.openInstructions}>
			<DialogContent>
				<List dense={true}>
					<ListItem>
						<Typography variant='body2'>
							You will begin in "Scan" mode. Click on a square to scan for cloaked ships. Scans can not be made
							diagonally. The scan determines if a ship is in the clicked square or in one up, down, left, or right.
						</Typography>
					</ListItem>

					<ListItem>
						<Typography variant='body2'>
							If the cell is Black, there is no ship detected in the clicked or neighboring squares.
						</Typography>
					</ListItem>

					<ListItem>
						<Typography variant='body2'>
							If the cell is Blue, there is at least 1 cloaked ship next to the square. This could be up, down, left, or
							right. There could be more than 1 cloaked ship next to the square.
						</Typography>
					</ListItem>

					<ListItem>
						<Typography variant='body2'>
							If cell is Red, they have detected your scans and have fired. Game over.
						</Typography>
					</ListItem>

					<ListItem>
						<Typography variant='body2'>
							If you think you know a ship's location, you need to Lock Target. Click on the "Target" button to go into
							Targeting mode. Then click the square. Targetted squares are Green. Targetting doesn't mean a ship is
							located in the targeted cell.
						</Typography>
					</ListItem>

					<ListItem>
						<Typography variant='body2'>
							To continue scanning, click on the "Scan" button to return to "Scanning" mode.
						</Typography>
					</ListItem>

					<ListItem>
						<Typography variant='body2'>
							Wait to click 'Fire' until you have locked target on all of the ships. If you fire too early, you'll lose.
						</Typography>
					</ListItem>

					<ListItem>
						<Typography variant='body2'>
							Do not 'Fire' at too many targets. It will decrease accuracy and you will lose.
						</Typography>
					</ListItem>
					<ListItem>
						<Typography variant='body2'>
							To Unlock Targetting on a square, click the "Unlock" button and then click on the square. After clearing
							the square, return to Scanning mode by clicking the "Scan" button.
						</Typography>
					</ListItem>
				</List>
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
