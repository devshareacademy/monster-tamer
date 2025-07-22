export const OBJECT_LAYER_NAMES = Object.freeze({
  EVENTS: 'Events',
  SIGN: 'Sign',
  SCENE_TRANSITIONS: 'Scene-Transitions',
  PLAYER_SPAWN_LOCATION: 'Player-Spawn-Location',
  AREA_METADATA: 'Area-Metadata',
  ITEM: 'Item',
  REVIVE_LOCATION: 'Revive-Location',
  CAMERA_BOUNDS: 'Camera-Bounds',
});

export const TILED_SIGN_PROPERTY = Object.freeze({
  MESSAGE: 'message',
});

export const CUSTOM_TILED_TYPES = Object.freeze({
  NPC: 'npc',
  NPC_PATH: 'npc_path',
});

export const TILED_NPC_PROPERTY = Object.freeze({
  MOVEMENT_PATTERN: 'movement_pattern',
  FRAME: 'frame',
  ID: 'id',
});

export const TILED_ENCOUNTER_PROPERTY = Object.freeze({
  AREA: 'area',
  TILE_TYPE: 'tileType',
});

export const TILED_ITEM_PROPERTY = Object.freeze({
  ITEM_ID: 'item_id',
  ID: 'id',
});

export const TILED_AREA_METADATA_PROPERTY = Object.freeze({
  FAINT_LOCATION: 'faint_location',
  ID: 'id',
});

export const TILED_EVENT_PROPERTY = Object.freeze({
  ID: 'id',
});
