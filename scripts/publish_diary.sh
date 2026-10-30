#!/bin/zsh

set -euo pipefail

slugify() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

if (( $# < 1 )); then
  echo "Usage: $0 path/to/file.tex [--slug custom-slug]" >&2
  exit 1
fi

src=$1
shift

custom_slug=""

while (( $# > 0 )); do
  case "$1" in
    --slug)
      if (( $# < 2 )); then
        echo "Missing value for --slug" >&2
        exit 1
      fi
      custom_slug=$2
      shift 2
      ;;
    *)
      echo "Unexpected extra argument: $1" >&2
      echo "Usage: $0 path/to/file.tex [--slug custom-slug]" >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "$src" ]]; then
  echo "Missing source file: $src" >&2
  exit 1
fi

for cmd in latexmk qpdf pbcopy python3; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "$cmd is required" >&2
    exit 1
  fi
done

repo_root=$(cd "$(dirname "$0")/.." && pwd)
build_dir=$(mktemp -d)
src_dir=$(cd "$(dirname "$src")" && pwd)
src_file=$(basename "$src")
base_name=$(basename "$src_file" .tex)
slug_source=${custom_slug:-$base_name}
slug=$(slugify "$slug_source")
if [[ -z "$slug" ]]; then
  echo "Slug must contain at least one letter or number" >&2
  exit 1
fi
plain_pdf="$build_dir/$base_name.pdf"
encrypted_pdf="$build_dir/$slug-encrypted.pdf"
dest_dir="$repo_root/assets/diaries/$slug"
dest_pdf="$dest_dir/$slug.pdf"
url="https://knowingant.github.io/assets/diaries/$slug/$slug.pdf"
# One "slug `password`" line per diary. This file must stay out of git.
password_file="$repo_root/private/diary-passwords.txt"

if ! git -C "$repo_root" check-ignore -q "$password_file"; then
  echo "Refusing to run: $password_file is not gitignored" >&2
  exit 1
fi

password=$(python3 -c 'import secrets, string; print("".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16)))')

cleanup() {
  rm -rf "$build_dir"
}
trap cleanup EXIT

(
  cd "$src_dir"
  latexmk -pdf -interaction=nonstopmode -halt-on-error -output-directory="$build_dir" "$src_file"
)

if [[ ! -f "$plain_pdf" ]]; then
  echo "Expected PDF was not created: $plain_pdf" >&2
  exit 1
fi

qpdf --encrypt --user-password="$password" --owner-password="$password" --bits=256 -- \
  "$plain_pdf" "$encrypted_pdf"

if [[ ! -f "$encrypted_pdf" ]]; then
  echo "Encrypted PDF was not created: $encrypted_pdf" >&2
  exit 1
fi

mkdir -p "$dest_dir" "$(dirname "$password_file")"
cp "$encrypted_pdf" "$dest_pdf"

touch "$password_file"
grep -v "^$slug " "$password_file" > "$build_dir/passwords" || true
printf '%s `%s`\n' "$slug" "$password" >> "$build_dir/passwords"
cp "$build_dir/passwords" "$password_file"

printf '@everyone\n%s\nPW (click to copy on mobile): `%s`\n' "$url" "$password" | pbcopy

echo "Published encrypted diary:"
echo "  PDF:       $dest_pdf"
echo "  Password:  saved to $password_file"
echo "Copied the Discord announcement to the clipboard."
