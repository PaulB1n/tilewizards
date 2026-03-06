#!/usr/bin/env bash
set -euo pipefail

VERSION_SOURCE="${ASSET_VERSION:-${CF_PAGES_COMMIT_SHA:-}}"
if [ -z "${VERSION_SOURCE}" ]; then
  VERSION_SOURCE="$(date +%s)"
fi

VERSION="${VERSION_SOURCE:0:12}"
find . -maxdepth 1 -type f -name "*.html" -print0 | xargs -0 sed -i "s/__ASSET_VERSION__/${VERSION}/g"
