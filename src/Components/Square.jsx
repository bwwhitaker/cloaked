import React from 'react';
import { ButtonBase } from '@mui/material';
import { Crosshair, Siren, Dot, Rocket, ShieldOff, Icon as LucideIcon } from 'lucide-react';
import { styled } from '@mui/material/styles';
import Scanning from './Scanning';
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

// A glyph per state so colour is never the only cue. Icons inherit the cell's
// text colour (currentColor) and are hidden from assistive tech: the state is
// already in the button's aria-label.
const STATE_ICON = {
	targeted: Crosshair,
	adjacent: Siren,
	clear: Dot,
	ship: Rocket,
};

// Lucide's rocket with the exhaust flame (the teardrop at lower left) left out,
// for the destroyed state: a ship that has been stopped is not firing its engine.
const ROCKET_NO_FLAME = [
	['path', { d: 'M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5' }],
	['path', { d: 'M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z' }],
	['path', { d: 'M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05' }],
];

// Dot is a single point, so it keeps the larger size to stay noticeable.
const ICON_SIZE = { clear: 26 };
const DEFAULT_ICON_SIZE = 22;

function Square(props) {
	const { bg, fontColor } = statusStyle(props.status, props.bg);
	const state = STATE_LABEL[props.status] ?? STATE_LABEL.hidden;
	const Icon = STATE_ICON[props.status];

	let icon = null;
	if (props.status === 'destroyed') {
		// The ship with its cloak (shield) taken down: a small rocket with a
		// larger shield-off drawn over it, sharing the cell's centre.
		icon = (
			<span style={{ position: 'relative', display: 'inline-flex' }} aria-hidden='true'>
				<LucideIcon
					iconNode={ROCKET_NO_FLAME}
					size={19}
					strokeWidth={2.5}
					style={{ position: 'relative', left: -1.5, top: 1.5 }} // nudge toward the shield's centre
				/>
				<ShieldOff size={35} strokeWidth={1.25} style={{ position: 'absolute', top: -8, left: -8 }} />
			</span>
		);
	} else if (Icon) {
		icon = <Icon size={ICON_SIZE[props.status] ?? DEFAULT_ICON_SIZE} strokeWidth={2} aria-hidden='true' />;
	}

	return (
		<CellButton
			data-cell-id={props.id}
			aria-label={`${props.name}, ${state}`}
			tabIndex={props.focusable ? 0 : -1}
			sx={{ backgroundColor: bg, color: fontColor }}
			onClick={() => props.onSquareClick(props.id)}
			onFocus={() => props.onFocusCell(props.id)}
		>
			{props.scanning ? <Scanning /> : icon}
		</CellButton>
	);
}

export default Square;
