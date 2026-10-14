# Kotlin Over the Air — DevFest Chennai 2026

22-slide talk deck built as a static site (reveal.js 5, vendored — no build step).
The visual language follows the KotlinConf 2024–2026 stage decks (reference photos kept locally in `ref-img/`, not committed):
flat violet / lilac / graphite surfaces, monoline geometric line-art clipped to
the Kotlin mark, code on violet with a lifted highlight and a speech bubble,
diagrams drawn with thin outlines.

## Present

```bash
python3 -m http.server 4173   # from the repo root
```

Open <http://localhost:4173/devfest-chennai-26/> (live: <https://slides.ketoy.dev/devfest-chennai-26/>). Fonts load from Google Fonts — open the deck once
while online on the stage laptop so they are cached.

| Key | Action |
|---|---|
| `→` / `Space` | next build / slide |
| `S` | speaker view: cue notes, timer, slide number |
| `F` | fullscreen |
| `V` | on the demo slide: play `media/demo.mp4` full screen |
| `O` | overview |
| `B` or `.` | black screen (press again to return) |

Slide changes: when the background surface changes, the new surface wipes in
behind a gradient accent band, with a shape per surface (graphite: leaning
slant, violet: disc from the corner, lilac: opening pill, gradient field: iris).
Going backwards mirrors the wipe. Same-surface neighbours keep the content
drift, and the four compiler slides magic-move.

### Presentation remote (clicker)

Works with any remote that acts as a keyboard, the same buttons as in PowerPoint:

| Remote button | Key it sends | Deck does |
|---|---|---|
| Next / Back | PageDown / PageUp, or arrow keys | next / previous build or slide |
| Start slideshow | F5 or Shift+F5 | goes fullscreen (never reloads the page) |
| Stop slideshow | Esc | leaves fullscreen; does **not** open the overview |
| Black screen | B or . | blacks out; press again to return |

Presenter view: press `S` to open the speaker window (notes, timer, next-slide
preview), drag it to your laptop screen, and put the deck window on the
projector. The remote works whichever window has focus.

`?lite` in the URL turns off the wipes and draw-in animations (weak laptop or
motion-sensitive viewer). `?print-pdf` prints a handout.

## Files

- `index.html` — the slides; each `<aside class="notes">` is a short cue list.
- `SCRIPT.md` — the full prose script for rehearsal.
- `css/konf.css` — the theme.
- `js/art.js` — seeded generator for the line-art, gradient tiles and gradient fields.
- `js/deck.js` — reveal config, the custom `konf` slide transition, timeline and count-up beats.
- `media/` — `qr-repo.svg` (real QR to the repo). Drop in `android.png`,
  `ios-swiftui.png`, `ios-cmp.png` (portrait 16:25) to replace the drawn phones,
  and `demo.mp4` as the live-demo fallback.

## Before the event

- Co-speaker name and company (slides 1 and 22).
- Real device screenshots in `media/`.
- Verify 1.6 KB and ≈0.7 MB (slide 14) against the shipped APK.
- Confirm catalog aliases on slide 12 against the published version.
