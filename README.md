# Voxplode

Voxplode is an HTML5 3D game exploiting the [SWAT](http://arcanis.github.io/swat/) game engine. It features a 3D voxel world dynamically generated.

The game is still in a early stage of development, a lot of features and improvements are yet to be done.

## Console

To access the console, press the `` ` `` (qwerty) or ` ² ` (azerty) keys (above the tab key). It should pause the game engine and bring up the debug terminal.

For now, the following commands are available :

- `goto <x> <y> <z>`

  Instantly teleports the player to the specified location

- `gravity [on|off]`

  Without parameter, returns the current gravity value. With a parameter, switches gravity state.

## Fly mode

When gravity is on, you can move up and done by using `Ctrl` and `Shift` keys.

The current version enable gravity by default, or else you will fall into The Void until the player's chunk has been generated (which can take some times).

## Performances

The game is not heavily-optimized (it uses ES5 array functions instead of `for` loops, for example), and is being tested on an Asus G74SX using the latest stable Chromium build.

Worst times are about 1s/generation and 4s/polygonization (repeat this for each generated/polygonized chunk). A standard scene is currently configured to build a 10-chunks-radius circle at startup, so it means that a bit more than 314 chunks are generated then polygonized. 10 workers are used to parallelize the tasks, but since we are talking about worst case they do not count in the overall formula (since your computer can be monocore, which means that the execution will actually not be parallel). So the maximal theorical time to fully generating a scene should be about 314*(1+4)=31m (and 3.1m with a multicore processor). In my own case, the scene is loaded in about 1.5m, which is not so bad.

In-game performances are various : you can have from about 20fps (when you are looking in a direction where a lot of chunks have been generated) to 50fps (when you are looking in a direction where only a few chunks have been generated).
