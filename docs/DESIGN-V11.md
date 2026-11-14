# Eve v11: the Aurora edition

This edition rebuilds the interface from the ground up. The product is the same (a parent curates, a child explores and writes to Santa, the parent buys and tracks) and saved families keep working. What changed is how it feels and how easy it is to find your way.

## The idea

Two sides, one sky.

- **The child's side is a place, not a page.** Each world fills the whole screen. Move the mouse or drag a finger to look around; toys glow and can be tapped anywhere they appear. The book and its page turns are gone.
- **The grown-ups' side is a control room.** One screen, "Tonight", always answers "what do I do next?" and shows the countdown, wishes, budget and deliveries at a glance.
- **A live aurora sits behind everything.** It is cool mint and blue for grown-ups and warms to gold and violet on the child's side, so you always know whose side you are on.

## What is new

| Before | Now |
| --- | --- |
| A framed book with small "+" pins | Full-screen worlds you look around in, with a finder strip that flies the camera to any toy |
| Page turns between chapters | A warp between worlds from a rail at the bottom |
| Toy pop-up with a flat 3D model | A stage with the real illustration first, plus a spinnable light projection with momentum |
| A wish list of tilted cards, favourites in a drop-down | A wish constellation: every wish is a star, one can be the North Star |
| A "seal it" button | Press and hold to send, with a charging ring |
| "I'm a grown-up" button | Press and hold the lock (hard for small fingers to do by accident) |
| A poster home page with poetic tab names | "Tonight": next step, six-stage progress, countdown, budget, deliveries |
| Unstyled family controls stacked above each screen | Profiles, budget, claims and the morning plan built into the screens they belong to |
| Two separate gift checklists in Santa mail | One list: include, who is getting it, favourite marked |
| Text as small as 4 to 8 px in places | Nothing below 11 px; body text 15 px and up |

Also new: wishes now sync as they are made (before, they only reached the family when the letter was sent), and the page weight for artwork dropped from about 18 MB to under 4 MB.

## How it is built

No build step and no packages. `dist/index.html` loads four stylesheets and one module.

| File | Role |
| --- | --- |
| `dist/js/data.js` | Catalog, worlds, toy positions |
| `dist/js/store.js` | Family document, sync, wishes, simulated checkout and deliveries |
| `dist/js/app.js` | Navigation and the frame around each screen |
| `dist/js/kid.js` | Portal, worlds, toy stage, constellation, letter, journey, Christmas morning |
| `dist/js/parent.js` | Tonight, wishbook, Santa mail, deliveries, keepsakes |
| `dist/js/ui.js` | Icons, dialogs, toasts, sound, press-and-hold |
| `dist/js/aurora.js` | The WebGL sky (falls back to a still gradient) |
| `dist/js/hologram.js` | The spinnable toy projection |
| `dist/engines/` | Carried over unchanged: toy geometry and the letter-flight animation |
| `dist/styles/` | `base` (tokens and controls), `parent`, `kid`, `flight` |

Storage keys, the family document shape and `/api/family` are unchanged.

## Accessibility and comfort

- Every action works from the keyboard. Focusing a toy brings it into view; arrow keys look around; press-and-hold controls accept Enter or Space.
- Reduced-motion settings switch off the warp, parallax, aurora movement and the long flight.
- Touch targets are 44 px or larger. Sound is off until someone turns it on, and the choice is remembered.

## Verified

Chromium, 1440 × 900 and 390 × 844 (touch): curate and exclude (hidden toys are covered in the world), budget, adding a sibling, portal, looking around by drag, finder, toy stage and spin, wishing, North Star, together wish, letter with press-and-hold send, the full 24-second flight, hold-to-return, Santa mail, sample card, order, advancing deliveries, inbox scan, package timeline, morning plan and reveal, keepsakes, and live sync between two browser sessions. No console errors in these flows.

Not verified here: Safari and Firefox, real phones, and the hosted Sites deployment.

## Removed

The page-turning book engine and the files of earlier editions that were no longer loaded. They remain in the first commit of this repository.

## Assets

The three world illustrations, the snow globe and the sky plate are the same artwork, re-encoded as WebP. Toy thumbnails are crops of the world illustrations. Fonts are Instrument Serif, Geist and Geist Mono (SIL Open Font License; see `dist/assets/fonts/LICENSES.txt`).

All orders, cards, email scanning, delivery updates and alerts remain simulations.
