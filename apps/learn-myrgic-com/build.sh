#!/bin/bash
# learn.myrgic.com — the public teaching face.
#
# Built from myrgic/eigen-form rather than from a local src/ tree: the
# lessons, their runtime, and the SDK they are themed by all live in that
# repo, and forking them here would immediately drift. src/ holds only
# what is specific to this domain (currently the redirect landing).
#
# EIGEN_FORM_REF pins the commit deployed. Leave it at a tag/SHA for a
# reproducible deploy; 'main' is convenient locally and dishonest in CI.
set -euo pipefail
cd "$(dirname "$0")"

EIGEN_FORM_REF="${EIGEN_FORM_REF:-main}"
EIGEN_FORM_SRC="${EIGEN_FORM_SRC:-}"

rm -rf dist build-tmp && mkdir -p dist

if [[ -n "$EIGEN_FORM_SRC" ]]; then
  # Local development against a working checkout.
  echo "learn: using local eigen-form at $EIGEN_FORM_SRC"
  SRC="$EIGEN_FORM_SRC"
else
  echo "learn: fetching myrgic/eigen-form@$EIGEN_FORM_REF"
  git clone --quiet --depth 1 --branch "$EIGEN_FORM_REF" \
    https://github.com/myrgic/eigen-form.git build-tmp
  SRC="build-tmp"
fi

# The learn site is the lessons surface: the hub pages that teach, the
# lesson apps, and the SDK they import. Deliberately NOT the whole lab —
# lab.myrgic.com serves that, and this domain should not quietly become a
# second copy of it.
mkdir -p dist/src dist/apps dist/hub

cp -r "$SRC/src/lesson"  dist/src/
cp -r "$SRC/src/panel"   dist/src/
cp -r "$SRC/src/params"  dist/src/

# The curriculum: each lesson's model (the mathematics), content (the
# prose), and view (the drawing). The lesson pages import these directly,
# so omitting them ships a site of blank pages.
cp -r "$SRC/curriculum" dist/

for d in "$SRC"/apps/lesson_*/; do
  [[ -d "$d" ]] || continue
  # Trailing slash on the source makes `cp -r` copy the CONTENTS, which
  # silently flattens every lesson into dist/apps/. Name the destination
  # directory explicitly instead.
  name="$(basename "$d")"
  mkdir -p "dist/apps/$name"
  cp -r "$d." "dist/apps/$name/"
done

cp "$SRC/hub/lessons.html"     dist/hub/
cp "$SRC/hub/foundations.html" dist/hub/
cp "$SRC/hub/catalog.json"     dist/hub/
cp "$SRC/hub/foundations.json" dist/hub/
cp "$SRC/hub/icon.svg"         dist/hub/ 2>/dev/null || true

# Root: the lessons page IS the site, so / serves it rather than making
# every visitor find /hub/.
cp "$SRC/hub/lessons.html" dist/index.html
# ...which means its relative asset paths (../src, ./catalog.json) must be
# rewritten for the one level they lost.
python3 - "$PWD/dist/index.html" <<'PY'
import sys
p = sys.argv[1]
s = open(p).read()
# './' NOT 'src/': a bare specifier like "src/lesson/progress.js" is not a
# legal ES module reference — the browser rejects it outright and the page
# dies silently. Relative references must start with '/', './', or '../'.
s = s.replace('../src/', './src/')
s = s.replace("'./catalog.json'", "'./hub/catalog.json'")
s = s.replace("'./foundations.json'", "'./hub/foundations.json'")
s = s.replace('"./foundations.html"', '"./hub/foundations.html"')
s = s.replace("'./foundations.html'", "'./hub/foundations.html'")
s = s.replace('"./index.html"', '"https://lab.myrgic.com/"')
s = s.replace('href="./lessons.html"', 'href="/"')
# lessonHref() builds '../apps/<id>/index.html', correct from /hub/ but one
# level too high from the root copy. Patch the helper's base instead of the
# generated strings, since the hrefs are built at runtime.
s = s.replace("return fromHub ? `../apps/", "return fromHub ? `./apps/")
s = s.replace("lessonHref(r.lesson)", "lessonHref(r.lesson).replace('../apps/', './apps/')")
s = s.replace("card.href = lessonHref(l);", "card.href = lessonHref(l).replace('../apps/', './apps/');")
open(p, 'w').write(s)

# Fail the build rather than ship a page whose modules cannot resolve.
bad = [l for l in s.splitlines()
       if "from 'src/" in l or 'from "src/' in l or 'href="src/' in l]
if bad:
    raise SystemExit('build: illegal bare specifier in root index.html:\n  '
                     + '\n  '.join(bad))
print("rewrote root index.html asset paths")
PY

# Lesson pages link back to ../../hub/lessons.html, which resolves correctly
# from dist/apps/<lesson>/, so nothing to rewrite there.

rm -rf build-tmp
echo "build complete: $(find dist -type f | wc -l | tr -d ' ') files"
