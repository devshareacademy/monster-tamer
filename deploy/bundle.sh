#!/usr/bin/env bash
set -e

# download required assets for the game
curl https://github.com/devshareacademy/monster-tamer/releases/download/assets/all-game-assets.zip -LO
rm -rf assets
mkdir assets
unzip all-game-assets.zip -d assets
rm -rf assets/__MACOSX

# bundle up the game now
rm -rf dist
mkdir dist
mkdir dist/src
cp -R ../src/. dist/src
cp ../index.html dist/index.html
mv assets/assets dist/assets
