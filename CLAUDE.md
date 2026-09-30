# Wordiac

A browser-based clone of the story mode of Microsoft Wordament, played mobile-first (desktop also supported), with no ads. Live at https://wordament-clone.netlify.app/ (deployed by Netlify).

## Commands

```sh
npm run dev           # development server
npm run network       # development server reachable from other devices
npm run lint          # ESLint
npx tsc -b            # typecheck
npm test              # Vitest
npm run build         # typecheck and production build
npm run format        # Prettier (format:check to verify)
```

Run lint, typecheck, tests and the build before pushing.

## Layout

- `src/routes/Index.tsx`: loads the dictionary, builds the puzzle, renders the game.
- `src/routes/index/`: game UI (`Game.tsx`, tiles, score components).
- `src/utils/`: pure logic, each with tests alongside (`*.test.ts`): grid generation, seeds, solver, daily puzzle, objectives, word validation.
- `public/*.txt`: word lists (`dictionary.txt` accepted words, `common_words.txt` words that count, `rude_words.txt` always rejected, `common_blocklist.txt` exclusions when building the common list). `scripts/build_common_words.py` regenerates `common_words.txt`.
- Import alias: `~/` maps to `src/`.

## Rules the game follows

- Tiles are adjacent (including diagonals) and **may be re-used** within a word, but not twice in a row.
- Words need at least three letters and must be in the dictionary. Only **common** words score and count towards the objective; other valid words are accepted but not counted.
- The daily puzzle is seeded by the UK date (`Europe/London`), so everyone gets the same grid. Grids with too few common words are rejected deterministically.
- Objectives (score N or find N words) are a fraction of what the solver finds on the grid.

## Conventions

- British English in code, comments and text (for example "colour", "normalise").
- Prettier style (no semicolons, single quotes, 100 columns). Do not use em or en dashes in prose; use `--`.
- Keep game logic in `src/utils` as pure functions with tests. Persist to `localStorage` only inside try/catch.

## Product direction (planned, not yet built)

- **Landing page** where the player chooses between the **Daily puzzle** and **Zen mode**.
- **Daily puzzle**: the same grid for everyone each UK day, **timed at 10 minutes**, with a **leaderboard of scores**. The leaderboard needs a backend or hosted service and some thought about cheating; it has not been designed.
- **Zen mode**: untimed, random seed (`generateSeedString` in `src/utils/seed.ts`), no leaderboard.  `?seed=<seed>` in the URL opens a specific zen game directly, and the address bar is kept in sync so it is a shareable link. Today's untimed game is the starting point for this mode.
- The daily format is inspired by NYT Games and Bloobi.
- Other planned work: streaks and share text, settings UI (animations, dyslexic mode and so on; the types exist in `src/types/settings.ts`), offline support (service worker), story-mode style levels.
