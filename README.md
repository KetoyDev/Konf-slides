# Konf slides

Talk decks from the KetoyVM team, served at **slides.ketoy.dev**.

| Path | Talk |
|---|---|
| `/` | landing page listing the talks |
| [`/devfest-chennai-26/`](devfest-chennai-26/) | Kotlin Over the Air — DevFest Chennai 2026 |

Each talk is a self-contained static folder (its own reveal.js copy, CSS, JS and
media), so adding a talk never touches an older one.

## Run locally

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173/> (or <http://localhost:4173/devfest-chennai-26/>).

## Deploy

Plain static site, no build step. `vercel.json` only sets `trailingSlash: true`,
so `/devfest-chennai-26` redirects to `/devfest-chennai-26/` and the deck's
relative paths (`css/`, `js/`, `vendor/`) resolve inside its folder.

## Adding a talk

1. Create a folder, e.g. `kotlinconf-27/`, with its own `index.html`.
2. Add a link to it in the root `index.html`.
