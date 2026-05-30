# Cloaked

A minesweeper-inspired browser game: hunt down enemy ships hiding behind a cloaking field before they detect your scans and fire first.

**▶ Play it:** https://bwwhitaker.github.io/cloaked

<!-- If the GitHub Pages deploy isn't live yet, run `npm run deploy` (configured below) or remove this line. -->

<!-- TODO: add a short gameplay GIF or screenshot here — it's the single most valuable thing on this page.
     Drop the file in /docs (e.g. docs/gameplay.gif) and uncomment: -->
<!-- ![Cloaked gameplay](docs/gameplay.gif) -->

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

- **React 18** (Create React App)
- **MUI (Material UI) 5** with Emotion for styling
- **Jest** + **React Testing Library** for tests
- **GitHub Pages** for hosting (via `gh-pages`)

## Run locally

```bash
git clone https://github.com/bwwhitaker/cloaked.git
cd cloaked
npm install
npm start          # http://localhost:3000
```

Other scripts:

```bash
npm test           # run the test suite in watch mode
CI=true npm test   # run once (useful in CI)
npm run build      # production build
npm run deploy     # build + publish to GitHub Pages
```

## Tests

The game rules live in a small, framework-free module — `src/Components/gameLogic.js` — so they can be tested without rendering any UI. `src/Components/gameLogic.test.js` covers:

- **Adjacency** (`isAdjacentToShip`): orthogonal and diagonal neighbors, plus the board-edge cases where a naive `id ± 1` would wrap onto the wrong row.
- **Win detection** (`isWin`): order-independent matching, duplicate targets, near-misses.
- **Ship placement** (`generateUniqueRandomNumbers`): correct count, uniqueness, range, and preservation of existing placements (with an injectable RNG for deterministic tests).
- **Lucky first scan** (`isLuckyFirstScan`).

## Project structure

```
src/
├── App.js                      # shell + mobile orientation handling
├── Components/
│   ├── GameSpace.js            # setup screen, board state, streak persistence
│   ├── SearchGrid.js           # the grid, scan/target/unlock modes, win/lose flow
│   ├── Square.js               # a single cell
│   ├── Scanning.js             # scan animation
│   ├── InstructionModule.js    # how-to-play dialog
│   ├── CellStatus.js           # cell status enum + status→style mapping
│   ├── Constants.js            # shared sizing/timing constants
│   └── gameLogic.js            # pure game rules (unit-tested)
└── ...
```

## Design notes

The interesting part of this game is the adjacency math. Cells are numbered `1..(axis²)` left-to-right, top-to-bottom, so a cell's horizontal neighbors are `id ± 1` — but that naively wraps a left-edge cell onto the end of the previous row. The logic guards those cases with the column identities `id % axis === 1` (left edge) and `id % axis === 0` (right edge). Pulling this into a pure module made those edge cases straightforward to lock down with tests instead of catching them by hand in the browser.

## Roadmap

- Show a numeric count of adjacent ships per cell (a closer nod to classic Minesweeper)
- Keyboard navigation and ARIA roles for full accessibility
- CI workflow to run lint + tests on every push
- Sound and richer win/lose animations

## License

[MIT](LICENSE)
