import { render, screen, within, act, waitFor } from '@testing-library/react';
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

// The streak badge splits its words across spans (some are hidden on phones),
// so read the badge as a whole.
function badge() {
	return document.querySelector('.StreakBadge');
}

function begin(user) {
	return user.click(screen.getByRole('button', { name: /start scanning/i }));
}

// Read the board back out of the DOM: every revealed ship is found by scanning
// every cell, which is far too slow. Instead, count the cells the grid renders
// and rely on SearchGrid's own message for the ship count.
function boardCellCount() {
	const grid = document.querySelector('.GridSpacing');
	return grid ? grid.querySelectorAll('[data-cell-id]').length : 0;
}

beforeEach(() => {
	localStorage.clear();
});

describe('setup screen', () => {
	test('opens on the welcome screen with a zero streak', () => {
		render(<GameSpace />);
		expect(screen.getByText(/welcome to cloaked!/i)).toBeInTheDocument();
		expect(badge()).toHaveTextContent(/victory streak: 0/i);
	});

	test('diagonal mode is a labelled switch that starts off', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);

		const toggle = screen.getByRole('switch', { name: /diagonal mode/i });
		expect(toggle).not.toBeChecked();
		expect(toggle).toHaveAccessibleDescription(/squares that touch at a corner/i);

		await user.click(toggle);

		// One piece of state drives the switch and the flag the board receives.
		expect(toggle).toBeChecked();
	});

	test('the chosen diagonal mode reaches the board', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);

		await user.click(screen.getByRole('switch', { name: /diagonal mode/i }));
		await begin(user);

		expect(screen.getByText(/diagonal scannning mode is on/i)).toBeInTheDocument();
	});

	test('opens How to Play', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);

		await user.click(screen.getByRole('button', { name: /how to play/i }));

		expect(await screen.findByRole('dialog')).toBeInTheDocument();
	});

	test('How to Play sits right after Start scanning, with one copy per screen', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);

		expect(screen.getAllByRole('button', { name: /how to play/i })).toHaveLength(1);

		// Tab order: the primary action first, then the help button.
		screen.getByRole('button', { name: /start scanning/i }).focus();
		await user.tab();
		expect(screen.getByRole('button', { name: /how to play/i })).toHaveFocus();

		await begin(user);
		expect(screen.getAllByRole('button', { name: /how to play/i })).toHaveLength(1);
	});

	test('the How to Play dialog is named and shows the cell legend', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);

		await user.click(screen.getByRole('button', { name: /how to play/i }));

		const dialog = await screen.findByRole('dialog', { name: /how to play/i });
		expect(within(dialog).getByRole('heading', { name: /victory streak/i })).toBeInTheDocument();
		// A close button in the title bar, always in view, as well as the one at the bottom.
		expect(within(dialog).getByRole('button', { name: 'Close How to Play' })).toBeInTheDocument();
		expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument();
		for (const label of [/clear\./i, /warning\./i, /hit\./i, /targeted\./i, /win\./i]) {
			expect(within(dialog).getByText(label)).toBeInTheDocument();
		}
	});

	test('the streak badge explains itself to assistive technology', () => {
		render(<GameSpace />);
		const streakBadge = badge();
		expect(streakBadge).toHaveAccessibleDescription(/consecutive wins/i);
		expect(streakBadge).toHaveTextContent(/best streak: 0/i);
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

			await user.click(screen.getByRole('button', { name: /new game/i }));
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
		expect(badge()).toHaveTextContent(/victory streak: 7/i);
	});

	test('ignores a corrupt stored value instead of rendering NaN', () => {
		// parseInt('banana') is NaN, which used to go straight into state and
		// render "Victory Streak: NaN" with no way back short of clearing storage.
		localStorage.setItem('successfulStreakCount', 'banana');
		render(<GameSpace />);

		expect(badge()).toHaveTextContent(/victory streak: 0/i);
		expect(screen.queryByText(/nan/i)).not.toBeInTheDocument();
	});

	test('ignores a negative stored value', () => {
		localStorage.setItem('successfulStreakCount', '-4');
		render(<GameSpace />);
		expect(badge()).toHaveTextContent(/victory streak: 0/i);
	});

	test('restores the best streak and never shows it below the current streak', () => {
		localStorage.setItem('successfulStreakCount', '3');
		localStorage.setItem('bestStreakCount', '9');
		const { unmount } = render(<GameSpace />);
		expect(badge()).toHaveTextContent(/best streak: 9/i);
		unmount();

		// A saved streak above the saved best means the best was never written.
		localStorage.setItem('successfulStreakCount', '5');
		localStorage.setItem('bestStreakCount', '2');
		render(<GameSpace />);
		expect(badge()).toHaveTextContent(/best streak: 5/i);
	});

	test('ignores a corrupt stored best streak', () => {
		localStorage.setItem('bestStreakCount', 'banana');
		render(<GameSpace />);
		expect(badge()).toHaveTextContent(/best streak: 0/i);
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

		await user.click(screen.getByRole('button', { name: /new game/i }));
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
		const firstCell = within(firstGrid).getByRole('button', { name: /^row 1, column 1,/ }).className;

		await user.click(screen.getByRole('button', { name: /new game/i }));
		await settle(0);
		await begin(user);

		const secondGrid = document.querySelector('.GridSpacing');
		const secondCell = within(secondGrid).getByRole('button', { name: /^row 1, column 1,/ }).className;

		expect(secondCell).toBe(firstCell);
	});
});

describe('returning to the setup screen', () => {
	test('focus lands on Start scanning after New Game', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);
		await begin(user);

		await user.click(screen.getByRole('button', { name: /new game/i }));

		await waitFor(() => expect(screen.getByRole('button', { name: /start scanning/i })).toHaveFocus());
	});
});

describe('settings', () => {
	test('a Settings button sits in the header on both screens', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);
		expect(screen.getAllByRole('button', { name: 'Settings' })).toHaveLength(1);

		await begin(user);
		expect(screen.getAllByRole('button', { name: 'Settings' })).toHaveLength(1);
	});

	test('the Settings dialog is named and has its own close button; How to Play has no settings', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);

		await user.click(screen.getByRole('button', { name: 'Settings' }));
		const settings = await screen.findByRole('dialog', { name: 'Settings' });
		expect(within(settings).getByRole('button', { name: 'Close Settings' })).toBeInTheDocument();
		expect(within(settings).getByRole('switch', { name: /confirm before starting a new game/i })).toBeChecked();
		await user.click(within(settings).getByRole('button', { name: 'Close Settings' }));

		await user.click(await screen.findByRole('button', { name: /how to play/i }));
		const help = await screen.findByRole('dialog', { name: /how to play/i });
		expect(within(help).queryByRole('switch')).not.toBeInTheDocument();
	});
});

describe('reduce motion', () => {
	afterEach(() => {
		delete document.documentElement.dataset.reduceMotion;
		vi.unstubAllGlobals();
	});

	test('off by default, and the switch turns it on and remembers it', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);
		expect(document.documentElement.dataset.reduceMotion).toBe('false');

		await user.click(screen.getByRole('button', { name: 'Settings' }));
		const settings = await screen.findByRole('dialog', { name: 'Settings' });
		const toggle = within(settings).getByRole('switch', { name: /reduce motion/i });
		expect(toggle).not.toBeChecked();

		await user.click(toggle);
		expect(toggle).toBeChecked();
		expect(document.documentElement.dataset.reduceMotion).toBe('true');
		expect(localStorage.getItem('reduceMotion')).toBe('true');
	});

	test('starts from the device setting when the player has not chosen', () => {
		vi.stubGlobal('matchMedia', (query) => ({ matches: query.includes('reduce'), media: query }));
		render(<GameSpace />);
		expect(document.documentElement.dataset.reduceMotion).toBe('true');
	});

	test("a saved choice beats the device setting", () => {
		vi.stubGlobal('matchMedia', (query) => ({ matches: query.includes('reduce'), media: query }));
		localStorage.setItem('reduceMotion', 'false');
		render(<GameSpace />);
		expect(document.documentElement.dataset.reduceMotion).toBe('false');
	});
});

describe('confirming a new game', () => {
	// Target mode marks a cell without scanning it, so a round can be "touched"
	// with no chance of hitting a random ship and ending it.
	async function touchRound(user) {
		await user.click(screen.getByRole('radio', { name: 'Target' }));
		const grid = document.querySelector('.GridSpacing');
		await user.click(within(grid).getByRole('button', { name: /^row 1, column 1,/ }));
		await settle(0);
	}

	test('asks first once there is progress, and Cancel keeps the round', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);
		await begin(user);
		await touchRound(user);

		await user.click(screen.getByRole('button', { name: /new game/i }));

		const dialog = await screen.findByRole('dialog', { name: /leave this round/i });
		expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();

		await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
		// findBy: the page stays aria-hidden until the dialog's exit transition ends.
		expect(await screen.findByRole('button', { name: /fire!/i })).toBeInTheDocument();
	});

	test('confirming starts a new game, and the streak is untouched', async () => {
		localStorage.setItem('successfulStreakCount', '4');
		const user = userEvent.setup();
		render(<GameSpace />);
		await begin(user);
		await touchRound(user);

		await user.click(screen.getByRole('button', { name: /new game/i }));
		const dialog = await screen.findByRole('dialog', { name: /leave this round/i });
		await user.click(within(dialog).getByRole('button', { name: 'New Game' }));
		await settle(0);

		expect(screen.getByText(/welcome to cloaked!/i)).toBeInTheDocument();
		expect(badge()).toHaveTextContent(/victory streak: 4/i);
	});

	test("'Don't ask me again' is remembered and can be turned back on in Settings", async () => {
		const user = userEvent.setup();
		render(<GameSpace />);
		await begin(user);
		await touchRound(user);

		await user.click(screen.getByRole('button', { name: /new game/i }));
		const dialog = await screen.findByRole('dialog', { name: /leave this round/i });
		await user.click(within(dialog).getByRole('checkbox', { name: /don't ask me again/i }));
		await user.click(within(dialog).getByRole('button', { name: 'New Game' }));
		await settle(0);
		expect(localStorage.getItem('confirmNewGame')).toBe('false');

		// Next time it goes straight through. (findBy: the page stays aria-hidden
		// until the dialog's exit transition ends.)
		await screen.findByRole('button', { name: /start scanning/i });
		await begin(user);
		await touchRound(user);
		await user.click(screen.getByRole('button', { name: /new game/i }));
		await settle(0);
		expect(screen.queryByRole('dialog', { name: /leave this round/i })).not.toBeInTheDocument();
		expect(screen.getByText(/welcome to cloaked!/i)).toBeInTheDocument();

		// And the switch in Settings brings the warning back.
		await user.click(await screen.findByRole('button', { name: 'Settings' }));
		const settings = await screen.findByRole('dialog', { name: 'Settings' });
		const toggle = within(settings).getByRole('switch', { name: /confirm before starting a new game/i });
		expect(toggle).not.toBeChecked();
		await user.click(toggle);
		expect(localStorage.getItem('confirmNewGame')).toBe('true');
	});

	test('no warning when nothing has been done yet this round', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);
		await begin(user);

		await user.click(screen.getByRole('button', { name: /new game/i }));
		await settle(0);

		expect(screen.queryByRole('dialog', { name: /leave this round/i })).not.toBeInTheDocument();
		expect(screen.getByText(/welcome to cloaked!/i)).toBeInTheDocument();
	});
});
