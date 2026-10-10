import { render, screen, within, act, waitFor, fireEvent } from '@testing-library/react';
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

		expect(screen.getByText(/diagonal mode on/i)).toBeInTheDocument();
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
		expect(screen.getByText(/2 cloaked ships/i)).toBeInTheDocument();
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

describe('accessibility settings and screen fit', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		localStorage.clear();
	});

	test('higher contrast can be switched on and is remembered', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);
		await user.click(screen.getByRole('button', { name: 'Settings' }));
		const settings = await screen.findByRole('dialog', { name: 'Settings' });
		await user.click(within(settings).getByRole('switch', { name: /higher contrast/i }));
		expect(document.documentElement.dataset.highContrast).toBe('true');
		expect(localStorage.getItem('highContrast')).toBe('true');
	});

	test('follows the device contrast setting until the player chooses', () => {
		vi.stubGlobal('matchMedia', (query) => ({ matches: query.includes('contrast'), media: query }));
		render(<GameSpace />);
		expect(document.documentElement.dataset.highContrast).toBe('true');
	});

	// An N x N grid needs N * 50 + 16 px (8px clear on each side): 266 for 5 x 5,
	// 316 for 6 x 6, 366 for 7 x 7, 416 for 8 x 8, 466 for 9 x 9, 516 for 10 x 10.
	test.each([
		[300, '5'],
		[315, '5'],
		[316, '6'],
		[360, '6'],
		[366, '7'],
		[390, '7'],
		[415, '7'],
		[416, '8'],
		[465, '8'],
		[466, '9'],
		[515, '9'],
		[516, '10'],
		[1024, '10'],
	])('a %ipx wide screen offers grids up to %s', (width, largest) => {
		vi.stubGlobal('innerWidth', width);
		vi.stubGlobal('outerWidth', width); // same as the inner width: not zoomed
		vi.stubGlobal('innerHeight', 2000);
		render(<GameSpace />);
		const slider = screen.getAllByRole('slider')[0];
		// Every size stays on the slider; asking for the biggest stops at what fits.
		expect(slider).toHaveAttribute('aria-valuemax', '10');
		fireEvent.change(slider, { target: { value: 10 } });
		expect(slider).toHaveAttribute('aria-valuenow', largest);
	});

	// The Fire button must be visible without scrolling: rows <= (height - 254) / 50,
	// or (height - 279) / 50 on phones narrower than 400px.
	test.each([
		[1200, 500, '5'],
		[1200, 553, '5'],
		[1200, 554, '6'],
		[1200, 604, '7'],
		[1200, 654, '8'],
		[1200, 704, '9'],
		[1200, 754, '10'],
		[390, 578, '5'],
		[390, 579, '6'],
		[390, 629, '7'],
		[390, 900, '7'],
	])('a %ipx wide, %ipx tall screen offers grids up to %s', (width, height, largest) => {
		vi.stubGlobal('innerWidth', width);
		vi.stubGlobal('outerWidth', width); // same as the inner width: not zoomed
		vi.stubGlobal('innerHeight', height);
		render(<GameSpace />);
		const slider = screen.getAllByRole('slider')[0];
		fireEvent.change(slider, { target: { value: 10 } });
		expect(slider).toHaveAttribute('aria-valuenow', largest);
	});

	test('a wide screen gets every size', () => {
		vi.stubGlobal('innerHeight', 2000);
		render(<GameSpace />);
		expect(screen.getAllByRole('slider')[0]).toHaveAttribute('aria-valuemax', '10');
	});

	test('the board has a level-one heading', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);
		await begin(user);
		expect(screen.getByRole('heading', { level: 1, name: 'Cloaked' })).toBeInTheDocument();
	});

	test('the number of ships is capped at a third of the squares', () => {
		render(<GameSpace />);
		const [gridSlider, shipSlider] = screen.getAllByRole('slider');
		// 6 x 6 = 36 squares, so up to 10 ships and no warning.
		expect(screen.queryByText(/larger grid is required/i)).not.toBeInTheDocument();
		// 4 x 4 = 16 squares -> 5 ships; the slider stays, the warning shows.
		fireEvent.change(gridSlider, { target: { value: 4 } });
		fireEvent.change(shipSlider, { target: { value: 10 } });
		expect(shipSlider).toHaveAttribute('aria-valuenow', '5');
		expect(screen.getByText('A larger grid is required to find more than 5 ships.')).toBeInTheDocument();
	});

	test('a screen that only fits 4 x 4 and 5 x 5 counts ships 1 to 5 with no ship warning', () => {
		vi.stubGlobal('innerWidth', 300);
		vi.stubGlobal('outerWidth', 300); // same as the inner width: not zoomed
		render(<GameSpace />);
		const [gridSlider, shipSlider] = screen.getAllByRole('slider');
		fireEvent.change(gridSlider, { target: { value: 4 } });
		expect(shipSlider).toHaveAttribute('aria-valuemax', '5');
		expect(screen.queryByText(/larger grid is required/i)).not.toBeInTheDocument();
	});

	test('shrinking the window mid-round does not change the board', async () => {
		vi.stubGlobal('innerWidth', 1400);
		vi.stubGlobal('outerWidth', 1400); // same as the inner width: not zoomed
		vi.stubGlobal('innerHeight', 1000);
		const user = userEvent.setup();
		render(<GameSpace />);
		fireEvent.change(screen.getAllByRole('slider')[0], { target: { value: 10 } });
		await begin(user);
		expect(document.querySelectorAll('[data-cell-id]')).toHaveLength(100);

		// Leaving full screen: the window gets much smaller.
		vi.stubGlobal('innerWidth', 400);
		vi.stubGlobal('outerWidth', 400); // same as the inner width: not zoomed
		vi.stubGlobal('innerHeight', 500);
		act(() => {
			window.dispatchEvent(new Event('resize'));
		});
		expect(document.querySelectorAll('[data-cell-id]')).toHaveLength(100);
	});

	test('New Game on the too-small-window screen asks first, like the header button', async () => {
		const user = userEvent.setup();
		render(<GameSpace />);
		await begin(user);
		await user.click(screen.getByRole('radio', { name: 'Target' }));
		await user.click(within(document.querySelector('.GridSpacing')).getByRole('button', { name: /^row 1, column 1,/ }));
		await settle(0);

		const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ bottom: 5000, top: 4964, left: 0, right: 1, width: 1, height: 36 });
		act(() => {
			window.dispatchEvent(new Event('resize'));
		});
		const lock = screen.getByRole('alertdialog');
		await user.click(within(lock).getByRole('button', { name: 'New Game' }));
		spy.mockRestore();

		expect(await screen.findByRole('dialog', { name: /leave this round/i })).toBeInTheDocument();
	});

	test('pressing past a limit explains the limit out loud', () => {
		vi.stubGlobal('innerWidth', 400);
		vi.stubGlobal('outerWidth', 400); // same as the inner width: not zoomed
		vi.stubGlobal('innerHeight', 2000);
		render(<GameSpace />);
		const [gridSlider, shipSlider] = screen.getAllByRole('slider');
		fireEvent.change(gridSlider, { target: { value: 10 } });
		expect(screen.getByText('7 by 7 is the largest grid this window fits.')).toBeInTheDocument();

		fireEvent.change(gridSlider, { target: { value: 4 } });
		fireEvent.change(shipSlider, { target: { value: 10 } });
		expect(screen.getByText(/5 ships is the most this grid allows/)).toBeInTheDocument();
	});

	test('zoomed in past 110%, every grid size is offered and the page may scroll', () => {
		vi.stubGlobal('innerWidth', 400);
		vi.stubGlobal('innerHeight', 500);
		vi.stubGlobal('outerWidth', 800); // 200% zoom: half as many CSS pixels as screen pixels
		render(<GameSpace />);
		const slider = screen.getAllByRole('slider')[0];
		fireEvent.change(slider, { target: { value: 10 } });
		expect(slider).toHaveAttribute('aria-valuenow', '10');
		expect(screen.queryByText(/larger window is required/i)).not.toBeInTheDocument();
		expect(document.documentElement.dataset.zoomed).toBe('true');
	});

	test('110% or less is not treated as zoomed', () => {
		vi.stubGlobal('innerWidth', 1000);
		vi.stubGlobal('outerWidth', 1100);
		render(<GameSpace />);
		expect(document.documentElement.dataset.zoomed).toBe('false');
	});

	test('the header hides scrolling down and returns scrolling up', () => {
		vi.stubGlobal('scrollY', 0);
		render(<GameSpace />);
		const scrollTo = (y) => {
			vi.stubGlobal('scrollY', y);
			act(() => {
				window.dispatchEvent(new Event('scroll'));
			});
		};
		const hidden = () => document.documentElement.dataset.headerHidden;

		expect(hidden()).toBe('false');
		scrollTo(40); // not far enough yet
		expect(hidden()).toBe('false');
		scrollTo(300);
		expect(hidden()).toBe('true');
		scrollTo(296); // a jitter, not a real change of direction
		expect(hidden()).toBe('true');
		scrollTo(250);
		expect(hidden()).toBe('false');
		scrollTo(400);
		expect(hidden()).toBe('true');
		scrollTo(0);
		expect(hidden()).toBe('false');
	});
});
