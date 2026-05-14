# Knowing Ant Site

This directory is a minimal GitHub Pages / Jekyll site for `knowingant.github.io`.

## Structure

- `index.md` is the landing page.
- `handouts.md` lists all published handouts.
- `diaries.md` lists all published encrypted diary PDFs.
- `_handouts/` contains one generated entry per handout.
- `_diaries/` contains one generated entry per diary.
- `assets/handouts/` stores published handout PDFs.
- `assets/diaries/` stores published encrypted diary PDFs.

## Publish a handout

```sh
./scripts/publish_handout.sh path/to/handout.tex "Optional Title"
```

This compiles the LaTeX file with `latexmk`, copies the PDF to `assets/handouts/`, and creates a matching page in `_handouts/`.

## Publish a diary entry

```sh
./scripts/publish_diary.sh path/to/entry.tex "password" "Optional Title"
```

This compiles the LaTeX file, encrypts the PDF with Ghostscript, copies it to `assets/diaries/`, and creates a matching page in `_diaries/`.

## Local preview

If the GitHub Pages gems are installed locally:

```sh
bundle exec jekyll serve
```

Then open `http://127.0.0.1:4000/`.

## Publish to GitHub

Commit and push the generated files to the `knowingant.github.io` repository. GitHub Pages will rebuild the site automatically.
