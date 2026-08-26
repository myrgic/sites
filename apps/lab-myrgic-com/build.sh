#!/bin/bash
# lab.myrgic.com — the simulation lab (the full eigen-form hub).
#
# Built from myrgic/eigen-form. This serves the WHOLE lab: every app in
# the registry, the hub shell, the kit, and the SDK. learn.myrgic.com is
# the narrower teaching surface built from the same source.
set -euo pipefail
cd "$(dirname "$0")"

EIGEN_FORM_REF="${EIGEN_FORM_REF:-main}"
EIGEN_FORM_SRC="${EIGEN_FORM_SRC:-}"

rm -rf dist build-tmp && mkdir -p dist

if [[ -n "$EIGEN_FORM_SRC" ]]; then
  echo "lab: using local eigen-form at $EIGEN_FORM_SRC"
  SRC="$EIGEN_FORM_SRC"
else
  echo "lab: fetching myrgic/eigen-form@$EIGEN_FORM_REF"
  git clone --quiet --depth 1 --branch "$EIGEN_FORM_REF" \
    https://github.com/myrgic/eigen-form.git build-tmp
  SRC="build-tmp"
fi

# Everything the lab publishes, minus repo scaffolding a browser has no
# use for.
for item in src apps hub examples dist docs index.html; do
  [[ -e "$SRC/$item" ]] && cp -r "$SRC/$item" dist/
done

rm -rf build-tmp
echo "build complete: $(find dist -type f | wc -l | tr -d ' ') files"
