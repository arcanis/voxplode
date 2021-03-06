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

- `speed [amount]`

  Without parameter, returns the current player speed. With a parameter, changes this speed.

## Fly mode

When gravity is on, you can move up and done by using `Ctrl` and `Shift` keys.

The current version enable gravity by default, or else you will fall into The Void until the player's chunk has been generated (which can take some times).

## Performances

The game is not heavily-optimized (it uses ES5 array functions instead of `for` loops, for example), and is being tested on an Asus G74SX using the latest stable Chromium build.

Worst times are about 1s/generation and 4s/polygonization (repeat this for each generated/polygonized chunk). A standard scene is currently configured to build a 6-chunks-radius circle at startup, so it means that a bit more than 114 chunks are generated then polygonized. 8 workers are used to parallelize the tasks, but since we are talking about worst case they do not count in the overall formula (since your computer can be monocore, which means that the execution will actually not be parallel). So the maximal theorical time to fully generating a scene should be about 114*(1+4)=9.5m (so about 1.2m with a multicore processor). In my own case, the scene is loaded in about 45s, which is not so bad.

In-game performances seems to go from 40fps to 60fps, depending on the situation.

![Screenshot](http://www.clipular.com/c?4646012=hKAJ5eo1WhPCVxRYLunuUMxET64&f=.png)
