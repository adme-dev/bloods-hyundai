# Draft reply — John Privitelli

**Thread:** Blood Hyundai July Meeting Summary
**To:** John Privitelli
**Cc:** Alicia Karitsas, Clara Padalini
**Status:** Draft — not sent

---

**Subject:** Re: Blood Hyundai July Meeting Summary

Hi John,

Thanks for flagging this, and for the screenshots — they showed the problem clearly.

You're right that the banner setup wasn't correct on mobile. We've identified and fixed two issues:

1. **Hero banner not displaying full width** — the mobile slide was being letterboxed inside a white box rather than filling the screen, which also collapsed it to a narrow strip above the tile grid. It now renders full-bleed, matching the Hyundai Australia site.

2. **Logo overlapping the dealership name** — the header logo was colliding with "Blood Hyundai" on narrow screens. Both now display correctly, with the full dealership name always visible.

These are ready to go and will be deployed shortly. Once live, we'll verify across Chrome, Safari and Android — Clara, this should address what you were seeing, and we'll confirm on Android specifically.

Happy to jump on a call if easier.

Best,
Robert

---

## Notes before sending

- **Not yet deployed.** Fixes are built and verified locally; nothing has been pushed. The email says "will be deployed shortly" — adjust or send after deploying.
- **Android not yet tested.** Clara asked the web support team to check Android. Verified by build and layout calculation, not on a real device.
- **Asset question dropped** per your call. If John's "banner setup" complaint is about the campaign crops/artwork rather than rendering, that's still open — the code fixes how the site displays whatever the CMS serves.

## What changed in the code

- `app/components/page-elements/FrontSlider.vue` — mobile hero switched from `object-fit: contain` (letterboxed) to `cover` with the media filling the panel; removed the overflow clipping that was cutting off the heading.
- `app/components/menus/PrimaryNav.vue` — removed `flex-1` from the logo group on mobile (root cause of the overlap); dealership name set to `whitespace-nowrap` so it never truncates; map-pin icon hidden below 640px and icon gaps tightened to make room.
