all: vendors/Perlin.js vendors/Voxel.js vendors/Game.js

vendors/Perlin.js:
	( cd js.perlin && npm install && npm run-script build )
	cp js.perlin/build/Perlin.js vendors/Perlin.js

vendors/Voxel.js:
	( cd js.voxel && npm install && npm run-script build )
	cp js.voxel/build/Voxel.js vendors/Voxel.js

vendors/Game.js:
	( cd js.game && npm install && npm run-script build )
	cp js.game/build/Game.js vendors/Game.js

.PHONY: vendors/Perlin.js vendors/Voxel.js vendors/Game.js
