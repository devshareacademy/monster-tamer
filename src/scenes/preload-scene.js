import Phaser from '../lib/phaser.js';
import {
  ATTACK_ASSET_KEYS,
  BATTLE_ASSET_KEYS,
  BATTLE_BACKGROUND_ASSET_KEYS,
  CHARACTER_ASSET_KEYS,
  DATA_ASSET_KEYS,
  HEALTH_BAR_ASSET_KEYS,
  MONSTER_ASSET_KEYS,
  UI_ASSET_KEYS,
  WORLD_ASSET_KEYS,
} from '../assets/asset-keys.js';
import { SCENE_KEYS } from './scene-keys.js';
import WebFontFileLoader from '../assets/web-font-file-loader.js';
import { KENNY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({
      key: SCENE_KEYS.PRELOAD_SCENE,
    });
  }

  preload() {
    console.log(`[${PreloadScene.name}:preload] invoked`);

    const monsterTamerAssetPath = 'assets/images/monster-tamer';
    const kenneysAssetPath = 'assets/images/kenneys-assets';
    const pimenAssetPath = 'assets/images/pimen';
    const axulartAssetPath = 'assets/images/axulart';
    const pbGamesAssetPath = 'assets/images/parabellum-games';

    // battle backgrounds
    this.load.image(
      BATTLE_BACKGROUND_ASSET_KEYS.FOREST,
      `${monsterTamerAssetPath}/battle-backgrounds/forest-background.png`
    );

    // battle assets
    this.load.image(BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND, `${kenneysAssetPath}/ui-space-expansion/custom-ui.png`);

    // health bar assets
    this.load.image(
      HEALTH_BAR_ASSET_KEYS.RIGHT_CAP,
      `${kenneysAssetPath}/ui-space-expansion/barHorizontal_green_right.png`
    );
    this.load.image(HEALTH_BAR_ASSET_KEYS.MIDDLE, `${kenneysAssetPath}/ui-space-expansion/barHorizontal_green_mid.png`);
    this.load.image(
      HEALTH_BAR_ASSET_KEYS.LEFT_CAP,
      `${kenneysAssetPath}/ui-space-expansion/barHorizontal_green_left.png`
    );
    this.load.image(
      HEALTH_BAR_ASSET_KEYS.LEFT_CAP_SHADOW,
      `${kenneysAssetPath}/ui-space-expansion/barHorizontal_shadow_left.png`
    );
    this.load.image(
      HEALTH_BAR_ASSET_KEYS.MIDDLE_SHADOW,
      `${kenneysAssetPath}/ui-space-expansion/barHorizontal_shadow_mid.png`
    );
    this.load.image(
      HEALTH_BAR_ASSET_KEYS.RIGHT_CAP_SHADOW,
      `${kenneysAssetPath}/ui-space-expansion/barHorizontal_shadow_right.png`
    );

    // monster assets
    this.load.image(MONSTER_ASSET_KEYS.CARNODUSK, `${monsterTamerAssetPath}/monsters/carnodusk.png`);
    this.load.image(MONSTER_ASSET_KEYS.IGUANIGNITE, `${monsterTamerAssetPath}/monsters/iguanignite.png`);

    // ui assets
    this.load.image(UI_ASSET_KEYS.CURSOR, `${monsterTamerAssetPath}/ui/cursor.png`);

    // load json data
    this.load.json(DATA_ASSET_KEYS.ATTACKS, 'assets/data/attacks.json');

    // load custom fonts
    this.load.addFile(new WebFontFileLoader(this.load, [KENNY_FUTURE_NARROW_FONT_NAME]));

    // load attack assets
    this.load.spritesheet(ATTACK_ASSET_KEYS.ICE_SHARD, `${pimenAssetPath}/ice-attack/active.png`, {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet(ATTACK_ASSET_KEYS.ICE_SHARD_START, `${pimenAssetPath}/ice-attack/start.png`, {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet(ATTACK_ASSET_KEYS.SLASH, `${pimenAssetPath}/slash.png`, {
      frameWidth: 48,
      frameHeight: 48,
    });

    // load world assets
    this.load.image(WORLD_ASSET_KEYS.WORLD_BACKGROUND, `${monsterTamerAssetPath}/map/level_background.png`);

    // load character images
    this.load.spritesheet(CHARACTER_ASSET_KEYS.PLAYER, `${axulartAssetPath}/character/custom.png`, {
      frameWidth: 64,
      frameHeight: 88,
    });
    this.load.spritesheet(CHARACTER_ASSET_KEYS.NPC, `${pbGamesAssetPath}/characters.png`, {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  create() {
    console.log(`[${PreloadScene.name}:create] invoked`);
    this.scene.start(SCENE_KEYS.WORLD_SCENE);
  }
}
