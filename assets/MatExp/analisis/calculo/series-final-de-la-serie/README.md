# Calculus Cases · Case 7 · The Series Finale — technical README

Code and data for the teacher generator and the students' room of *The Series Finale*. The full technical documentation (architecture, flow, formats, book pipeline) is kept with the book, in `CASO_07_EL_FINAL_DE_LA_SERIE/06_DOCUMENTACION_TECNICA.md`.

## Layout

- `data/`: the case. `sf-public.js` and `sf-episodes.js` are public; `sf-private.js` (finale, envelope, role cards, solution) is loaded only by the teacher generator.
- `sf-math.js`, `sf-evidence.js`, `sf-validate.js`, `sf-tex.js`: pure engines, tested in Node. No derivatives or integrals anywhere.
- `sf-trailer.js`, `sf-audio.js`: trailer and score, in four layers: (A) plates, final art listed in `SF.trailer.plates` and stored in `media/plates/`, or else a procedural preview marked as such; (B) mathematical effects computed as pure display lists; (C) artistic parameters; (D) composition (timeline, title cards, transitions, score). Brief for final art: `tools/shotlist.json`.
- `sf-pdf.js`, `sf-docs-student.js`, `sf-docs-teacher.js`, `sf-build.js`: PDFs in the house style, plan, packets and JSON packages.
- `sf-generator.js`, `sf-app.js`: the two interfaces. `room/index.html` runs the room without Jekyll (offline: put `jspdf.umd.min.js` in `vendor/`).
- `tests/`: `node --test tests/*.test.js`.
- `tools/`: `render_pdfs.py` (headless-Chrome PDFs for the book), `export_cards_md.js`, `subset_fonts.py`, `consultant_notes.py`, `make_brand_images.py`.

## Security note

A static site keeps no secrets. Anyone who reads the source of the generator page can find the solution in `data/sf-private.js`. The protection is organisational: the students' room never loads private data, student packages carry nothing confidential (tested), and the generator is presented as a teacher page. To go further, serve `sf-private.js` from outside the public site or encrypt it with a key only the teacher holds. Nothing is sent anywhere: PDFs, ZIPs and JSON files are built in the browser, and the room keeps its progress in the team's own `localStorage`.

## When the data change

Bump `SF.meta.dataVersion` and the `?v=` mark in the four posts, run the tests, regenerate the book's PDFs and figures (`tools/render_pdfs.py`, then `textbook/scripts/series_finale_figures.py`) and re-export the cards.

Fonts: GNU FreeSans and FreeSerif subsets, GPL with the font exception (`fonts/COPYING-FreeFont.txt`).
