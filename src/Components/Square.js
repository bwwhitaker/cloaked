import React from 'react';
import { Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import Scanning from './Scanning';
import { statusStyle } from './CellStatus';
import './GameSpace.css';
import { CELL_SIZE, REVEAL_DELAY } from './Constants';

const PaperPlace = styled(Paper)({
	textAlign: 'center',
	fontSize: '15px',
	height: CELL_SIZE,
	width: CELL_SIZE,
	lineHeight: `${CELL_SIZE}px`,
	justifyContent: 'center',
	transition: `background-color ${REVEAL_DELAY / 1000}s ease`,
	'&:hover': { cursor: 'pointer' },
});

function Square(props) {
	const { bg, fontColor } = statusStyle(props.status, props.bg);

	return (
		<PaperPlace
			square
			variant='outlined'
			sx={{ backgroundColor: bg, color: fontColor }}
			onClick={() => props.onSquareClick(props.title)}
		>
			{' '}
			{props.scanning ? <Scanning /> : props.title}
		</PaperPlace>
	);
}

export default Square;
