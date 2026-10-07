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
		expect(statusStyle(CELL.TARGETED, FIELD_BG).bg).toBe('#ffb300');
		expect(statusStyle(CELL.SHIP, FIELD_BG).bg).toBe('#d32f2f');
		expect(statusStyle(CELL.DESTROYED, FIELD_BG).bg).toBe('#2e7d32');
	});

	test('every scanned status meets 4.5:1 contrast between its icon and fill', () => {
		const luminance = (named) => {
			const hex = { white: '#ffffff', black: '#000000' }[named] ?? named;
			const [r, g, b] = [1, 3, 5].map((i) => {
				const c = parseInt(hex.slice(i, i + 2), 16) / 255;
				return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
			});
			return 0.2126 * r + 0.7152 * g + 0.0722 * b;
		};
		[CELL.CLEAR, CELL.ADJACENT, CELL.TARGETED, CELL.SHIP, CELL.DESTROYED].forEach((status) => {
			const { bg, fontColor } = statusStyle(status, FIELD_BG);
			const [hi, lo] = [luminance(bg), luminance(fontColor)].sort((a, b) => b - a);
			expect((hi + 0.05) / (lo + 0.05)).toBeGreaterThanOrEqual(4.5);
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
