#!/usr/bin/env bash
# disclosure-gate/selftest.sh — positive + negative control.
# A scanner nobody has seen fail is not evidence. This proves both directions.
# Exit 0 only if the clean fixture PASSES and the dirty fixture is REFUSED.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCAN="$HERE/scan.sh"
fail=0

echo "--- positive control: fixtures/pass must exit 0"
if out=$("$SCAN" "$HERE/fixtures/pass" 2>&1); then
  echo "  OK"
else
  echo "  FAIL: clean fixture was refused"; echo "$out" | sed 's/^/    /'; fail=1
fi

echo "--- negative control: fixtures/fail must exit 1"
if out=$("$SCAN" "$HERE/fixtures/fail" 2>&1); then
  echo "  FAIL: dirty fixture PASSED — the gate does not actually gate"; echo "$out" | sed 's/^/    /'; fail=1
else
  echo "  OK (refused)"
fi

echo "--- allowlist control: fixtures/fail + allowlist for every hard pattern must exit 0"
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
cp -R "$HERE/fixtures/fail/." "$tmp/"
printf 'OrangeLogic\nPax8\ncog://\n\.cog/mem\ndarkstar\nADR-086\n' > "$tmp/.disclosure-allow"
if "$SCAN" "$tmp" >/dev/null 2>&1; then echo "  OK"; else echo "  FAIL: allowlist not honored"; fail=1; fi

[ "$fail" -eq 0 ] && echo "disclosure-gate selftest: PASS" || echo "disclosure-gate selftest: FAIL"
exit $fail
