#!/bin/zsh

set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)

cd "$repo_root"
RUBYOPT='-r./_plugins/ruby4_compat.rb' bundle exec jekyll build "$@"
