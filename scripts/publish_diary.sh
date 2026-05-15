#!/bin/zsh

set -euo pipefail

slugify() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

if (( $# < 2 )); then
  echo "Usage: $0 path/to/file.tex password [Title] [--slug custom-slug]" >&2
  exit 1
fi

src=$1
password=$2
shift 2

custom_title=""
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
      if [[ -n "$custom_title" ]]; then
        echo "Unexpected extra argument: $1" >&2
        echo "Usage: $0 path/to/file.tex password [Title] [--slug custom-slug]" >&2
        exit 1
      fi
      custom_title=$1
      shift
      ;;
  esac
done

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
src_dir=$(cd "$(dirname "$src")" && pwd)
src_file=$(basename "$src")
base_name=$(basename "$src_file" .tex)
slug_source=${custom_slug:-$base_name}
slug=$(slugify "$slug_source")
if [[ -z "$slug" ]]; then
  echo "Slug must contain at least one letter or number" >&2
  exit 1
fi
title=${custom_title:-$base_name}
escaped_title=$(printf '%s' "$title" | sed 's/"/\\"/g')
today=$(date +%F)
plain_pdf="$build_dir/$base_name.pdf"
encrypted_pdf="$build_dir/$slug-encrypted.pdf"
dest_dir="$repo_root/assets/diaries/$slug"
dest_pdf="$dest_dir/$slug.pdf"
data_dir="$repo_root/_data"
data_file="$data_dir/diaries.yml"
pdf_path="/assets/diaries/$slug/$slug.pdf"
summary="This PDF is password-protected."

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

mkdir -p "$dest_dir" "$data_dir"
cp "$encrypted_pdf" "$dest_pdf"

ruby -ryaml -rdate -e '
path = ARGV.shift
title = ARGV.shift
pdf = ARGV.shift
slug = ARGV.shift
date = ARGV.shift
summary = ARGV.shift
data =
  if File.exist?(path)
    YAML.safe_load(File.read(path), permitted_classes: [Date], aliases: true)
  else
    []
  end
data = [] unless data.is_a?(Array)
data.reject! { |item| item["slug"] == slug }
data << { "title" => title, "pdf" => pdf, "slug" => slug, "date" => date, "summary" => summary }
File.write(path, data.to_yaml)
' "$data_file" "$escaped_title" "$pdf_path" "$slug" "$today" "$summary"

echo "Published encrypted diary:"
echo "  PDF:   $dest_pdf"
echo "  Data:  $data_file"
