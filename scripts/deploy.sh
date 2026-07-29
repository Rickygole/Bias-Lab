#!/usr/bin/env bash
set -euo pipefail

# Publishes dist to the gh-pages branch. This exists because the local GitHub
# token does not carry the workflow scope, so .github/workflows cannot be
# pushed. Once it does, delete this and let Actions do it.

cd "$(dirname "$0")/.."

npm run build
touch dist/.nojekyll

REMOTE=$(git remote get-url origin)
REV=$(git rev-parse --short HEAD)

rm -rf dist/.git
git -C dist init -q -b gh-pages
git -C dist add -A
git -C dist commit -q -m "deploy $REV"
git -C dist push -q -f "$REMOTE" gh-pages
rm -rf dist/.git

echo "deployed $REV to gh-pages"
