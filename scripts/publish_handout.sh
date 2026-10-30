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

if ! command -v latexmk >/dev/null 2>&1; then
  echo "latexmk is required" >&2
  exit 1
fi

build_dir=$(mktemp -d)
src_dir=$(cd "$(dirname "$src")" && pwd)
src_file=$(basename "$src")
src_abs="$src_dir/$src_file"
base_name=$(basename "$src_file" .tex)
slug_source=${custom_slug:-$base_name}
slug=$(slugify "$slug_source")
if [[ -z "$slug" ]]; then
  echo "Slug must contain at least one letter or number" >&2
  exit 1
fi
pdf_tmp="$build_dir/$base_name.pdf"
dest_pdf="$src_dir/$slug.pdf"

cleanup() {
  rm -rf "$build_dir"
}
trap cleanup EXIT

(
  cd "$src_dir"
  latexmk -pdf -interaction=nonstopmode -halt-on-error -output-directory="$build_dir" "$src_file"
)

if [[ ! -f "$pdf_tmp" ]]; then
  echo "Expected PDF was not created: $pdf_tmp" >&2
  exit 1
fi

cp "$pdf_tmp" "$dest_pdf"

echo "Published handout:"
echo "  PDF:   $dest_pdf"
echo "  TEX:   $src_abs"
