#!/bin/bash
set -e


info() {
  printf "\033[0;32m$1\033[0m\n"
}

err() {
  printf "\033[0;31m$1\033[0m\n"
}


ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

cd "$ROOT_DIR"


info "Deploying updates to GitHub..."

if [[ -d "$ROOT_DIR/dist" ]]; then
  info "Deleting old dist directory..."
  rm -rf "$ROOT_DIR/dist/"
fi

info "Generating static files..."
npm run build

info "Pushing to github..."
cd dist
if [ ! -d .git ]; then
  git init --initial-branch=master
fi
git remote remove origin 2>/dev/null || true
git remote add origin git@github.com:aimerneige/pwd.aimer.moe.git
git add -A
msg="update site $(date)"
if [ -n "$*" ]; then
  msg="$*"
fi
git commit -m "$msg"
git push -f origin master
