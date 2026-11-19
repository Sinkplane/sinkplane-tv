#!/usr/bin/env bash
# Usage: SCOPE=full|changed BASE=<git ref> scripts/mutate.sh
set -euo pipefail
cd "$(dirname "$0")/.."

stryker=node_modules/.bin/stryker
scope="${SCOPE:-full}"
base="${BASE:-origin/main}"
dirs=(app components hooks layouts constants)

if [[ "$scope" == full ]]; then
  exec "$stryker" run
fi

if [[ "$scope" != changed ]]; then
  echo "mutate: unknown SCOPE '$scope' (use full or changed)" >&2
  exit 2
fi

if ! git rev-parse --verify --quiet "$base^{commit}" >/dev/null; then
  echo "mutate: BASE '$base' does not resolve; running the full suite instead."
  exec "$stryker" run
fi

changed="$(
  {
    git diff --name-only --relative --diff-filter=d "$(git merge-base "$base" HEAD)" -- "${dirs[@]}"
    git ls-files --others --exclude-standard -- "${dirs[@]}"
  } | grep -E '\.tsx?$' | grep -vE '\.test\.tsx?$|\.d\.ts$|^app/\+html\.tsx$' | sed -E 's/\[|\]/[&]/g' | sort -u | paste -sd, - || true
)"

if [[ -z "$changed" ]]; then
  echo "mutate: no changed app source files vs $base; nothing to mutate."
  exit 0
fi

echo "mutate: $changed"
exec "$stryker" run --mutate "$changed"
