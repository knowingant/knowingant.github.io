#!/bin/zsh

set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)

"$repo_root/scripts/sync_handouts.sh"
"$repo_root/scripts/build_site.sh" "$@"
