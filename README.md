# Voxplode

Voxplode is an HTML5 3D game exploiting the [SWAT](http://arcanis.github.io/swat/) game engine. It features a 3D voxel world dynamically generated.

The game is still in a early stage of development, a lot of features are yet to be done.

## Console

To access the console, press the "`" (qwerty) or "²" (azerty) keys. It should pause the game engine and bring up the debug console. For now, the two following commands are available :

- **goto <x> <y> <z>** Instantly teleports the player to the specified location

- **gravity [on|off]** Without parameter, returns the current gravity value. With a parameter, switches gravity state.

## Fly mode

When gravity is on, you can move up and done by using Ctrl and Shift keys.

The current version enable gravity by default, or else you will fall into The Void until the player's chunk has been generated (which can take some times).

## Performances

The game is being tested on an Asus G74SX using the latest stable Chromium builds. World generation is kinda slow (let's say 30 secondes for a 10-radius area of chunks), but could be worse. The game works at 60 fps, except when chunks are inserted into the scene after being generated.

Firefox does not have so good performances, helas :(
