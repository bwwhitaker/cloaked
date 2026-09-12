// Pure, framework-free game logic for Cloaked.
//
// This logic used to live inside the React components, which made it
// impossible to test without rendering the whole UI. Extracting it here keeps
// the rules in one place and lets us unit-test the tricky bits (board-edge
// adjacency math, win detection) directly.
//
// Board model: cells are numbered 1..(axis * axis), left-to-right then
// top-to-bottom. For an `axis`-wide board a cell's column is
// ((id - 1) % axis) + 1, which means `id % axis === 1` is the left edge and
// `id % axis === 0` is the right edge.

const includes = (value, array) => array.includes(value);

/**
 * Is `id` orthogonally (and optionally diagonally) adjacent to any ship?
 *
 * Horizontal neighbors are guarded so they don't "wrap" onto the previous or
 * next row (e.g. the cell to the left of a left-edge cell). Vertical neighbors
 * need no guard: off-board ids simply won't appear in `ships`.
 *
 * @param {number} id - the cell being scanned (1-indexed)
 * @param {number[]} ships - ship cell ids
 * @param {number} axis - board width (cells per row)
 * @param {boolean} [diagonal=false] - also check the four diagonal neighbors
 * @returns {boolean}
 */
export function isAdjacentToShip(id, ships, axis, diagonal = false) {
	const left = id - 1;
	const right = id + 1;
	const up = id - axis;
	const down = id + axis;
	const upLeft = id - axis - 1;
	const upRight = id - axis + 1;
	const downLeft = id + axis - 1;
	const downRight = id + axis + 1;

	const notLeftEdge = id % axis !== 1;
	const notRightEdge = id % axis !== 0;

	if (includes(left, ships) && notLeftEdge) return true;
	if (includes(right, ships) && notRightEdge) return true;
	if (includes(up, ships)) return true;
	if (includes(down, ships)) return true;

	if (!diagonal) return false;

	if (includes(upLeft, ships) && notLeftEdge) return true;
	if (includes(upRight, ships) && notRightEdge) return true;
	if (includes(downLeft, ships) && notLeftEdge) return true;
	if (includes(downRight, ships) && notRightEdge) return true;
	return false;
}

/**
 * The player wins when the set of targeted cells exactly matches the set of
 * ship cells. Order doesn't matter and duplicate targets are ignored.
 *
 * @param {number[]} shipLocations
 * @param {number[]} targeted
 * @returns {boolean}
 */
export function isWin(shipLocations, targeted) {
	const normalize = (arr) => [...new Set(arr)].sort((a, b) => a - b);
	const ships = normalize(shipLocations);
	const guesses = normalize(targeted);
	if (ships.length !== guesses.length) return false;
	return ships.every((value, i) => value === guesses[i]);
}

/**
 * A "lucky shot" is the very first scan of the game landing on a ship that the
 * player had not already targeted. It spares the player's streak.
 *
 * `ships` is checked here rather than assumed. The caller happens to only
 * invoke this after confirming a ship hit, but a reader of this module cannot
 * see that, and a docblock that depends on invisible caller discipline is a
 * docblock that will eventually be wrong.
 *
 * @param {number} scanCount - scans taken so far this game (before this one)
 * @param {number} id - the cell just scanned
 * @param {number[]} targeted - currently targeted cells
 * @param {number[]} ships - ship cell ids
 * @returns {boolean}
 */
export function isLuckyFirstScan(scanCount, id, targeted, ships) {
	return scanCount < 1 && ships.includes(id) && !targeted.includes(id);
}

/**
 * Generate `count` unique cell ids in the range 1..maxValue, preserving any
 * ids already in `existing`. An injectable `rng` keeps this deterministic in
 * tests; production callers can omit it to use Math.random.
 *
 * @param {number} count - total unique numbers wanted
 * @param {number} maxValue - inclusive upper bound (lower bound is 1)
 * @param {number[]} [existing=[]] - ids to keep
 * @param {() => number} [rng=Math.random] - returns a float in [0, 1)
 * @returns {number[]}
 * @throws {RangeError} if the request cannot be satisfied
 */
export function generateUniqueRandomNumbers(count, maxValue, existing = [], rng = Math.random) {
	// Without this guard the loop below spins forever: asking for more unique
	// ids than the range contains means `numbers.size` can never reach `count`.
	// Today's UI caps ships at 5 on a 16-cell board so it is unreachable, but an
	// unbounded while-loop is not something to leave sitting in the one module
	// the whole game depends on.
	if (!Number.isInteger(count) || count < 0) {
		throw new RangeError(`count must be a non-negative integer, got ${count}`);
	}
	if (!Number.isInteger(maxValue) || maxValue < 0) {
		throw new RangeError(`maxValue must be a non-negative integer, got ${maxValue}`);
	}
	if (count > maxValue) {
		throw new RangeError(`cannot pick ${count} unique ids from a range of ${maxValue}`);
	}

	const numbers = new Set(existing);
	while (numbers.size < count) {
		numbers.add(Math.floor(rng() * maxValue) + 1);
	}
	return Array.from(numbers);
}
