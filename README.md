# Santa’s Lookbook prototype source

This export contains the app source and assets for version 10 of Santa’s Lookbook on Sites. It comes from commit `a125d6649d0e565a64cd7a2a1282485273b1fe0a`.

## Run locally

Install Node.js 24 or later. Unzip the archive, open a terminal in the extracted `santas-lookbook` folder, and run:

```bash
npm run dev
```

Open [http://localhost:4173](http://localhost:4173) in a browser on the same computer. The project has no npm packages to install. Press Ctrl+C in the terminal to stop the server.

The command assembles the browser files in `dist/client` and starts a preview server with a local family identity and an in-memory SQLite database. Server data resets when the preview stops. The browser can keep its own copy of wishes and preferences in local storage. Use a private browser window for a fresh trial. Run this preview on a trusted local network. The preview server is for development.

## Find your way around

| File or folder | What it controls |
| --- | --- |
| `dist/index.html` | App entry page and script order |
| `dist/eve.js`, `dist/eve.css` | Main interface, parent navigation, and catalog data |
| `dist/storybook.js`, `dist/storybook.css`, `dist/book-engine.js` | Illustrated spreads, toy hotspots, and live page turning |
| `dist/model.js`, `dist/toy-models-v8.js` | Interactive 3D toy previews |
| `dist/northstar-flight.js` | Letter flight, animation, and sound |
| `dist/holiday.js` | Sample checkout, receipts, and delivery flow |
| `dist/family.js`, `dist/family.css` | Family profiles, wish lists, letters, and sync |
| `dist/assets/` | Artwork, fonts, and other assets used by the app |
| `dist/server/index.js`, `drizzle/` | Sites request handler and database schema |
| `build-family.mjs`, `tools/family-preview.mjs` | Local build and preview commands |

Edit the files directly under `dist/`. The build regenerates `dist/client/`.

## Prototype and hosting

Prices, purchases, receipt processing, and delivery updates are simulated. The export contains source and sample assets. It contains no live family records, payment details, or credentials. Two design screenshots from the source repository are omitted.

The included `.openai/hosting.json` identifies the existing private Site. Keep that ID for intentional updates to the same Site. To deploy a separate copy, register a new Site and use that Site’s ID and private access settings. The hosted worker relies on Sites authentication and a D1 database binding named `DB`. Keep the local preview server for development only.
