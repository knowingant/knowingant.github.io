#!/bin/zsh

set -euo pipefail

if (( $# < 2 || $# > 3 )); then
  echo "Usage: $0 path/to/file.tex password [Title]" >&2
  exit 1
fi

src=$1
password=$2
custom_title=${3-}

if [[ ! -f "$src" ]]; then
  echo "Missing source file: $src" >&2
  exit 1
fi

if [[ -z "$password" ]]; then
  echo "Password must not be empty" >&2
  exit 1
fi

if ! command -v latexmk >/dev/null 2>&1; then
  echo "latexmk is required" >&2
  exit 1
fi

if ! command -v gs >/dev/null 2>&1; then
  echo "Ghostscript (gs) is required for PDF encryption" >&2
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
plain_pdf="$build_dir/$base_name.pdf"
encrypted_pdf="$build_dir/$slug-encrypted.pdf"
dest_pdf="$repo_root/assets/diaries/$slug.pdf"
entry_file="$repo_root/_diaries/$slug.md"

cleanup() {
  rm -rf "$build_dir"
}
trap cleanup EXIT

latexmk -pdf -interaction=nonstopmode -halt-on-error -output-directory="$build_dir" "$src_abs"

if [[ ! -f "$plain_pdf" ]]; then
  echo "Expected PDF was not created: $plain_pdf" >&2
  exit 1
fi

gs \
  -q \
  -dBATCH \
  -dNOPAUSE \
  -sDEVICE=pdfwrite \
  -dCompatibilityLevel=1.7 \
  -dEncryptionR=3 \
  -dKeyLength=128 \
  -dPermissions=-4 \
  -sOwnerPassword="$password" \
  -sUserPassword="$password" \
  -sOutputFile="$encrypted_pdf" \
  "$plain_pdf"

if [[ ! -f "$encrypted_pdf" ]]; then
  echo "Encrypted PDF was not created: $encrypted_pdf" >&2
  exit 1
fi

mkdir -p "$repo_root/assets/diaries" "$repo_root/_diaries"
cp "$encrypted_pdf" "$dest_pdf"

cat > "$entry_file" <<EOF
---
title: "$escaped_title"
date: $today
pdf: /assets/diaries/$slug.pdf
summary: "This PDF is password-protected."
---
EOF

echo "Published encrypted diary:"
echo "  PDF:   $dest_pdf"
echo "  Entry: $entry_file"
