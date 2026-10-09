# Cloaked

A minesweeper-inspired browser game: hunt down enemy ships hiding behind a cloaking field before they detect your scans and fire first.

**▶ Play it:** https://bwwhitaker.github.io/cloaked

![Cloaked gameplay](docs/gameplay.gif)

## How to play

You're scanning a grid of space for cloaked enemy ships. Every scan risks giving away your position, so you have to find the ships by inference rather than brute force.

1. **Set your parameters.** Choose a grid size (4×4 up to 8×8) and how many ships to hide (1–5). Optionally turn on **Diagonal Mode**, which makes a scan also warn you about ships in diagonally adjacent squares, not just the ones sharing a direct side. **How to Play** (next to Start scanning) has the full rules, and the gear opens **Settings**.
2. **Scan.** In _Scan_ mode, click a cell (or press Enter/Space on it) to reveal it. Every result has its own color _and_ icon, so color is never the only cue:
   - **Black, dot** — all clear, no ship next to it.
   - **Blue, siren** — a ship is adjacent (orthogonally, plus diagonally if Diagonal Mode is on).
   - **Red, rocket** — you scanned directly onto a ship. The enemy fires first and it's game over... unless it was your very first scan, which counts as a _lucky shot_ and spares your streak.
3. **Target.** In _Target_ mode, mark the cells where you think ships are hiding (**amber, crosshair**). _Unlock_ mode clears a mark.
4. **Fire.** When you think you've pinpointed every ship, hit **Fire!**. If your targeted cells exactly match the ship locations, you win and your streak goes up, and each ship you found turns **green with a shield-off icon over a rocket** (its cloak is down). Miss, and the enemy fires back.

When you lose, every cloaked ship is revealed on the board (red, rocket) so you can see where you went wrong.

Your **Victory Streak** (consecutive wins) and **Best Streak** are shown in the header and saved between sessions in `localStorage`. A loss resets the streak to 0; a lucky first scan does not. Hover or focus the streak for a short explanation.

**New Game** in the header returns to setup. If you've already scanned or targeted something it asks first, and you can turn that confirmation off ("Don't ask me again") and back on in Settings.

## Features

- Configurable board size and ship count
- Optional diagonal adjacency mode
- Victory Streak and Best Streak, persisted across sessions
- Settings: confirm-before-new-game and Reduce motion
- Scan reveal animation and game-over / victory feedback
- Ships revealed on the board when you lose, and shown with their cloaks down when you win
- Playable with the keyboard and a screen reader (see [Accessibility](#accessibility))
- Mobile-aware layout (prompts to return to portrait orientation)

## Accessibility

The board is fully playable without a mouse:

- **Cells are real buttons**, named by position and state, e.g. "row 2, column 3, scanned, ship adjacent". There are no visible cell numbers.
- **The grid is a single Tab stop.** Use the arrow keys, Home and End to move around it; Enter or Space acts on the focused cell.
- **Scan / Target / Unlock is a radio group.** It is one Tab stop; arrow keys change the mode. Tab from the modes goes straight to the grid.
- **Focus starts on Scan** when a game begins, so you don't have to Tab past New Game and How to Play. Returning to setup puts focus on Start scanning.
- **A locked board while a result shows.** Win, lose and lucky-shot alerts put a backdrop behind them; clicking outside returns to setup and keeps your streak.
- **Reduce motion** (Settings) turns off the scan animation and other transitions. It starts from your device's setting until you choose.
- **Landmarks and touch targets:** the game sits in a `<main>`, and everything you press is at least 44px tall.
- **Results are announced** through a visually hidden live region (each scan, target and unlock, and the ship positions after a win or a loss).
- **Color is never the only cue.** Each cell state also has an icon (Lucide): crosshair, siren, dot, rocket, and a shield-off over a rocket for a destroyed ship. Every icon/fill pair meets 4.5:1 contrast (checked in `CellStatus.test.js`).

The automated tests cover roles, accessible names, focus and the live region. It has not yet been tested with a real screen reader (VoiceOver / NVDA).

## Tech stack

- **React 18**
- **Vite** for dev server and bundling
- **Vitest** + **React Testing Library** for tests
- **MUI (Material UI) 5** with Emotion for styling
- **Lucide** (`lucide-react`) for cell icons
- **GitHub Pages** for hosting, deployed by GitHub Actions

## Run locally

```bash
git clone https://github.com/bwwhitaker/cloaked.git
cd cloaked
npm install
npm run dev        # http://localhost:3005/cloaked/
```

Other scripts:

```bash
npm test           # run tests in watch mode (Vitest)
npm run test:run   # run the suite once (useful in CI)
npm run lint       # ESLint (flat config in eslint.config.js)
npm run build      # production build into ./build
npm run preview    # serve the production build locally
```

Deploys happen through GitHub Actions (`.github/workflows/deploy.yml`): tests, then build, then deploy, so a failing test blocks the release. There is no manual deploy script.

## Tests

The game rules live in a small, framework-free module — `src/Components/GameLogic.js` — so they can be tested without rendering any UI. `src/Components/GameLogic.test.js` covers:

- **Adjacency** (`isAdjacentToShip`): orthogonal and diagonal neighbors, plus the board-edge cases where a naive `id ± 1` would wrap onto the wrong row.
- **Win detection** (`isWin`): order-independent matching, duplicate targets, near-misses.
- **Ship placement** (`generateUniqueRandomNumbers`): correct count, uniqueness, range, and preservation of existing placements (with an injectable RNG for deterministic tests).
- **Lucky first scan** (`isLuckyFirstScan`).

The rest of the suite covers the UI:

- `CellStatus.test.js` — status-to-style mapping, including that every icon/fill pair meets 4.5:1 contrast.
- `SearchGrid.test.jsx` — mode routing, scan/target/unlock/fire outcomes, the reveal on a loss, and keyboard and screen reader behavior (single Tab stop, arrow keys, radio-group modes, live-region announcements).
- `GameSpace.test.jsx` — setup screen, streak persistence and reset behavior.
- `App.test.jsx` — a render smoke test for the app shell.

## Project structure

```
index.html                      # Vite entry (loads /src/index.jsx)
vite.config.js                  # Vite + Vitest config (base path, test env)
src/
├── index.jsx                   # React root
├── App.jsx                     # shell + mobile orientation handling
├── Components/
│   ├── GameSpace.jsx           # setup screen, board state, streak persistence
│   ├── SearchGrid.jsx          # the grid, scan/target/unlock modes, win/lose flow
│   ├── Square.jsx              # a single cell: button, label and state icon
│   ├── Scanning.jsx            # scan animation
│   ├── InstructionModule.jsx   # how-to-play dialog
│   ├── CellStatus.js           # cell status enum + status→style mapping
│   ├── Constants.js            # shared sizing/timing constants
│   ├── GameLogic.js            # pure game rules (unit-tested)
│   └── *.test.js(x)            # tests live beside the code they cover
└── ...
```

Components that contain JSX use the `.jsx` extension; plain logic modules stay `.js`.

## Design notes

The interesting part of this game is the adjacency math. Cells are numbered `1..(axis²)` left-to-right, top-to-bottom, so a cell's horizontal neighbors are `id ± 1` — but that naively wraps a left-edge cell onto the end of the previous row. The logic guards those cases with the column identities `id % axis === 1` (left edge) and `id % axis === 0` (right edge). Pulling this into a pure module made those edge cases straightforward to lock down with tests instead of catching them by hand in the browser.

The project was migrated from Create React App (now deprecated) to Vite, which removed the entire vulnerable webpack/CRA build chain and dropped `npm audit` to zero.

## Roadmap

- Show a numeric count of adjacent ships per cell (a closer nod to classic Minesweeper)
- Test with real screen readers (VoiceOver, NVDA) and fix whatever turns up
- Sound and richer win/lose animations

## License

[MIT](LICENSE)
