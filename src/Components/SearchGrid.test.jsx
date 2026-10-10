import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchGrid from './SearchGrid';
import { REVEAL_DELAY } from './Constants';

// SearchGrid was the largest untested file in the project. These tests cover
// the wiring rather than the rules: the rules already have unit tests in
// GameLogic.test.js, and re-asserting adjacency maths through a rendered DOM
// would be slower, more brittle, and no more convincing.
//
// What is actually worth asserting here is everything the pure module cannot
// see — that the right mode routes to the right handler, that scheduled
// reveals land, that the streak callbacks fire on the right outcomes, and that
// a reset clears the board state upward.
//
// Board used throughout (axis 4, ids 1..16):
//    1  2  3  4
//    5  6  7  8
//    9 10 11 12
//   13 14 15 16
// Ship on 6. Cell 2 is adjacent (directly above), cell 16 is not.

const SHIPS = [6];

function setup(overrides = {}) {
	const props = {
		axis: 4,
		ships: 1,
		fieldBg: 'black',
		shipLocations: SHIPS,
		diagonalMode: false,
		diagonalModeStatus: 'off',
		successfulStreakCount: 0,
		resetSuccessfulStreakCount: vi.fn(),
		setSuccessfulStreakCount: vi.fn(),
		setReadyToPlay: vi.fn(),
		setShipLocations: vi.fn(),
		...overrides,
	};

	const user = userEvent.setup();
	render(<SearchGrid {...props} />);
	return { props, user };
}

// Cells are buttons named by position ("row 2, column 2, not scanned"), not by
// a visible number. The test board is 4 wide.
function cell(id) {
	const row = Math.ceil(id / 4);
	const col = ((id - 1) % 4) + 1;
	const grid = document.querySelector('.GridSpacing');
	return within(grid).getByRole('button', { name: new RegExp(`^row ${row}, column ${col},`) });
}

// Reveals are deferred by REVEAL_DELAY, and MUI's Snackbar runs its own
// transition on top of that. Fake timers deadlock against user-event's internal
// scheduling here, so the suite waits the delay out for real — it is only
// 250ms. The act() wrapper is what keeps React from warning about the state
// updates those timers trigger.
async function settle(ms = REVEAL_DELAY + 25) {
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, ms));
	});
}

async function clickCell(user, id) {
	await user.click(cell(id));
	await settle();
}

async function chooseMode(user, mode) {
	await user.click(screen.getByRole('radio', { name: mode }));
	await settle(0);
}

async function fire(user) {
	await user.click(screen.getByRole('button', { name: /fire!/i }));
	await settle();
}

afterEach(() => {
	vi.clearAllMocks();
});

describe('board rendering', () => {
	test('renders one cell per square of the board', () => {
		setup({ axis: 4 });
		const grid = document.querySelector('.GridSpacing');
		expect(within(grid).getAllByRole('button')).toHaveLength(16);
		expect(within(grid).getByRole('button', { name: /^row 4, column 4,/ })).toBeInTheDocument();
		expect(within(grid).queryByRole('button', { name: /^row 5,/ })).not.toBeInTheDocument();
	});

	test('pluralises the ship count message', () => {
		const { unmount } = render(
			<SearchGrid
				axis={4}
				ships={1}
				fieldBg='black'
				shipLocations={[6]}
				diagonalMode={false}
				diagonalModeStatus='off'
				resetSuccessfulStreakCount={vi.fn()}
				setSuccessfulStreakCount={vi.fn()}
				setReadyToPlay={vi.fn()}
				setShipLocations={vi.fn()}
			/>,
		);
		expect(screen.getByText('1 cloaked ship')).toBeInTheDocument();
		unmount();

		setup({ ships: 3, shipLocations: [6, 9, 14] });
		expect(screen.getByText('3 cloaked ships')).toBeInTheDocument();
	});

	test('reports whether diagonal mode is on', () => {
		setup({ diagonalModeStatus: 'on' });
		expect(screen.getByText('Diagonal mode on')).toBeInTheDocument();
	});
});

describe('scan mode', () => {
	test('scanning a ship on the first move is a lucky shot and spares the streak', async () => {
		const { props, user } = setup();

		await clickCell(user, 6);

		expect(await screen.findByText(/that was lucky!/i)).toBeInTheDocument();
		expect(props.resetSuccessfulStreakCount).not.toHaveBeenCalled();
		// It has its own icon, not MUI's default info glyph.
		expect(screen.getByRole('alert').querySelector('.lucide-search-alert')).toBeInTheDocument();
	});

	test('scanning a ship after the first move ends the game and clears the streak', async () => {
		const { props, user } = setup();

		await clickCell(user, 16); // a harmless scan first
		await clickCell(user, 6); // now hit the ship

		expect(await screen.findByText(/game over!/i)).toBeInTheDocument();
		// The loss is shown on the board, not spelled out in the message.
		expect(cell(6)).toHaveAccessibleName('row 2, column 2, ship found');
		expect(screen.getByRole('status')).toHaveTextContent('Ship was at row 2, column 2.');
		expect(props.resetSuccessfulStreakCount).toHaveBeenCalled();
	});

	test('the game-over message is singular for one ship', async () => {
		const { user } = setup();
		await clickCell(user, 16);
		await clickCell(user, 6);
		expect(await screen.findByText('Your scans alerted the cloaked ship and it fired first.')).toBeInTheDocument();
	});

	test('the game-over message is plural for several ships', async () => {
		const { user } = setup({ ships: 2, shipLocations: [6, 9] });
		await clickCell(user, 16);
		await clickCell(user, 9);
		expect(await screen.findByText('Your scans alerted the cloaked ships and they fired first.')).toBeInTheDocument();
	});

	test('reveals every ship on the board when you lose with several', async () => {
		const { user } = setup({ ships: 3, shipLocations: [14, 6, 9] });

		await clickCell(user, 16);
		await clickCell(user, 9);

		expect(await screen.findByText(/game over!/i)).toBeInTheDocument();
		// Every ship is revealed on the board, including ones never scanned.
		for (const id of [6, 9, 14]) {
			expect(cell(id)).toHaveAccessibleName(/ship found$/);
		}
		// Sorted for readability regardless of generation order.
		expect(screen.getByRole('status')).toHaveTextContent(
			'Ships were at row 2, column 2; row 3, column 1; row 4, column 2.',
		);
	});

	test('a scan does not end the game when it misses', async () => {
		const { props, user } = setup();

		await clickCell(user, 16);

		expect(screen.queryByText(/game over!/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/that was lucky!/i)).not.toBeInTheDocument();
		expect(props.resetSuccessfulStreakCount).not.toHaveBeenCalled();
	});

	test('scanning a previously targeted cell clears that mark', async () => {
		const { props, user } = setup();

		await chooseMode(user, 'Target');
		await clickCell(user, 16);

		await chooseMode(user, 'Scan');
		await clickCell(user, 16); // un-marks it as a side effect

		// 16 is no longer targeted, so firing at the real ship cell should now
		// be a loss rather than a win.
		await chooseMode(user, 'Target');
		await clickCell(user, 6);
		await fire(user);

		expect(await screen.findByText(/you win!/i)).toBeInTheDocument();
		expect(props.setSuccessfulStreakCount).toHaveBeenCalled();
	});
});

describe('target and unlock modes', () => {
	test('target mode marks a cell without scanning it', async () => {
		const { props, user } = setup();

		await chooseMode(user, 'Target');
		await clickCell(user, 6); // the ship — but marking is not scanning

		expect(screen.queryByText(/game over!/i)).not.toBeInTheDocument();
		expect(props.resetSuccessfulStreakCount).not.toHaveBeenCalled();
	});

	test('unlock mode removes a mark so firing no longer counts it', async () => {
		const { props, user } = setup();

		await chooseMode(user, 'Target');
		await clickCell(user, 6);

		await chooseMode(user, 'Unlock');
		await clickCell(user, 6);

		await fire(user);

		expect(await screen.findByText(/game over!/i)).toBeInTheDocument();
		expect(props.setSuccessfulStreakCount).not.toHaveBeenCalled();
	});

	test('the Targeted tally counts marks, with no "of N" limit, and follows unlock', async () => {
		const { user } = setup();
		expect(screen.getByText('Targeted: 0')).toBeInTheDocument();

		await chooseMode(user, 'Target');
		await clickCell(user, 1);
		await clickCell(user, 2);
		await clickCell(user, 2); // the same square twice is still one mark
		await settle(0);
		expect(screen.getByText('Targeted: 2')).toBeInTheDocument();

		await chooseMode(user, 'Unlock');
		await clickCell(user, 1);
		await settle();
		expect(screen.getByText('Targeted: 1')).toBeInTheDocument();
	});
});

describe('firing', () => {
	test('an exact match wins and increments the streak', async () => {
		const { props, user } = setup({ ships: 2, shipLocations: [6, 11] });

		await chooseMode(user, 'Target');
		await clickCell(user, 6);
		await clickCell(user, 11);

		await fire(user);

		expect(await screen.findByText(/you win!/i)).toBeInTheDocument();
		expect(screen.getByText('You found and destroyed the cloaked ships!')).toBeInTheDocument();
		// The alert shows the new streak, and it is announced.
		expect(screen.getByText('Victory Streak: 1')).toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent('Victory Streak: 1.');
		// The destroyed ships show a shield-off icon and say so in their name.
		expect(cell(6)).toHaveAccessibleName('row 2, column 2, ship destroyed');
		expect(cell(6).querySelector('svg')).toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent('Ships destroyed at row 2, column 2; row 3, column 3.');
		expect(props.setSuccessfulStreakCount).toHaveBeenCalledTimes(1);
		expect(props.resetSuccessfulStreakCount).not.toHaveBeenCalled();
	});

	test('the win message is singular for one ship', async () => {
		const { user } = setup();

		await chooseMode(user, 'Target');
		await clickCell(user, 6);
		await fire(user);

		expect(await screen.findByText('You found and destroyed the cloaked ship!')).toBeInTheDocument();
	});

	test('a partial match loses — finding some ships is not finding them all', async () => {
		const { props, user } = setup({ ships: 2, shipLocations: [6, 11] });

		await chooseMode(user, 'Target');
		await clickCell(user, 6); // correct, but incomplete

		await fire(user);

		expect(await screen.findByText(/game over!/i)).toBeInTheDocument();
		expect(screen.getByText(/the cloaked ships fired back and destroyed your ship/i)).toBeInTheDocument();
		expect(screen.getByRole('alert').querySelector('.lucide-shield-x')).toBeInTheDocument();
		expect(props.resetSuccessfulStreakCount).toHaveBeenCalled();
		expect(props.setSuccessfulStreakCount).not.toHaveBeenCalled();
	});

	test('a wrong shot says "ship" for one ship', async () => {
		const { user } = setup();
		await fire(user);
		expect(await screen.findByText(/the cloaked ship fired back and destroyed your ship/i)).toBeInTheDocument();
	});

	test('over-targeting loses even when every ship is covered', async () => {
		const { props, user } = setup();

		await chooseMode(user, 'Target');
		await clickCell(user, 6); // the ship
		await clickCell(user, 7); // plus a guess too many

		await fire(user);

		expect(await screen.findByText(/game over!/i)).toBeInTheDocument();
		expect(props.setSuccessfulStreakCount).not.toHaveBeenCalled();
	});

	test('a losing shot reveals the ships on the board', async () => {
		const { user } = setup({ ships: 2, shipLocations: [6, 11] });

		await chooseMode(user, 'Target');
		await clickCell(user, 6); // incomplete

		await fire(user);

		expect(await screen.findByText(/the cloaked ships have been revealed/i)).toBeInTheDocument();
		expect(cell(11)).toHaveAccessibleName('row 3, column 3, ship found');
	});

	test('firing with nothing targeted loses', async () => {
		const { props, user } = setup();

		await fire(user);

		expect(await screen.findByText(/game over!/i)).toBeInTheDocument();
		expect(props.resetSuccessfulStreakCount).toHaveBeenCalled();
	});
});

describe('while a result is showing', () => {
	test('firing behind the lucky-shot alert does not clear the streak', async () => {
		const { props, user } = setup();

		await clickCell(user, 6); // lucky first scan
		expect(await screen.findByText(/that was lucky!/i)).toBeInTheDocument();

		await fire(user); // an empty shot behind the alert

		expect(props.resetSuccessfulStreakCount).not.toHaveBeenCalled();
		expect(screen.queryByText(/game over!/i)).not.toBeInTheDocument();
	});

	test('cells are locked while a result is showing', async () => {
		const { user } = setup({ ships: 2, shipLocations: [6, 9] });

		await clickCell(user, 6); // lucky first scan, alert opens
		await screen.findByText(/that was lucky!/i);
		await clickCell(user, 16); // would scan, but the board is locked

		expect(cell(16)).toHaveAccessibleName('row 4, column 4, not scanned');
	});

	test('clicking outside the alert returns to the landing page', async () => {
		const { props, user } = setup();

		await clickCell(user, 6);
		await screen.findByText(/that was lucky!/i);

		await user.click(screen.getByTestId('result-backdrop'));
		await settle(0);

		expect(props.setReadyToPlay).toHaveBeenCalledWith(false);
		expect(props.setShipLocations).toHaveBeenCalledWith([]);
		expect(props.resetSuccessfulStreakCount).not.toHaveBeenCalled();
	});
});

describe('resetting', () => {
	test('closing the result hands control back to the parent', async () => {
		const { props, user } = setup();

		await chooseMode(user, 'Target');
		await clickCell(user, 6);
		await fire(user);
		expect(await screen.findByText(/you win!/i)).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: /new game/i }));
		await settle(0);

		expect(props.setReadyToPlay).toHaveBeenCalledWith(false);
		expect(props.setShipLocations).toHaveBeenCalledWith([]);
	});

	test('unmounting mid-reveal does not fire a deferred state update', async () => {
		const errors = [];
		const spy = vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args));

		const user = userEvent.setup();
		const { unmount } = render(
			<SearchGrid
				axis={4}
				ships={1}
				fieldBg='black'
				shipLocations={SHIPS}
				diagonalMode={false}
				diagonalModeStatus='off'
				resetSuccessfulStreakCount={vi.fn()}
				setSuccessfulStreakCount={vi.fn()}
				setReadyToPlay={vi.fn()}
				setShipLocations={vi.fn()}
			/>,
		);

		await user.click(cell(16)); // reveal is now pending
		unmount(); // player resets before it lands
		await new Promise((resolve) => setTimeout(resolve, REVEAL_DELAY * 3));
		// Deliberately not wrapped in act(): the whole point is that nothing
		// should be updating after unmount.

		expect(errors).toHaveLength(0);
		spy.mockRestore();
	});
});

describe('keyboard and screen reader access', () => {
	test('cells are real buttons with a position and state in their name', () => {
		setup();
		expect(cell(6)).toHaveAccessibleName('row 2, column 2, not scanned');
	});

	test('focus starts on the Scan mode, one Tab from the grid', async () => {
		const { user } = setup();
		expect(screen.getByRole('radio', { name: 'Scan' })).toHaveFocus();

		await user.tab(); // the three modes are one Tab stop
		expect(cell(1)).toHaveFocus();
	});

	test('only one cell is a tab stop, and arrow keys move between cells', async () => {
		const { user } = setup();
		const grid = document.querySelector('.GridSpacing');
		const tabStops = within(grid)
			.getAllByRole('button')
			.filter((b) => b.tabIndex === 0);
		expect(tabStops).toHaveLength(1);

		cell(1).focus();
		await user.keyboard('{ArrowRight}');
		expect(cell(2)).toHaveFocus();
		await user.keyboard('{ArrowDown}');
		expect(cell(6)).toHaveFocus();
		await user.keyboard('{ArrowLeft}{ArrowLeft}'); // second is stopped at the edge
		expect(cell(5)).toHaveFocus();
	});

	test('Enter scans the focused cell and the result is announced', async () => {
		const { user } = setup();
		cell(16).focus();
		await user.keyboard('{Enter}');
		await settle();

		expect(screen.getByRole('status')).toHaveTextContent('row 4, column 4: scanned, clear');
		expect(cell(16)).toHaveAccessibleName('row 4, column 4, scanned, clear');
	});

	test('modes are a radio group that reports the selected mode', async () => {
		const { user } = setup();
		expect(screen.getByRole('radiogroup', { name: /mode/i })).toBeInTheDocument();
		expect(screen.getByRole('radio', { name: 'Scan' })).toBeChecked();
		await chooseMode(user, 'Target');
		expect(screen.getByRole('radio', { name: 'Target' })).toBeChecked();
		expect(screen.getByRole('radio', { name: 'Scan' })).not.toBeChecked();
	});

	test('arrow keys move between modes and select as they go', async () => {
		const { user } = setup();
		await user.keyboard('{ArrowRight}');
		expect(screen.getByRole('radio', { name: 'Target' })).toBeChecked();
		expect(screen.getByRole('radio', { name: 'Target' })).toHaveFocus();
		await user.keyboard('{ArrowRight}{ArrowRight}'); // wraps past Unlock to Scan
		expect(screen.getByRole('radio', { name: 'Scan' })).toBeChecked();
		await user.keyboard('{ArrowLeft}'); // wraps back to Unlock
		expect(screen.getByRole('radio', { name: 'Unlock' })).toBeChecked();
	});
});

describe('state icons', () => {
	test('each state draws an icon so colour is not the only cue', async () => {
		const { user } = setup({ ships: 1, shipLocations: [6] });

		expect(cell(16).querySelector('svg')).toBeNull(); // unscanned: blank

		await clickCell(user, 16); // clear
		expect(cell(16).querySelector('svg')).toBeInTheDocument();

		await clickCell(user, 2); // adjacent to the ship at 6
		expect(cell(2).querySelector('svg')).toBeInTheDocument();

		await chooseMode(user, 'Target');
		await clickCell(user, 11);
		expect(cell(11).querySelector('svg')).toBeInTheDocument();
	});

	test('icons are hidden from assistive technology', async () => {
		const { user } = setup();
		await clickCell(user, 16);
		expect(cell(16).querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
	});
});

describe('a window too short for the board', () => {
	afterEach(() => vi.restoreAllMocks());

	// jsdom has no layout, so say where the Fire button is.
	const placeFireButtonAt = (bottom) =>
		vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
			return { top: bottom - 36, bottom, left: 0, right: 100, width: 100, height: 36 };
		});

	test('is not locked while the Fire button is on screen', () => {
		placeFireButtonAt(window.innerHeight - 10);
		setup();
		expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
	});

	test('locks the board when the Fire button is below the window, and offers a new game', async () => {
		placeFireButtonAt(window.innerHeight + 200);
		const { props, user } = setup();

		const lock = screen.getByRole('alertdialog');
		expect(lock).toHaveTextContent('Increase window size to continue or start a new game.');

		await user.click(within(lock).getByRole('button', { name: 'New Game' }));
		expect(props.setReadyToPlay).toHaveBeenCalledWith(false);
	});

	test('unlocks again when the window grows', () => {
		const spy = placeFireButtonAt(window.innerHeight + 200);
		setup();
		expect(screen.getByRole('alertdialog')).toBeInTheDocument();

		spy.mockRestore();
		placeFireButtonAt(window.innerHeight - 10);
		act(() => {
			window.dispatchEvent(new Event('resize'));
		});
		expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
	});

	test('also locks when the grid is wider than the window', () => {
		vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
			const isGrid = this.getAttribute('aria-label') === 'Scan grid';
			return isGrid
				? { top: 100, bottom: 400, left: -40, right: window.innerWidth + 40, width: window.innerWidth + 80, height: 300 }
				: { top: 10, bottom: 50, left: 0, right: 100, width: 100, height: 40 };
		});
		setup();
		expect(screen.getByRole('alertdialog')).toBeInTheDocument();
	});

	test('the lock screen makes the board inert, and focus returns when it clears', () => {
		const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
			top: window.innerHeight + 100,
			bottom: window.innerHeight + 136,
			left: 0,
			right: 100,
			width: 100,
			height: 36,
		}));
		setup();
		expect(document.querySelector('[inert]')).not.toBeNull();
		expect(document.querySelector('[inert]')).toContainElement(screen.getAllByRole('radio')[0]);

		spy.mockRestore();
		act(() => {
			window.dispatchEvent(new Event('resize'));
		});
		expect(document.querySelector('[inert]')).toBeNull();
	});

	test('Tab does not leave the lock screen', async () => {
		vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
			top: window.innerHeight + 100,
			bottom: window.innerHeight + 136,
			left: 0,
			right: 100,
			width: 100,
			height: 36,
		}));
		const { user } = setup();
		const button = within(screen.getByRole('alertdialog')).getByRole('button', { name: 'New Game' });
		button.focus();
		await user.tab();
		expect(button).toHaveFocus();
	});
});

describe('the targeted tally for screen readers', () => {
	test('speaks the running total after marks and unlocks', async () => {
		const { user } = setup();
		const tally = screen.getByTestId('targeted-tally');
		expect(tally).toHaveTextContent('0 targeted');
		await chooseMode(user, 'Target');
		await clickCell(user, 1);
		await clickCell(user, 2);
		await settle(0);
		expect(tally).toHaveTextContent('2 targeted');
		expect(tally).toHaveAttribute('aria-live', 'polite');
	});

	test('never locks while zoomed in: the page scrolls instead', () => {
		vi.stubGlobal('outerWidth', window.innerWidth * 2);
		vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
			top: window.innerHeight + 100,
			bottom: window.innerHeight + 136,
			left: -300,
			right: window.innerWidth + 300,
			width: window.innerWidth + 600,
			height: 36,
		}));
		setup();
		expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
		vi.unstubAllGlobals();
	});
});
