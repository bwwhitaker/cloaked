export const CELL = {
	HIDDEN: 'hidden', // not yet clicked → shows the field background
	TARGETED: 'targeted', // marked as a suspected ship
	ADJACENT: 'adjacent', // scanned, a ship is next to it
	CLEAR: 'clear', // scanned, nothing nearby
	SHIP: 'ship', // scanned directly onto a ship
};

const STYLES = {
	[CELL.TARGETED]: { bg: 'green', fontColor: 'white' },
	[CELL.ADJACENT]: { bg: '#1976d2', fontColor: 'white' },
	[CELL.CLEAR]: { bg: 'black', fontColor: 'white' },
	[CELL.SHIP]: { bg: '#d32f2f', fontColor: 'white' },
};

// Resolve a status (plus the board's default background) to actual colors.
export function statusStyle(status, fieldBg) {
	if (!status || status === CELL.HIDDEN) {
		return { bg: fieldBg, fontColor: 'black' };
	}
	return STYLES[status];
}
