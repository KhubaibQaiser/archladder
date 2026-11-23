#!/usr/bin/env bash
set -euo pipefail
# Caseflow is public. The pinned commit keeps graders that cite its ADRs and code valid.
git init -q .
git remote add origin https://github.com/KhubaibQaiser/caseflow.git
git fetch -q --depth 1 origin 1ca143fe7667fd9a6b17672977799919ff64345a
git checkout -q FETCH_HEAD
