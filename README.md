# Cloaked

A minesweeper-inspired browser game: hunt down enemy ships hiding behind a cloaking field before they detect your scans and fire first.

**▶ Play it:** https://bwwhitaker.github.io/cloaked

[Cloaked gameplay](docs/gameplay.gif)

## How to play

You're scanning a grid of space for cloaked enemy ships. Every scan risks giving away your position, so you have to find the ships by inference rather than brute force.

1. **Set your parameters.** Choose a grid size (4×4 up to 8×8) and how many ships to hide (1–5). Optionally turn on **Diagonal Mode**, which treats diagonal cells as adjacent too.
2. **Scan.** In _Scan_ mode, click a cell to reveal it:
   - **Black** — all clear, no ship next to it.
   - **Blue** — a ship is adjacent (orthogonally, plus diagonally if Diagonal Mode is on).
   - **Red** — you scanned directly onto a ship. The enemy fires first and it's game over... unless it was your very first scan, which counts as a _lucky shot_ and spares your streak.
3. **Target.** In _Target_ mode, mark the cells where you think ships are hiding. _Unlock_ mode clears a mark.
4. **Fire.** When you think you've pinpointed every ship, hit **Fire!**. If your targeted cells exactly match the ship locations, you win and your streak goes up. Miss, and the enemy fires back.

Your win streak is saved between sessions in `localStorage`.

## Features

- Configurable board size and ship count
- Optional diagonal adjacency mode
- Persisted win streak across sessions
- Scan reveal animation and game-over / victory feedback
- Mobile-aware layout (prompts to return to portrait orientation)

## Tech stack

- **React 18**
- **Vite** for dev server and bundling
- **Vitest** + **React Testing Library** for tests
- **MUI (Material UI) 5** with Emotion for styling
- **GitHub Pages** for hosting (via `gh-pages`)

## Run locally

```bash
git clone https://github.com/bwwhitaker/cloaked.git
cd cloaked
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm test           # run tests in watch mode (Vitest)
npm run test:run   # run the suite once (useful in CI)
npm run build      # production build into ./build
npm run preview    # serve the production build locally
npm run deploy     # build + publish to GitHub Pages
```

## Tests

The game rules live in a small, framework-free module — `src/Components/GameLogic.js` — so they can be tested without rendering any UI. `src/Components/GameLogic.test.js` covers:

- **Adjacency** (`isAdjacentToShip`): orthogonal and diagonal neighbors, plus the board-edge cases where a naive `id ± 1` would wrap onto the wrong row.
- **Win detection** (`isWin`): order-independent matching, duplicate targets, near-misses.
- **Ship placement** (`generateUniqueRandomNumbers`): correct count, uniqueness, range, and preservation of existing placements (with an injectable RNG for deterministic tests).
- **Lucky first scan** (`isLuckyFirstScan`).

`src/App.test.jsx` is a render smoke test for the app shell.

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
│   ├── Square.jsx              # a single cell
│   ├── Scanning.jsx            # scan animation
│   ├── InstructionModule.jsx   # how-to-play dialog
│   ├── CellStatus.js           # cell status enum + status→style mapping
│   ├── Constants.js            # shared sizing/timing constants
│   ├── GameLogic.js            # pure game rules (unit-tested)
│   └── GameLogic.test.js       # game-logic tests
└── ...
```

Components that contain JSX use the `.jsx` extension; plain logic modules stay `.js`.

## Design notes

The interesting part of this game is the adjacency math. Cells are numbered `1..(axis²)` left-to-right, top-to-bottom, so a cell's horizontal neighbors are `id ± 1` — but that naively wraps a left-edge cell onto the end of the previous row. The logic guards those cases with the column identities `id % axis === 1` (left edge) and `id % axis === 0` (right edge). Pulling this into a pure module made those edge cases straightforward to lock down with tests instead of catching them by hand in the browser.

The project was migrated from Create React App (now deprecated) to Vite, which removed the entire vulnerable webpack/CRA build chain and dropped `npm audit` to zero.

## Roadmap

- Show a numeric count of adjacent ships per cell (a closer nod to classic Minesweeper)
- Keyboard navigation and ARIA roles for full accessibility
- Sound and richer win/lose animations

## License

[MIT](LICENSE)
