#!/bin/zsh

set -euo pipefail

if (( $# < 1 || $# > 2 )); then
  echo "Usage: $0 path/to/file.tex [Title]" >&2
  exit 1
fi

src=$1
custom_title=${2-}

if [[ ! -f "$src" ]]; then
  echo "Missing source file: $src" >&2
  exit 1
fi

if ! command -v latexmk >/dev/null 2>&1; then
  echo "latexmk is required" >&2
  exit 1
fi

repo_root=$(cd "$(dirname "$0")/.." && pwd)
build_dir=$(mktemp -d)
src_abs=$(cd "$(dirname "$src")" && pwd)/$(basename "$src")
base_name=$(basename "$src_abs" .tex)
slug=$(printf '%s' "$base_name" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')
title=${custom_title:-$base_name}
escaped_title=$(printf '%s' "$title" | sed 's/"/\\"/g')
today=$(date +%F)
pdf_tmp="$build_dir/$base_name.pdf"
dest_pdf="$repo_root/assets/handouts/$slug.pdf"
entry_file="$repo_root/_handouts/$slug.md"

cleanup() {
  rm -rf "$build_dir"
}
trap cleanup EXIT

latexmk -pdf -interaction=nonstopmode -halt-on-error -output-directory="$build_dir" "$src_abs"

if [[ ! -f "$pdf_tmp" ]]; then
  echo "Expected PDF was not created: $pdf_tmp" >&2
  exit 1
fi

mkdir -p "$repo_root/assets/handouts" "$repo_root/_handouts"
cp "$pdf_tmp" "$dest_pdf"

cat > "$entry_file" <<EOF
---
title: "$escaped_title"
date: $today
pdf: /assets/handouts/$slug.pdf
---
EOF

echo "Published handout:"
echo "  PDF:   $dest_pdf"
echo "  Entry: $entry_file"
