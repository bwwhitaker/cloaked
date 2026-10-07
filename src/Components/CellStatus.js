export const CELL = {
	HIDDEN: 'hidden', // not yet clicked → shows the field background
	TARGETED: 'targeted', // marked as a suspected ship
	ADJACENT: 'adjacent', // scanned, a ship is next to it
	CLEAR: 'clear', // scanned, nothing nearby
	SHIP: 'ship', // scanned directly onto a ship
};

const STYLES = {
	// Amber with near-black text: far lighter than the red ship cell, so the two
	// stay apart for red/green colour-blind players (each also has its own icon).
	[CELL.TARGETED]: { bg: '#ffb300', fontColor: '#111111' },
	[CELL.ADJACENT]: { bg: '#1976d2', fontColor: 'white' },
	[CELL.CLEAR]: { bg: 'black', fontColor: 'white' },
	[CELL.SHIP]: { bg: '#d32f2f', fontColor: 'white' },
};

// Resolve a status (plus the board's default background) to actual colors.
// An unrecognised status falls back to the hidden style rather than returning
// undefined — Square destructures this result, so undefined would throw and
// take the whole board down over a typo'd status string.
export function statusStyle(status, fieldBg) {
	const hidden = { bg: fieldBg, fontColor: 'black' };
	if (!status || status === CELL.HIDDEN) return hidden;
	return STYLES[status] ?? hidden;
}
