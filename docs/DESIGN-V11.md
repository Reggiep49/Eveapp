# Eve v11: the Aurora edition

This edition rebuilds the interface from the ground up. The product is the same (a parent curates, a child explores and writes to Santa, the parent buys and tracks) and saved families keep working. What changed is how it feels and how easy it is to find your way.

## The idea

Two sides, one sky.

- **The child's side is a real book.** It arrives closed, with the child's name in gold on the cover. Press and hold the star and it opens. Pages are sheets of paper in a 3D scene: they curl around the finger, show their other side, cast a shadow, and fall back if let go early.
- **Sending is something the child does, not a film they watch.** The letter folds, a wax seal presses on, and the child flicks it into the sky, where it becomes a new star.
- **The grown-ups' side is a control room.** One screen, "Tonight", always answers "what do I do next?" and shows the countdown, wishes, budget and deliveries at a glance.
- **A live aurora sits behind everything.** It is cool mint and blue for grown-ups and warms on the child's side.

## What is new

| Before | Now |
| --- | --- |
| A book cover you click | A leather book that drifts in and settles; press and hold the gold star to open it, the cover swings over and the first leaves riffle past |
| A page that rotated as one stiff sheet | Paper that peels from wherever it is grabbed, bends around a cylinder, lags the finger slightly like something with weight, and can be caught mid-air |
| "+" pins covering the pictures | Toys glow softly in the picture itself; names peek out when a page lands, then leave the art clean |
| A 24-second film after sending | About seven seconds, with the child folding, sealing and flicking the letter; it ends on one new star and a "Received" postmark |
| Sound off, no touch feedback | Paper hiss that follows the drag speed, a pat when a page lands, a climbing tone while the star is held; vibration where the device allows it |
| A wish list of tilted cards, favourites in a drop-down | A wish constellation: every wish is a star, one can be the North Star |
| "I'm a grown-up" button | Press and hold the lock (hard for small fingers to do by accident) |
| A poster home page with poetic tab names | "Tonight": next step, six-stage progress, countdown, budget, deliveries |
| Unstyled family controls stacked above each screen | Profiles, budget, claims and the morning plan built into the screens they belong to |
| Two separate gift checklists in Santa mail | One list: include, who is getting it, favourite marked |
| Text as small as 4 to 8 px in places | Nothing below 11 px; body text 15 px and up |

Also new: wishes now sync as they are made, and the artwork download dropped from about 18 MB to under 3 MB.

## How it is built

No build step and no packages. `dist/index.html` loads four stylesheets and one module.

| File | Role |
| --- | --- |
| `dist/js/data.js` | Catalog, worlds, toy positions |
| `dist/js/store.js` | Family document, sync, wishes, simulated checkout and deliveries |
| `dist/js/app.js` | Navigation and the frame around each screen |
| `dist/js/codex.js` | The 3D book: cover, paper block, page curl, lighting, touch |
| `dist/js/kid.js` | The lookbook screen, toy stage, constellation, letter, send-off, Christmas morning |
| `dist/js/parent.js` | Tonight, wishbook, Santa mail, deliveries, keepsakes |
| `dist/js/ui.js` | Icons, dialogs, toasts, sound, press-and-hold |
| `dist/js/aurora.js` | The WebGL sky (falls back to a still gradient) |
| `dist/js/hologram.js` | The spinnable toy projection |
| `dist/engines/` | Carried over unchanged: toy geometry |
| `dist/styles/` | `base` (tokens and controls), `parent`, `kid` |

Storage keys, the family document shape and `/api/family` are unchanged.

## Accessibility and comfort

- Every action works from the keyboard. Arrow keys turn the page; press-and-hold controls accept Enter or Space.
- Reduced-motion settings skip the book's arrival, the riffle and the send-off animation, and still the aurora.
- Touch targets are 44 px or larger. Sound is on by default because it carries much of the feel of the book; one tap turns it off and the choice is remembered. Without WebGL the book falls back to flat pages with the same buttons.

## Verified

Chromium, 1440 × 900 and 390 × 844 (touch): curate and exclude (hidden toys are covered in the world), budget, adding a sibling, holding the star to open the book, turning pages by drag (forward, back, and letting go early), by button and by keyboard, toy stage and spin, wishing, North Star, together wish, letter with press-and-hold send, the fold, seal and flick send-off, hold-to-return, Santa mail, sample card, order, advancing deliveries, inbox scan, package timeline, morning plan and reveal, keepsakes, and live sync between two browser sessions. No console errors in these flows.

Not verified here: Safari and Firefox, real phones, and the hosted Sites deployment. The test machine draws 3D in software at a few frames a second, so smoothness on a real phone has not been measured.

## Touch feedback

There are three routes, best first. Inside a native shell (Capacitor), the app calls the phone's real haptics, including on iPhone. Android browsers vibrate through the standard vibration call. iPhone Safari has no vibration call at all; the app nudges a hidden switch control, which makes the system give a faint tick, and some in-app browsers ignore even that. If touch feedback on iPhone matters, the app needs the native shell.

## Removed

The earlier page engine, the 24-second letter flight and its artwork, and files of earlier editions that were no longer loaded. They remain in this repository's history.

## Assets

The three world illustrations and the snow globe are the same artwork, re-encoded as WebP. The book cover, endpapers and title page are drawn by the app. Toy thumbnails are crops of the world illustrations. Fonts are Instrument Serif, Geist and Geist Mono (SIL Open Font License; see `dist/assets/fonts/LICENSES.txt`).

All orders, cards, email scanning, delivery updates and alerts remain simulations.
