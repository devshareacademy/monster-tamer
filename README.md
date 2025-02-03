# Monster Tamer

![License](https://img.shields.io/badge/license-MIT-green)

![Monster Tamer Logo](/docs/logo.png?raw=true 'Monster Tamer Logo')

Monster Tamer - Pokemon like RPG Tutorial with Phaser 3

A Pokemon like game created using [Phaser 3](https://github.com/photonstorm/phaser)!

This is the official code repository for the [Monster Tamer - Pokemon like RPG Tutorial with Phaser 3](https://www.youtube.com/playlist?list=PLmcXe0-sfoSgq-pyXrFx0GZjHbvoVUW8t) series available on YouTube.

## Demo

You can find a playable demo of the game on Itch.io here: [Monster Tamer](https://galemius.itch.io/monster-tamer)

![Monster Tamer Game play Screenshot 1](/docs/screenshot1.png?raw=true 'Screenshot 1')
![Monster Tamer Game play Screenshot 2](/docs/screenshot2.png?raw=true 'Screenshot 2')

## Local Setup

This project is currently setup to require a very minimal amount of tools to run the web application. The main tools that are needed are:

- IDE (Integrated Development Environment), or any program you can use to edit code.
  - In the video tutorial series linked above, I use the [VS Code](https://code.visualstudio.com/), and this code base has some out of the box settings and extensions that are recommended for formatting and running the code.
- A local web server, this is needed due to browser security and how we are loading files with the Phaser 3 framework for our game.
  - You can use any local web server you are familiar with, however if you use VS Code, I recommend the following extension [LiveServer by Ritwick Dey](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

### Downloading Assets

By default, none of the audio and image assets are included in the code repository. As the size of the project grows, it was chosen to omit these files and to instead provide a link to zipped folder that contains the assets that are used in this project. You find the latest assets for this game here: [Latest Game Assets](https://github.com/devshareacademy/monster-tamer/releases/download/assets/all-game-assets.zip).

After you have downloaded the assets, you will need to place the following folders in the `/assets` folder:

- audio
- images

**Note:** the `data` and `font` folders can be ignored since these are included as part of the main source code in this repo.

## How To Play

Currently, the only supported way to play the game is with a Keyboard. The game has not been tested with a Gamepad at this time, but will be supported in the future.

### Controls

| Keys                                   | Description                                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Arrow Keys (Up, Down, Left, and Right) | While in battle, these keys will move the input cursor, which allows the player to select the option. |
| Space                                  | While in battle, this key confirm the currently selected action.                                      |
| Shift                                  | While in battle, this key acts as a back key and allows players to navigate back the previous option. |

## Credits

This project uses both assets I developed as well as other assets that have been created by some wonderful creators. This project would not have been possible without the following people/resources:

| Asset                       | Author           | Link                                                                                              |
| --------------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| Fonts                       | Kenney           | [Kenney Fonts](https://www.kenney.nl/assets/kenney-fonts)                                         |
| UI Panel                    | Kenney           | [Kenney UI Space Pack](https://www.kenney.nl/assets/ui-pack-space-expansion)                      |
| UI Pack                     | Kenney           | [Kenney UI Pack](https://www.kenney.nl/assets/ui-pack)                                            |
| Board Game Info             | Kenney           | [Kenney Board Game Info Pack](https://www.kenney.nl/assets/board-game-info)                       |
| Ice Attack                  | Pimen            | [Pimen Ice Spell Effect](https://pimen.itch.io/ice-spell-effect-01)                               |
| Slash Attack                | Pimen            | [Pimen Slash VFX](https://pimen.itch.io/battle-vfx-slashes-and-thrusts)                           |
| NPC                         | Parabellum Games | [Retro RPG Character Pack](https://parabellum-games.itch.io/retro-rpg-character-pack)             |
| Player Character            | AxulArt          | [Small 8-direction Characters](https://axulart.itch.io/small-8-direction-characters)              |
| Basic Plains Tileset        | AxulArt          | [AxulArt's BasicPlains Tileset Ver. 2](https://axulart.itch.io/axularts-basicplains-tileset-ver2) |
| Beach & Caves Tileset       | AxulArt          | [AxulArt's Beach and caves tileset](https://axulart.itch.io/axularts-beach-and-caves-tileset)     |
| Building Interiors          | AxulArt          | [Basic Top-down Interior](https://axulart.itch.io/axularts-basic-top-down-interior)               |
| Retro RPG Buildings Tileset | The Pixel Nook   | [Retro RPG Buildings](https://the-pixel-nook.itch.io/rpg-building-pack)                           |
| Game BG Music               | xdeviruchi       | [xdeviruchi Sound Cloud](https://soundcloud.com/xdeviruchi)                                       |
| Sound Effects               | leohpaz          | [RPG Essentials SFX Free](https://leohpaz.itch.io/rpg-essentials-sfx-free)                        |

## Issues

For any issues you encounter, please open a new [GitHub Issue](https://github.com/devshareacademy/monster-tamer/issues) on this project.

## Questions, Comments, and Suggestions

If you have any questions, comments, or suggestions for future content, please feel free to open a new [GitHub Discussion](https://github.com/devshareacademy/monster-tamer/discussions) on this project.
