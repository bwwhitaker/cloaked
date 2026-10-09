import React, { useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Button,
	Checkbox,
	FormControlLabel,
} from '@mui/material';
import { LINK_BLUE } from './Constants';

// Shown before a mid-round "New Game". Cancel gets the focus, so a stray Enter
// keeps the round instead of throwing it away.
export default function ResetConfirmDialog({ open, onCancel, onConfirm, onExited }) {
	const [dontAsk, setDontAsk] = useState(false);

	return (
		<Dialog
			open={open}
			onClose={onCancel}
			TransitionProps={{ onExited: () => onExited?.() }}
			aria-labelledby='reset-title'
			aria-describedby='reset-body'
			PaperProps={{ sx: { backgroundColor: '#0f1116', backgroundImage: 'none', color: 'white' } }}
		>
			<DialogTitle id='reset-title'>Leave this round?</DialogTitle>
			<DialogContent>
				<DialogContentText id='reset-body' sx={{ color: '#e0e3df' }}>
					Your board will be lost. Your Victory Streak is not affected.
				</DialogContentText>
				<FormControlLabel
					sx={{ marginTop: '8px', color: '#e0e3df' }}
					control={
						<Checkbox
							checked={dontAsk}
							onChange={(e) => setDontAsk(e.target.checked)}
							sx={{ color: '#e0e3df', '&.Mui-checked': { color: LINK_BLUE } }}
						/>
					}
					label="Don't ask me again"
				/>
			</DialogContent>
			<DialogActions>
				<Button autoFocus sx={{ color: LINK_BLUE }} onClick={onCancel}>
					Cancel
				</Button>
				<Button variant='contained' onClick={() => onConfirm(dontAsk)}>
					New Game
				</Button>
			</DialogActions>
		</Dialog>
	);
}
