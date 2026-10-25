# Minimal Mistakes remote theme starter

Click [**Use this template**](https://github.com/mmistakes/mm-github-pages-starter/generate) button above for the quickest method of getting started with the [Minimal Mistakes Jekyll theme](https://github.com/mmistakes/minimal-mistakes).

Contains basic configuration to get you a site with:

- Sample posts.
- Sample top navigation.
- Sample author sidebar with social links.
- Sample footer links.
- Paginated home page.
- Archive pages for posts grouped by year, category, and tag.
- Sample about page.
- Sample 404 page.
- Site wide search.

Replace sample content with your own and [configure as necessary](https://mmistakes.github.io/minimal-mistakes/docs/configuration/).

---

## Lean formalizations (published by Proofline)

`research/lean/` holds formalizations of my articles in Lean 4 with Mathlib. They are **written, verified and generated in Proofline**, which runs Lean, Lake, Mathlib and Verso; this site only serves the result as static files. Nothing here runs Lean -- not GitHub Pages and not the workflow.

- `research/lean/<identifier>/` is the main page of a formalization and always shows its latest public version; `research/lean/<identifier>/vN/` are the permanent public versions (never edited by hand). A version cites and links the arXiv version of the article it formalizes when Proofline was given one; otherwise it names no version of the article. Each version folder holds `formalization.json` (what the page shows), `verification.json`, `MANIFEST.json` (every file's SHA-256), the reproducible Lean project as a ZIP, Verso's interactive documentation under `docs/` and the page's viewer under `viewer/`.
- `_layouts/lean-formalization.html` lays a formalization out inside the theme; `_includes/lean/formalizations-list.html` lists them on the research pages from `_data/lean_formalizations.json`; `research/lean/index.md` is the index at `/research/lean/`.
- `research/lean` is excluded from jekyll-polyglot's localization, so its files are built once rather than copied under `/en/`.

To publish: in Proofline, **Lean → Publish → Export formalization to the website** with this repository chosen under **Lean → Website**, then commit and push. The workflow runs `scripts/check_lean_publications.py` (every version must still match its manifest, its documentation links and its ZIP) before building with Jekyll.

## Troubleshooting

If you have a question about using Jekyll, start a discussion on the [Jekyll Forum](https://talk.jekyllrb.com/) or [StackOverflow](https://stackoverflow.com/questions/tagged/jekyll). Other resources:

- [Ruby 101](https://jekyllrb.com/docs/ruby-101/)
- [Setting up a Jekyll site with GitHub Pages](https://jekyllrb.com/docs/github-pages/)
- [Configuring GitHub Metadata](https://github.com/jekyll/github-metadata/blob/master/docs/configuration.md#configuration) to work properly when developing locally and avoid `No GitHub API authentication could be found. Some fields may be missing or have incorrect data.` warnings.
