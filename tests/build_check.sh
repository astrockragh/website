#!/usr/bin/env bash
#
# build_check.sh — does this site still build, and does everything it points at
# still exist?
#
#   tests/build_check.sh              # toolchain + build + content checks
#   tests/build_check.sh --media      # also decode every video end to end
#   tests/build_check.sh --keep       # leave the build output for inspection
#
# Exit 0 = clean. Exit 1 = something is broken. Warnings never fail the run.

set -uo pipefail

SITE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIN_HUGO="0.146"          # README: modern template layout needs 0.146+
CHECK_MEDIA=0
KEEP_BUILD=0

for arg in "$@"; do
  case "$arg" in
    --media) CHECK_MEDIA=1 ;;
    --keep)  KEEP_BUILD=1 ;;
    -h|--help) sed -n '2,11p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $arg (try --help)" >&2; exit 2 ;;
  esac
done

if [ -t 1 ]; then
  RED=$'\033[31m'; YEL=$'\033[33m'; GRN=$'\033[32m'; DIM=$'\033[2m'; OFF=$'\033[0m'
else
  RED=''; YEL=''; GRN=''; DIM=''; OFF=''
fi

fail() { echo "${RED}FAIL${OFF}  $*"; }
warn() { echo "${YEL}warn${OFF}  $*"; }
pass() { echo "${GRN}ok${OFF}    $*"; }
step() { echo; echo "${DIM}── $* ${OFF}"; }

FAILED=0

# ── 1. toolchain ────────────────────────────────────────────────────────────
# The README's standing trap: an old hugo earlier on PATH shadows the good one,
# and fails with errors that never say "your hugo is too old". So don't just
# take `hugo` — find one that actually qualifies.
step "toolchain"

version_ok() {  # $1 = binary; echoes its version line if it qualifies
  local v num major rest minor wmajor wminor
  v="$("$1" version 2>/dev/null | head -1)" || return 1
  case "$v" in *+extended*) ;; *) return 1 ;; esac
  num="${v#*v}"                 # hugo v0.147.9+extended ... -> 0.147.9+extended ...
  num="${num%%+*}"              # -> 0.147.9   (or 0.95.0-9F2E76AF on old builds)
  major="${num%%.*}"
  rest="${num#*.}"
  minor="${rest%%.*}"
  minor="${minor%%[!0-9]*}"     # 95.0-9F2E76AF -> 0 ; guards the old-build suffix
  wmajor="${MIN_HUGO%%.*}"
  wminor="${MIN_HUGO##*.}"
  case "$major$minor" in *[!0-9]*|"") return 1 ;; esac
  if [ "$major" -gt "$wmajor" ] || { [ "$major" -eq "$wmajor" ] && [ "$minor" -ge "$wminor" ]; }; then
    echo "$v"
    return 0
  fi
  return 1
}

HUGO=""
for candidate in hugo /opt/homebrew/bin/hugo /usr/local/opt/hugo/bin/hugo \
                 /usr/local/bin/hugo "$SITE_ROOT/node_modules/.bin/hugo"; do
  command -v "$candidate" >/dev/null 2>&1 || continue
  if HUGO_VERSION="$(version_ok "$candidate")"; then HUGO="$candidate"; break; fi
done

if [ -z "$HUGO" ]; then
  fail "no hugo ${MIN_HUGO}+ extended found"
  echo "        hugo binaries seen: $(type -a -p hugo 2>/dev/null | tr '\n' ' ')"
  echo "        this site needs extended (it compiles SCSS) and ${MIN_HUGO}+"
  echo "        (layouts/_partials, layouts/_shortcodes). brew install hugo"
  exit 1
fi
pass "$HUGO"
echo "      ${DIM}${HUGO_VERSION}${OFF}"

command -v python3 >/dev/null 2>&1 || { fail "python3 not found (needed for the content checks)"; exit 1; }
python3 -c 'import yaml' 2>/dev/null || { fail "python3 has no PyYAML (pip install pyyaml)"; exit 1; }

# ── 2. build ────────────────────────────────────────────────────────────────
# Into a temp dir, never public/ — a failed run must not leave a half-built
# site sitting where a deploy would pick it up.
step "build"

BUILD_DIR="$(mktemp -d "${TMPDIR:-/tmp}/hugo-build-check.XXXXXX")"
cleanup() { [ "$KEEP_BUILD" -eq 1 ] || rm -rf "$BUILD_DIR"; }
trap cleanup EXIT

BUILD_LOG="$BUILD_DIR/.build.log"
"$HUGO" --source "$SITE_ROOT" --destination "$BUILD_DIR" \
        --minify --gc --printPathWarnings --logLevel warn >"$BUILD_LOG" 2>&1
BUILD_STATUS=$?

if [ "$BUILD_STATUS" -ne 0 ]; then
  fail "hugo exited $BUILD_STATUS"
  sed 's/^/        /' "$BUILD_LOG"
  exit 1
fi

# Warnings are the interesting half: Hugo renders a broken .Site.GetPage or a
# missing resource as empty output and carries on, so a green build says less
# than it looks like it does.
WARNINGS="$(grep -E '^(WARN|ERROR)' "$BUILD_LOG" || true)"
if [ -n "$WARNINGS" ]; then
  fail "build emitted warnings"
  echo "$WARNINGS" | sed 's/^/        /'
  FAILED=1
else
  pass "clean build, no warnings"
fi

PAGES="$(find "$BUILD_DIR" -name 'index.html' | wc -l | tr -d ' ')"
echo "      ${DIM}${PAGES} pages → ${BUILD_DIR}${OFF}"

# ── 3. content ──────────────────────────────────────────────────────────────
step "content"
python3 "$SITE_ROOT/tests/check_content.py" --root "$SITE_ROOT" --public "$BUILD_DIR"
[ $? -ne 0 ] && FAILED=1

# ── 4. media (opt-in) ───────────────────────────────────────────────────────
# The README's other hard-won lesson: a background encode once died mid-clip and
# left a truncated mp4. Checking the file exists is not enough — it existed.
if [ "$CHECK_MEDIA" -eq 1 ]; then
  step "media"
  if ! command -v ffmpeg >/dev/null 2>&1; then
    warn "ffmpeg not found — skipping decode check"
  else
    BROKEN=0
    while IFS= read -r f; do
      if ffmpeg -v error -i "$f" -f null - 2>&1 | head -1 | grep -q .; then
        fail "will not decode: ${f#$SITE_ROOT/}"
        BROKEN=1; FAILED=1
      fi
    done < <(find "$SITE_ROOT/static" "$SITE_ROOT/content" \
                  \( -name '*.mp4' -o -name '*.webm' \) -type f | sort)
    [ "$BROKEN" -eq 0 ] && pass "every video decodes end to end"
  fi
fi

# ── summary ─────────────────────────────────────────────────────────────────
echo
if [ "$FAILED" -eq 0 ]; then
  echo "${GRN}build check passed${OFF}"
else
  echo "${RED}build check failed${OFF}"
fi
[ "$KEEP_BUILD" -eq 1 ] && echo "${DIM}build kept at ${BUILD_DIR}${OFF}"
exit "$FAILED"
