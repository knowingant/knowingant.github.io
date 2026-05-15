#!/bin/zsh

set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
source_dir="$repo_root/handouts"
publish_script="$repo_root/scripts/publish_handout.sh"

if [[ ! -d "$source_dir" ]]; then
  echo "Missing handout source directory: $source_dir" >&2
  exit 1
fi

found=0
failures=()

while IFS= read -r tex_file; do
  found=1
  if ! "$publish_script" "$tex_file"; then
    failures+=("$tex_file")
  fi
done < <(find "$source_dir" -type f -name '*.tex' | sort)

if [[ $found -eq 0 ]]; then
  echo "No handout .tex files found in $source_dir"
fi

if (( ${#failures[@]} > 0 )); then
  echo >&2
  echo "Handout sync finished with failures:" >&2
  for tex_file in "${failures[@]}"; do
    echo "  $tex_file" >&2
  done
  exit 1
fi
