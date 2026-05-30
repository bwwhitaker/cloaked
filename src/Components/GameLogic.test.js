import { isAdjacentToShip, isWin, isLuckyFirstScan, generateUniqueRandomNumbers } from './GameLogic';

// A deterministic stand-in for Math.random: returns the supplied values in
// order, then repeats the last one. Lets us pin down "random" placement.
const seededRng = (values) => {
	let i = 0;
	return () => values[Math.min(i++, values.length - 1)];
};

describe('isAdjacentToShip', () => {
	// Reference board (axis = 6, ids 1..36):
	//   1  2  3  4  5  6
	//   7  8  9 10 11 12
	//  13 14 15 16 17 18
	//  ...
	const axis = 6;

	test('detects ships directly above, below, left, and right', () => {
		expect(isAdjacentToShip(8, [2], axis)).toBe(true); // ship above
		expect(isAdjacentToShip(8, [14], axis)).toBe(true); // ship below
		expect(isAdjacentToShip(8, [7], axis)).toBe(true); // ship left
		expect(isAdjacentToShip(8, [9], axis)).toBe(true); // ship right
	});

	test('returns false when no ship is adjacent', () => {
		expect(isAdjacentToShip(8, [36], axis)).toBe(false);
		expect(isAdjacentToShip(8, [], axis)).toBe(false);
	});

	test('does not wrap a left-edge cell onto the previous row', () => {
		// Cell 7 is the left edge of row 2. Cell 6 (its id-1) is the right edge
		// of row 1 and must NOT count as a left neighbor.
		expect(isAdjacentToShip(7, [6], axis)).toBe(false);
	});

	test('does not wrap a right-edge cell onto the next row', () => {
		// Cell 6 is the right edge of row 1. Cell 7 (its id+1) is the left edge
		// of row 2 and must NOT count as a right neighbor.
		expect(isAdjacentToShip(6, [7], axis)).toBe(false);
	});

	test('corner cell only sees on-board neighbors', () => {
		// Cell 1 (top-left corner): left and up are off-board, so the only
		// orthogonal neighbors are right (2) and down (7).
		expect(isAdjacentToShip(1, [2], axis)).toBe(true); // right
		expect(isAdjacentToShip(1, [7], axis)).toBe(true); // down
		expect(isAdjacentToShip(1, [6], axis)).toBe(false); // same row, but 5 cells away — no wrap
	});

	test('ignores diagonal ships when diagonal mode is off', () => {
		expect(isAdjacentToShip(8, [1], axis, false)).toBe(false); // up-left
		expect(isAdjacentToShip(8, [3], axis, false)).toBe(false); // up-right
		expect(isAdjacentToShip(8, [13], axis, false)).toBe(false); // down-left
		expect(isAdjacentToShip(8, [15], axis, false)).toBe(false); // down-right
	});

	test('detects diagonal ships when diagonal mode is on', () => {
		expect(isAdjacentToShip(8, [1], axis, true)).toBe(true); // up-left
		expect(isAdjacentToShip(8, [3], axis, true)).toBe(true); // up-right
		expect(isAdjacentToShip(8, [13], axis, true)).toBe(true); // down-left
		expect(isAdjacentToShip(8, [15], axis, true)).toBe(true); // down-right
	});

	test('diagonal mode still respects horizontal edges', () => {
		// Cell 7 (left edge). Its up-left (id-7=0) and down-left (id+5=12, the
		// right edge of row 2) must not count.
		expect(isAdjacentToShip(7, [12], axis, true)).toBe(false); // would-be down-left wrap
		// Cell 12 (right edge). Its up-right (id-5=7, left edge of row 1) wraps.
		expect(isAdjacentToShip(12, [7], axis, true)).toBe(false);
	});
});

describe('isWin', () => {
	test('wins when targets exactly match ships, regardless of order', () => {
		expect(isWin([5, 12, 30], [30, 5, 12])).toBe(true);
	});

	test('ignores duplicate targets', () => {
		expect(isWin([5, 12], [5, 5, 12, 12])).toBe(true);
	});

	test('loses when a ship is missed', () => {
		expect(isWin([5, 12, 30], [5, 12])).toBe(false);
	});

	test('loses when an extra cell is targeted', () => {
		expect(isWin([5, 12], [5, 12, 30])).toBe(false);
	});

	test('loses when a target is wrong', () => {
		expect(isWin([5, 12], [5, 13])).toBe(false);
	});
});

describe('isLuckyFirstScan', () => {
	test('is lucky on the first scan of an untargeted cell', () => {
		expect(isLuckyFirstScan(0, 10, [])).toBe(true);
	});

	test('is not lucky if the cell was already targeted', () => {
		expect(isLuckyFirstScan(0, 10, [10])).toBe(false);
	});

	test('is not lucky after the first scan', () => {
		expect(isLuckyFirstScan(1, 10, [])).toBe(false);
	});
});

describe('generateUniqueRandomNumbers', () => {
	test('returns the requested count of unique ids within range', () => {
		for (let trial = 0; trial < 100; trial++) {
			const result = generateUniqueRandomNumbers(5, 36);
			expect(result).toHaveLength(5);
			expect(new Set(result).size).toBe(5);
			result.forEach((n) => {
				expect(n).toBeGreaterThanOrEqual(1);
				expect(n).toBeLessThanOrEqual(36);
			});
		}
	});

	test('preserves the existing ids', () => {
		const result = generateUniqueRandomNumbers(5, 36, [3, 17]);
		expect(result).toHaveLength(5);
		expect(result).toContain(3);
		expect(result).toContain(17);
		expect(new Set(result).size).toBe(5);
	});

	test('is deterministic with an injected rng', () => {
		// floor(0 * 36) + 1 = 1, floor(0.5 * 36) + 1 = 19, floor(0.99 * 36) + 1 = 36
		const rng = seededRng([0, 0.5, 0.99]);
		expect(generateUniqueRandomNumbers(3, 36, [], rng)).toEqual([1, 19, 36]);
	});

	test('skips collisions from the rng without looping forever', () => {
		// Same value twice in a row, then a fresh one.
		const rng = seededRng([0, 0, 0.5]);
		expect(generateUniqueRandomNumbers(2, 36, [], rng)).toEqual([1, 19]);
	});

	test('returns existing ids untouched when count is already satisfied', () => {
		expect(generateUniqueRandomNumbers(2, 36, [4, 9])).toEqual([4, 9]);
	});
});
