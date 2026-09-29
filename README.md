# Wordament Clone

A browser-based clone of the story mode of Microsoft Wordament. There is no time limit, no multiplayer and no ads. It is designed to be played on mobile first, and works on desktop too.

**Play it here: https://wordament-clone.netlify.app/**

## Rules

- Tap adjacent tiles (including diagonals) to spell a word, then submit it.
- Tiles may be re-used within a single word.
- Words must be at least three letters long and appear in the dictionary.

## Development

```sh
npm ci
npm run dev       # local development server
npm run network   # development server reachable from other devices on your network
npm run lint
npm run build
```

Built with React, TypeScript, Vite, Tailwind CSS and Motion. The site is deployed with Netlify.
