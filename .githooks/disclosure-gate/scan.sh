#!/usr/bin/env bash
# disclosure-gate/scan.sh — pre-disclosure scan for private-substrate identifiers.
#
# Named disclosure-gate, NOT "membrane": ADR-086 reserves "membrane" for the
# ADR-001 sovereignty sense. See ADR-disclosure-gate.cog.md.
#
# Usage: scan.sh <dir> [<dir>...]
# Exit 0 = clean. Exit 1 = HARD hits (refuse). Exit 0 with warnings = SOFT only.
# Allowlist: an optional .disclosure-allow file at the scan root, one ERE per
# line (# comments ignored), matched against the full "path:line:text" record.
set -uo pipefail

# HARD: private substrate / employer identifiers. Any hit refuses.
HARD='OrangeLogic|Orange Logic|OL-side|OL-ward|ol-workspace|ol-sre|Pax8|cogn8|Ditto|THESEUS|cog://|\.cog/mem|\.cog/board|\bdarkstar\b|\beclipse\b|myrgic/(cogos|constellation|theseus)|/Users/[a-z]+/workspaces/cog\b|\bRFC-[0-9]{3}\b|\bADR-[0-9]{3}\b'
# SOFT: ambiguous in public prose. Reported, does not refuse.
SOFT='\borange\b|\bVega\b|proprioception|\beigenform\b|\bCog\b'

INCLUDE=(--include='*.md' --include='*.py' --include='*.json' --include='*.sh' --include='*.yaml' --include='*.yml' --include='*.txt' --include='*.tex')
EXCLUDE=(--exclude-dir=.git --exclude-dir=node_modules --exclude-dir=__pycache__ --exclude-dir=.githooks --exclude-dir=fixtures)

rc=0
for DIR in "$@"; do
  [ -e "$DIR" ] || { echo "disclosure-gate: no such path: $DIR" >&2; exit 2; }
  ALLOW="$DIR/.disclosure-allow"
  filter() {
    if [ -f "$ALLOW" ]; then
      grep -v -E -f <(grep -v -e '^\s*#' -e '^\s*$' "$ALLOW") || true
    else
      cat
    fi
  }
  echo "== disclosure-gate: $DIR"
  hard=$(grep -rnI -E "$HARD" "$DIR" "${INCLUDE[@]}" "${EXCLUDE[@]}" 2>/dev/null | filter)
  soft=$(grep -rnI -E "$SOFT" "$DIR" "${INCLUDE[@]}" "${EXCLUDE[@]}" 2>/dev/null | filter)
  nh=$(printf '%s' "$hard" | grep -c . || true)
  ns=$(printf '%s' "$soft" | grep -c . || true)
  [ "$ns" -gt 0 ] && { echo "-- SOFT ($ns) — review, does not block:"; printf '%s\n' "$soft" | head -20; }
  if [ "$nh" -gt 0 ]; then
    echo "-- HARD ($nh) — REFUSED:"; printf '%s\n' "$hard" | head -40
    rc=1
  fi
  echo "== $DIR: hard=$nh soft=$ns"
done
exit $rc
