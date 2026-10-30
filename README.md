# Workflow

- Write handouts in handouts/ and run ./scripts/sync_handouts.sh to rebuild their PDFs.
- Write diaries in private/diaries/ and run publish_diary.sh. It picks a random
  password, saves it to private/diary-passwords.txt, and copies the Discord
  announcement to the clipboard. Example:
```sh
./scripts/publish_diary.sh private/diaries/daily/week2/week2.tex
```
- List new handouts and diaries by hand in handouts.md and diaries.md.
- Preview locally with ./scripts/serve_site.sh. GitHub Pages builds the site on push.
