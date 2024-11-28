/**
 * @param {Phaser.Scene} scene
 * @param {Phaser.Tilemaps.Tilemap} map
 */
export function handleCreateTilesData(scene, map) {
  //This is where we will store all animated tiles that are being used in this game scene
  scene.animatedTiles = [];
  //Code to get all the tiles with animation in your tileset

  for (let i = 0; i < map.tilesets.length; i += 1) {
    const tileset = map.tilesets[i];
    const tileData = tileset.tileData;
    const firstId = tileset.firstgid;
    const lastId = map.tilesets[i + 1]?.firstgid;

    for (let tileid in tileData) {
      map.layers.forEach((layer) => {
        layer.data.forEach((tileRow) => {
          tileRow.forEach((tile) => {
            if (tile.index === -1) {
              return;
            }
            // check if tileid is within range of this tileset ids
            if (tile.index < firstId) {
              return;
            }
            if (lastId !== undefined && tile.index > lastId) {
              return;
            }
            // console.log(tileset.firstgid, tile.index, tile.index - tileset.firstgid);
            // console.log(tileData[tileid].animation[0].tileid);
            if (tile.index - tileset.firstgid === tileData[tileid].animation[0].tileid) {
              console.log('match');
              scene.animatedTiles.push({
                tile,
                tileAnimationData: tileData[tileid].animation,
                firstgid: tileset.firstgid,
                elapsedTime: 0,
              });
            }
          });
        });
      });
    }
  }

  // for (let tileset of map.tilesets) {
  //   const tileData = tileset.tileData;
  //   //For each individual tile with animation in our tilemap, get only those that are actually in the actual game scene
  //   for (let tileid in tileData) {
  //     console.log(tileid);
  //     console.log(map);
  //     //check if any of them is on the actual game scene
  //     map.layers.forEach((layer) => {
  //       //first check in any of the layers
  //       layer.data.forEach((tileRow) => {
  //         tileRow.forEach((tile) => {
  //           if (tile.index === -1) {
  //             return;
  //           }
  //           console.log(tileset.firstgid, tile.index, tileid);
  //           if (tile.index - tileset.firstgid === parseInt(tileid)) {
  //             //In case there is any, add it to the empty array that we created at the beginning
  //             scene.animatedTiles.push({
  //               tile,
  //               tileAnimationData: tileData[tileid].animation,
  //               firstgid: tileset.firstgid,
  //               elapsedTime: 0,
  //             });
  //           }
  //         });
  //       });
  //     });
  //   }
  // }

  console.log(scene.animatedTiles);
}

export function handleAnimateTiles(scene, delta) {
  //For each animated tile in our game scene:
  scene.animatedTiles.forEach((tile) => {
    //If there is no animated tile, don't run the code
    if (!tile.tileAnimationData) return;
    //Get the total animation duration of each tile
    let animationDuration = tile.tileAnimationData[0].duration * tile.tileAnimationData.length;
    //Check the elapsed time on your game scene since its started running each frame
    tile.elapsedTime += delta;
    tile.elapsedTime %= animationDuration;
    const animatonFrameIndex = Math.floor(tile.elapsedTime / tile.tileAnimationData[0].duration);
    //Change the tile index for the next one on the list
    tile.tile.index = tile.tileAnimationData[animatonFrameIndex].tileid + tile.firstgid;
  });
}
