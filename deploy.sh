#!/usr/bin/env bash

set -euo pipefail

yarn build
firebase deploy --only hosting
