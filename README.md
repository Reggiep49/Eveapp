# Eve · Santa’s Lookbook prototype

This is the source and assets for Eve (Santa’s Lookbook), version 11: the Aurora edition. It is a redesign of the version 10 export from Sites.

## Run locally

Install Node.js 24 or later. Open a terminal in this folder and run:

```bash
npm run dev
```

Open [http://localhost:4173](http://localhost:4173) in a browser on the same computer. The project has no npm packages to install. Press Ctrl+C in the terminal to stop the server.

The command assembles the browser files in `dist/client` for hosting and starts a preview server that serves `dist/` directly, with a local family identity and an in-memory SQLite database. Server data resets when the preview stops. The browser can keep its own copy of wishes and preferences in local storage. Use a private browser window for a fresh trial. Run this preview on a trusted local network. The preview server is for development.

## Find your way around

| File or folder | What it controls |
| --- | --- |
| `dist/index.html` | App entry page and script order |
| `dist/js/data.js` | Catalog, worlds, and toy positions |
| `dist/js/store.js` | Family profiles, wishes, letters, sync, sample checkout, receipts, and delivery flow |
| `dist/js/app.js`, `dist/js/main.js` | Navigation, the frame around each screen, and start-up |
| `dist/js/codex.js` | The 3D lookbook: cover, live page turning, lighting |
| `dist/js/kid.js`, `dist/styles/kid.css` | The child's side: lookbook screen, toy close-ups, wish constellation, letter, send-off |
| `dist/js/parent.js`, `dist/styles/parent.css` | The parent's side: Tonight, wishbook, Santa mail, deliveries, keepsakes |
| `dist/js/ui.js`, `dist/styles/base.css` | Shared controls, colors, type, sound |
| `dist/js/aurora.js`, `dist/js/hologram.js` | The animated sky and the spinnable 3D toy |
| `dist/engines/` | Toy geometry for the 3D toy previews |
| `dist/assets/` | Artwork, fonts, and other assets used by the app |
| `dist/server/index.js`, `drizzle/` | Sites request handler and database schema |
| `build-family.mjs`, `tools/family-preview.mjs` | Local build and preview commands |

Edit the files directly under `dist/` and refresh the browser. The build regenerates `dist/client/` for hosting. The design is described in `docs/DESIGN-V11.md`.

## Prototype and hosting

Prices, purchases, receipt processing, and delivery updates are simulated. The repository contains source and sample assets. It contains no live family records, payment details, or credentials.

The included `.openai/hosting.json` identifies the existing private Site. Keep that ID for intentional updates to the same Site. To deploy a separate copy, register a new Site and use that Site’s ID and private access settings. The hosted worker relies on Sites authentication and a D1 database binding named `DB`. Keep the local preview server for development only.
