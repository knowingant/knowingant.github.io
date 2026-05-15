# Workflow

- Write handouts in handouts/ and run ./scripts/update_site.sh
- Write diaries in private/diaries/
- Run publish_diary.sh. Example:
Example:
```sh
./scripts/publish_diary.sh private/diaries/week2/week2.tex "PASSWORD" "Week 2" --slug week2
```
- Run ./scripts/build_site.sh.