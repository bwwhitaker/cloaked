import React from 'react';
import { ButtonBase } from '@mui/material';
import { styled } from '@mui/material/styles';
import Scanning from './Scanning';
import CellIcon from './CellIcon';
import { statusStyle } from './CellStatus';
import { CELL_SIZE, REVEAL_DELAY } from './Constants';
import './GameSpace.css';

// A real <button>, so cells are focusable and activate with Enter/Space
// without any extra key handling. Colour alone cannot carry the state, so the
// state is also spoken through aria-label (see STATE_LABEL).
const CellButton = styled(ButtonBase)({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	height: CELL_SIZE,
	width: CELL_SIZE,
	boxSizing: 'border-box',
	border: '1px solid rgba(255,255,255,0.12)',
	transition: `background-color ${REVEAL_DELAY / 1000}s ease`,
	'&:focus-visible': { outline: '3px solid #ffffff', outlineOffset: '-3px' },
});

const STATE_LABEL = {
	hidden: 'not scanned',
	targeted: 'targeted',
	adjacent: 'scanned, ship adjacent',
	clear: 'scanned, clear',
	ship: 'ship found',
	destroyed: 'ship destroyed',
};

function Square(props) {
	const { bg, fontColor } = statusStyle(props.status, props.bg);
	const state = STATE_LABEL[props.status] ?? STATE_LABEL.hidden;

	return (
		<CellButton
			data-cell-id={props.id}
			aria-label={`${props.name}, ${state}`}
			tabIndex={props.focusable ? 0 : -1}
			sx={{ backgroundColor: bg, color: fontColor }}
			onClick={() => props.onSquareClick(props.id)}
			onFocus={() => props.onFocusCell(props.id)}
		>
			{props.scanning ? <Scanning /> : <CellIcon status={props.status} />}
		</CellButton>
	);
}

export default Square;
