#!/bin/zsh

set -euo pipefail

slugify() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

if (( $# < 1 )); then
  echo "Usage: $0 path/to/file.tex [Title] [--slug custom-slug]" >&2
  exit 1
fi

src=$1
shift

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
        echo "Usage: $0 path/to/file.tex [Title] [--slug custom-slug]" >&2
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

if ! command -v latexmk >/dev/null 2>&1; then
  echo "latexmk is required" >&2
  exit 1
fi

repo_root=$(cd "$(dirname "$0")/.." && pwd)
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
title=${custom_title:-$base_name}
escaped_title=$(printf '%s' "$title" | sed 's/"/\\"/g')
today=$(date +%F)
pdf_tmp="$build_dir/$base_name.pdf"
dest_pdf="$src_dir/$slug.pdf"
data_dir="$repo_root/_data"
data_file="$data_dir/handouts.yml"
src_rel=${src_abs#$repo_root/}
pdf_rel=${dest_pdf#$repo_root/}
src_path="/$src_rel"
pdf_path="/$pdf_rel"

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

mkdir -p "$data_dir"
cp "$pdf_tmp" "$dest_pdf"

ruby -ryaml -rdate -e '
path = ARGV.shift
title = ARGV.shift
pdf = ARGV.shift
source = ARGV.shift
slug = ARGV.shift
date = ARGV.shift
data =
  if File.exist?(path)
    YAML.safe_load(File.read(path), permitted_classes: [Date], aliases: true)
  else
    []
  end
data = [] unless data.is_a?(Array)
data.reject! { |item| item["slug"] == slug }
data << { "title" => title, "pdf" => pdf, "source" => source, "slug" => slug, "date" => date }
File.write(path, data.to_yaml)
' "$data_file" "$escaped_title" "$pdf_path" "$src_path" "$slug" "$today"

echo "Published handout:"
echo "  PDF:   $dest_pdf"
echo "  TEX:   $src_abs"
echo "  Data:  $data_file"
