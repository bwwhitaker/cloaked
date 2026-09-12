import { CELL, statusStyle } from './CellStatus';

describe('statusStyle', () => {
	const FIELD_BG = 'url(galaxy.webp)';

	test('an unscanned cell shows the board background', () => {
		expect(statusStyle(CELL.HIDDEN, FIELD_BG)).toEqual({
			bg: FIELD_BG,
			fontColor: 'black',
		});
	});

	test('a cell with no status yet is treated as hidden', () => {
		// SearchGrid keeps cellStatus as a sparse map, so every cell starts
		// undefined rather than explicitly HIDDEN.
		expect(statusStyle(undefined, FIELD_BG)).toEqual({
			bg: FIELD_BG,
			fontColor: 'black',
		});
		expect(statusStyle('', FIELD_BG)).toEqual({
			bg: FIELD_BG,
			fontColor: 'black',
		});
	});

	test('each scanned status resolves to its own colour', () => {
		expect(statusStyle(CELL.CLEAR, FIELD_BG).bg).toBe('black');
		expect(statusStyle(CELL.ADJACENT, FIELD_BG).bg).toBe('#1976d2');
		expect(statusStyle(CELL.TARGETED, FIELD_BG).bg).toBe('green');
		expect(statusStyle(CELL.SHIP, FIELD_BG).bg).toBe('#d32f2f');
	});

	test('every scanned status is legible against its background', () => {
		[CELL.CLEAR, CELL.ADJACENT, CELL.TARGETED, CELL.SHIP].forEach((status) => {
			expect(statusStyle(status, FIELD_BG).fontColor).toBe('white');
		});
	});

	test('an unrecognised status falls back instead of returning undefined', () => {
		// Square destructures this result. Before the fallback, a typo'd status
		// string returned undefined and took the whole board down with a
		// TypeError rather than rendering one wrong-coloured cell.
		expect(() => {
			const { bg } = statusStyle('not-a-real-status', FIELD_BG);
			return bg;
		}).not.toThrow();

		expect(statusStyle('not-a-real-status', FIELD_BG)).toEqual({
			bg: FIELD_BG,
			fontColor: 'black',
		});
	});

	test('CELL values are unique so two statuses cannot collide', () => {
		const values = Object.values(CELL);
		expect(new Set(values).size).toBe(values.length);
	});
});
