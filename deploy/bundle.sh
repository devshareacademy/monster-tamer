#!/usr/bin/env bash
set -e

# download required assets for the game
curl https://github.com/devshareacademy/monster-tamer/releases/download/assets/all-game-assets.zip -LO
rm -rf dist
mkdir dist
unzip all-game-assets.zip -d dist
rm -rf dist/__MACOSX
rm -rf dist/assets/.gitkeep

# bundle up the game now
mkdir dist/src
cp -R ./src/. dist/src
cp ./index.html dist/index.html
