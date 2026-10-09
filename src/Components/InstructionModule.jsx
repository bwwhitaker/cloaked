import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton } from '@mui/material';
import { X } from 'lucide-react';
import Typography from '@mui/material/Typography';
import CellIcon from './CellIcon';
import { statusStyle } from './CellStatus';
import { LINK_BLUE } from './Constants';
import './InstructionModule.css';

// One cell, drawn with the same colours and icon as on the board, for the legend.
function Swatch({ status }) {
	const { bg, fontColor } = statusStyle(status, 'transparent');
	return (
		<span className='swatch' style={{ backgroundColor: bg, color: fontColor }} aria-hidden='true'>
			<CellIcon status={status} />
		</span>
	);
}

function LegendItem({ status, label, children }) {
	return (
		<li className='legend-item'>
			<Swatch status={status} />
			<span>
				<strong>{label}.</strong> {children}
			</span>
		</li>
	);
}

function InstructionModule(props) {
	const handleClose = () => {
		props.setOpenInstructions(false);
	};

	return (
		<Dialog
			onClose={handleClose}
			open={props.openInstructions}
			aria-labelledby='instructions-title'
			scroll='paper'
			fullWidth
			maxWidth='sm'
			PaperProps={{
				className: 'instruction-module',
				// sx, not just the class: MUI's own Paper styles are injected later and
				// win over a plain class, which left the dialog white.
				sx: { backgroundColor: '#0f1116', backgroundImage: 'none', color: 'white' },
			}}
		>
			{/* The title bar sits outside the scrolling content, so the close
			    button stays in view however far the player has read. */}
			<DialogTitle component='div' className='dialog-title'>
				{/* The id is on the text alone so the dialog's name is not "How to Play
				    Close How to Play". */}
				<h2 id='instructions-title' className='dialog-heading'>
					How to Play
				</h2>
				<IconButton aria-label='Close How to Play' onClick={handleClose} sx={{ color: 'white', minWidth: 44, minHeight: 44 }}>
					<X aria-hidden='true' />
				</IconButton>
			</DialogTitle>
				<DialogContent sx={{ '&&': { paddingTop: '24px' } }}>
					<Typography paragraph>
						Cloaked ships are hiding in the grid. Find every one before your scans give you away.
					</Typography>

					<Typography variant='h6' component='h3'>
						1. Scan for clues
					</Typography>
					<Typography paragraph>
						You start in Scan mode. Select a square to check it. Every result has its own color and icon:
					</Typography>
					<ul className='legend'>
						<LegendItem status='clear' label='Clear'>
							No ship in or next to this square.
						</LegendItem>
						<LegendItem status='adjacent' label='Warning'>
							A ship is in a neighboring square.
						</LegendItem>
						<LegendItem status='ship' label='Hit'>
							You scanned a ship and it fired first. The round is over.
						</LegendItem>
					</ul>
					<Typography paragraph>
						Your very first scan is a free pass: if it hits a ship the round still ends, but your Victory Streak is
						kept.
					</Typography>
					<Typography paragraph>
						With Diagonal Mode on, squares that touch at a corner count as neighbors too.
					</Typography>

					<Typography variant='h6' component='h3'>
						2. Target the ships
					</Typography>
					<ul className='legend'>
						<LegendItem status='targeted' label='Targeted'>
							Switch to Target mode and select the squares you think hold ships. It is only a guess, so the game does
							not confirm it.
						</LegendItem>
					</ul>
					<Typography paragraph>Use Unlock mode to remove a target. Switch back to Scan mode to keep scanning.</Typography>

					<Typography variant='h6' component='h3'>
						3. Fire
					</Typography>
					<Typography paragraph>
						Select Fire! when you have targeted every ship and nothing else. Fire too early or at the wrong squares and
						you lose.
					</Typography>
					<ul className='legend'>
						<LegendItem status='destroyed' label='Win'>
							The ships you found are destroyed.
						</LegendItem>
					</ul>
					<Typography paragraph>If you lose, every cloaked ship is revealed on the board.</Typography>

					<Typography variant='h6' component='h3'>
						Victory Streak
					</Typography>
					<Typography paragraph>
						Each win adds one to your Victory Streak. A loss resets it to 0. Your Best Streak is saved on this device.
					</Typography>

					<Typography variant='h6' component='h3'>
						Keyboard controls
					</Typography>
					<ul className='keys'>
						<li>Tab moves between the controls. The three modes are one stop, and so is the grid.</li>
						<li>Arrow keys switch between Scan, Target and Unlock.</li>
						<li>In the grid, arrow keys, Home and End move between squares.</li>
						<li>Enter or Space acts on the focused square or button.</li>
					</ul>

				</DialogContent>
				<DialogActions>
					<Button sx={{ color: LINK_BLUE }} onClick={handleClose}>
						Close
					</Button>
				</DialogActions>
		</Dialog>
	);
}

export default InstructionModule;
