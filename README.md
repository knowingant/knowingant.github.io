# Knowing Ant Site

This directory is a minimal GitHub Pages / Jekyll site for `knowingant.github.io`.

## Structure

- `index.md` is the landing page.
- `handouts.md` lists all published handouts.
- `diaries.md` lists all published encrypted diary PDFs.
- `handouts-src/` is where you can keep handout `.tex` source files in the repo.
- `private/diaries/` is for local diary `.tex` files and other private build artifacts.
- `_data/handouts.yml` contains metadata for published handouts.
- `_data/diaries.yml` contains metadata for published diaries.
- handout PDFs are generated next to their `.tex` source files inside `handouts-src/`.
- `assets/diaries/<slug>/` stores published encrypted diary PDFs.

## Handout workflow

```sh
./scripts/update_site.sh
```

Put handout `.tex` files in `handouts-src/`. Running `./scripts/update_site.sh` will:

- compile every `handouts-src/**/*.tex` file to a PDF next to the source file
- update `_data/handouts.yml`
- rebuild the Jekyll site into `_site/`

For a one-off publish with a custom title or slug, you can still run:

```sh
./scripts/publish_handout.sh path/to/handout.tex "Optional Title" --slug custom-slug
```

## Diary workflow

```sh
./scripts/publish_diary.sh private/diaries/week-1.tex "password" "Week 1" --slug week-1
```

Keep diary `.tex` files in `private/diaries/`. That folder is gitignored, so the source `.tex` and temporary unencrypted PDFs stay local.

This script compiles the LaTeX file, encrypts the PDF with Ghostscript, copies the encrypted PDF to `assets/diaries/<slug>/`, and records the entry in `_data/diaries.yml`.

Each published diary gets its own subfolder under `assets/`, and both handouts and diaries get entries in `_data/`.

If `--slug` is omitted, the published filename and page path are derived from the `.tex` filename.

After publishing a diary entry, rebuild the site with:

```sh
./scripts/build_site.sh
```

## Local preview

Because this repo is using an older GitHub Pages / Jekyll stack on Ruby 4, plain `bundle exec jekyll serve` may fail with a `tainted?` Liquid error. Use the wrapper script instead:

```sh
./scripts/serve_site.sh
```

Then open `http://127.0.0.1:4000/`.

For a one-off direct command, this also works:

```sh
RUBYOPT='-r./_plugins/ruby4_compat.rb' bundle exec jekyll serve
```

## Publish to GitHub

Commit and push the generated files to the `knowingant.github.io` repository. GitHub Pages will rebuild the site automatically.

## Privacy note

`private/diaries/` keeps diary source files and unencrypted intermediate PDFs out of git. If you commit `assets/diaries/*.pdf`, those encrypted PDFs will still be visible in the GitHub repository because they are part of the published site.
