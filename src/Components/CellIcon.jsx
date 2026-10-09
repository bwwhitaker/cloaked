import React from 'react';
import { Crosshair, Siren, Dot, Rocket, ShieldOff, Icon as LucideIcon } from 'lucide-react';

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

// The glyph for a cell state, or null for an unscanned cell. Shared by the board
// and the how-to-play legend so the two can never drift apart.
export default function CellIcon({ status }) {
	const Icon = STATE_ICON[status];

	if (status === 'destroyed') {
		// The ship with its cloak (shield) taken down: a small rocket with a
		// larger shield-off drawn over it, sharing the cell's centre.
		return (
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
	}
	if (Icon) {
		return <Icon size={ICON_SIZE[status] ?? DEFAULT_ICON_SIZE} strokeWidth={2} aria-hidden='true' />;
	}
	return null;
}
