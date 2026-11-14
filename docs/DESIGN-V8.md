# Eve v8: the physical storybook and North Pole journey

This revision replaces the child catalog and send sequence while retaining parent curation, local wish data, sample checkout, receipts, and delivery tracking.

- Three illustrated environments, eighteen sample gifts, six discoveries per desktop spread and three per portrait leaf.
- A deforming page mesh with front/back artwork, curved paper, spine shading, and a moving shadow. WebGL renderer plus a perspective Canvas 2D implementation when WebGL is unavailable. Direct dragging, page arrows, keyboard navigation, reduced-motion support.
- Parent exclusions remove hotspots and replace the illustration with a wrapped-present set prop. Empty spreads are omitted.
- A 24-second letter journey: gathering lights, folding envelope and wax seal, portal launch, camera-space star flight, aurora, arrival burst, and the child’s name formed from stars. Optional locally synthesized score, mute, skip, replay, and reduced-motion alternative.
- Twelve additional stylized interactive 3D toy previews, with rotation, zoom, details, and wish selection.

## Verification

Validated in the managed browser at desktop width and in a 390 x 844 viewport. The browser lacked WebGL; the Canvas renderer successfully rendered page bending and completed both button and direct-drag page turns. A temporary local geometry inspector verified the page front/back at 45% curl and was removed from the deliverable.

Confirmed: six desktop discoveries; three phone discoveries; forward and backward navigation; phone drag to the second page; robot detail, rotation, and wish addition; persisted wishes; parent curation hiding a dinosaur and restoring it; full send through personalized confirmation; replay and skip; no site-origin console errors in the tested flow.

Parent regression: six sample wishes total $224.94. Removing the $34.99 robot produced $189.95. Re-including it and completing demo checkout created three store-grouped packages, including the new robot. Existing receipt and delivery controls remain in place.

All orders, payment cards, email parsing, delivery updates and notification examples are simulations. No retailer, payment, email, affiliate or push service is connected. Site access remains owner-only.

## Visual assets

The three realm illustrations are documented in realm-art-v8.json. aurora-sky.png is an edited background plate derived from the existing launch artwork, with the baked-in envelope and comet trail removed so the animated letter has one visible location. No generated retailer claims or live product data.
