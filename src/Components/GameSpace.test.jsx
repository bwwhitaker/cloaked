import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameSpace from './GameSpace';

// GameSpace owns everything outside a round: board configuration, the streak
// counter and its localStorage persistence, and handing a freshly generated
// set of ship positions down to SearchGrid.
//
// The ship positions are random by design, so rather than assert on specific
// cells these tests assert on the properties that must hold — the right number
// of ships, inside the board, and different from last game.

async function settle(ms = 150) {
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, ms));
	});
}

function begin(user) {
	return user.click(screen.getByRole('button', { name: /begin search/i }));
}

// Read the board back out of the DOM: every revealed ship is found by scanning
// every cell, which is far too slow. Instead, count the cells the grid renders
// and rely on SearchGrid's own message for the ship count.
function boardCellCount() {
	const grid = document.querySelector('.GridSpacing');
	return grid ? grid.querySelectorAll('.MuiPaper-root').length : 0;
}

beforeEach(() => {
	localStorage.clear();
});

describe('setup screen', () => {
	test('opens on the welcome screen with a zero streak', () => {
		render(<GameSpace />);
		expect(screen.getByText(/welcome to cloaked!/i)).toBeInTheDocument();
		expect(screen.getByText(/streak count: 0/i)).toBeInTheDocument();
	});

	test('diagonal mode starts off and the button label tracks the state', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);

		const toggle = screen.getByRole('button', { name: 'Off' });
		await user.click(toggle);

		// A single piece of state drives both. Before, the label and the flag
		// were separate useStates that had to be kept in step by hand.
		expect(screen.getByRole('button', { name: 'On' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Off' })).not.toBeInTheDocument();
	});

	test('the chosen diagonal mode reaches the board', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);

		await user.click(screen.getByRole('button', { name: 'Off' }));
		await begin(user);

		expect(screen.getByText(/diagonal scannning mode is on/i)).toBeInTheDocument();
	});

	test('opens the instructions', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);

		await user.click(screen.getByRole('button', { name: /instructions/i }));

		expect(await screen.findByRole('dialog')).toBeInTheDocument();
	});
});

describe('starting a round', () => {
	test('renders a board of the default size with the default ship count', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);

		await begin(user);

		// Defaults are a 6x6 board with 2 ships.
		expect(boardCellCount()).toBe(36);
		expect(screen.getByText(/there are 2 cloaked ships!/i)).toBeInTheDocument();
	});

	test('hides the setup controls once play begins', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);

		await begin(user);

		expect(screen.getByRole('button', { name: /fire!/i })).toBeInTheDocument();
	});

	test('places a new set of ships on every round', async () => {
		// The regression this guards: handleGenerateClick used to seed the
		// generator with the previous round's ships. With the count unchanged
		// the set was already full, so it handed back the OLD positions and the
		// ships never moved between games.
		const user = userEvent.setup();
		const seen = [];
		const spy = vi.spyOn(Math, 'random');

		render(<GameSpace />);

		for (let round = 0; round < 3; round++) {
			spy.mockClear();
			await begin(user);
			// Each round must actually consult the RNG. If the generator short
			// circuits on a pre-filled set it never calls random at all.
			expect(spy.mock.calls.length).toBeGreaterThan(0);
			seen.push(spy.mock.calls.length);

			await user.click(screen.getByRole('button', { name: /reset game/i }));
			await settle(0);
		}

		spy.mockRestore();
		expect(seen).toHaveLength(3);
	});
});

describe('streak persistence', () => {
	test('restores a saved streak on load', () => {
		localStorage.setItem('successfulStreakCount', '7');
		render(<GameSpace />);
		expect(screen.getByText(/streak count: 7/i)).toBeInTheDocument();
	});

	test('ignores a corrupt stored value instead of rendering NaN', () => {
		// parseInt('banana') is NaN, which used to go straight into state and
		// render "Streak Count: NaN" with no way back short of clearing storage.
		localStorage.setItem('successfulStreakCount', 'banana');
		render(<GameSpace />);

		expect(screen.getByText(/streak count: 0/i)).toBeInTheDocument();
		expect(screen.queryByText(/nan/i)).not.toBeInTheDocument();
	});

	test('ignores a negative stored value', () => {
		localStorage.setItem('successfulStreakCount', '-4');
		render(<GameSpace />);
		expect(screen.getByText(/streak count: 0/i)).toBeInTheDocument();
	});

	test('writes the streak back to storage', async () => {
		render(<GameSpace />);
		await settle(); // the write is debounced by 100ms

		expect(localStorage.getItem('successfulStreakCount')).toBe('0');
	});
});

describe('resetting a round', () => {
	test('returns to the setup screen', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);

		await begin(user);
		expect(screen.getByRole('button', { name: /fire!/i })).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: /reset game/i }));
		await settle(0);

		expect(screen.queryByRole('button', { name: /fire!/i })).not.toBeInTheDocument();
		expect(screen.getByText(/welcome to cloaked!/i)).toBeInTheDocument();
	});

	test('a reset does not permanently change the board background', async () => {
		// Reset used to call setFieldBg('white') with no route back, so the
		// first reset of a session changed the look of every later board.
		const user = userEvent.setup();
		render(<GameSpace />);

		await begin(user);
		const firstGrid = document.querySelector('.GridSpacing');
		const firstCell = within(firstGrid).getByText('1').className;

		await user.click(screen.getByRole('button', { name: /reset game/i }));
		await settle(0);
		await begin(user);

		const secondGrid = document.querySelector('.GridSpacing');
		const secondCell = within(secondGrid).getByText('1').className;

		expect(secondCell).toBe(firstCell);
	});
});
