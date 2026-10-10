import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Switch, FormControlLabel } from '@mui/material';
import FormHelperText from '@mui/material/FormHelperText';
import { X } from 'lucide-react';
import { LINK_BLUE, SWITCH_SX } from './Constants';
import './InstructionModule.css';

// Player preferences. Kept apart from How to Play so that dialog stays pure help,
// and so there is one obvious place to add the next setting (sound, reduced motion).
function SettingsModule({ open, onClose, confirmNewGame, setConfirmNewGame, reduceMotion, setReduceMotion, highContrast, setHighContrast }) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			aria-labelledby='settings-title'
			fullWidth
			maxWidth='xs'
			PaperProps={{
				className: 'instruction-module',
				sx: { backgroundColor: '#0f1116', backgroundImage: 'none', color: 'white' },
			}}
		>
			<DialogTitle component='div' className='dialog-title'>
				<h2 id='settings-title' className='dialog-heading'>
					Settings
				</h2>
				<IconButton aria-label='Close Settings' onClick={onClose} sx={{ color: 'white', minWidth: 44, minHeight: 44 }}>
					<X aria-hidden='true' />
				</IconButton>
			</DialogTitle>
			<DialogContent sx={{ '&&': { paddingTop: '24px' } }}>
				<FormControlLabel
					label='Confirm before starting a new game'
					sx={{ marginTop: '12px', marginLeft: 0 }}
					control={
						<Switch
							checked={confirmNewGame}
							onChange={(e) => setConfirmNewGame(e.target.checked)}
							inputProps={{ role: 'switch', 'aria-describedby': 'confirm-help' }}
							sx={SWITCH_SX}
						/>
					}
				/>
				<FormHelperText id='confirm-help' sx={{ color: '#e0e3df', margin: 0 }}>
					Ask before leaving a round you have already started. Your Victory Streak is never affected.
				</FormHelperText>

				<FormControlLabel
					label='Reduce motion'
					sx={{ marginTop: '20px', marginLeft: 0 }}
					control={
						<Switch
							checked={reduceMotion}
							onChange={(e) => setReduceMotion(e.target.checked)}
							inputProps={{ role: 'switch', 'aria-describedby': 'motion-help' }}
							sx={SWITCH_SX}
						/>
					}
				/>
				<FormHelperText id='motion-help' sx={{ color: '#e0e3df', margin: 0 }}>
					Turns off the scan animation and other transitions. Starts from your device&apos;s setting until you change it.
				</FormHelperText>

				<FormControlLabel
					label='Higher contrast'
					sx={{ marginTop: '20px', marginLeft: 0 }}
					control={
						<Switch
							checked={highContrast}
							onChange={(e) => setHighContrast(e.target.checked)}
							inputProps={{ role: 'switch', 'aria-describedby': 'contrast-help' }}
							sx={SWITCH_SX}
						/>
					}
				/>
				<FormHelperText id='contrast-help' sx={{ color: '#e0e3df', margin: 0 }}>
					Brighter borders around squares and controls, and a lighter fill on unscanned squares. Starts from your device&apos;s setting until you change it.
				</FormHelperText>
			</DialogContent>
			<DialogActions>
				<Button sx={{ color: LINK_BLUE }} onClick={onClose}>
					Close
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default SettingsModule;
