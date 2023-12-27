#!/usr/bin/env bash
set -e

curl https://github.com/devshareacademy/monster-tamer/releases/download/assets/all-game-assets.zip -LO
rm -rf assets
mkdir assets
unzip all-game-assets.zip -d assets
rm -rf assets/__MACOSX

# bundle up the game now
