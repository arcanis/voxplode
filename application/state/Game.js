define( [

	'JQUERY',
	'SWAT',
	'THREE',
	'THREE.OBJLoader',

	'url!worker/generator',
	'url!worker/polygonizer',

	'helpers/Player',

	'Polygonizer',
	'Region',
	'World'

], function ( $, SWAT, THREE, THREE, generatorWorker, polygonizerWorker, Player, Polygonizer, Region, World ) {

	var FPSCounter          = SWAT.time.FPSCounter;
	var Multi               = SWAT.thread.Multi;
	var Pool                = SWAT.thread.Pool;
	var Key                 = SWAT.device.Key;
	var Keyset              = SWAT.device.Keyset;
	var keyboard            = SWAT.device.keyboard;
	var mouse               = SWAT.device.mouse;
	var screen              = SWAT.device.screen;
	var shell               = SWAT.exec.shell;

	var Fog                 = THREE.Fog;
	var ImageUtils          = THREE.ImageUtils;
	var Matrix4             = THREE.Matrix4;
	var MeshBasicMaterial   = THREE.MeshBasicMaterial;
	var MeshLambertMaterial = THREE.MeshLambertMaterial;
	var MeshFaceMaterial    = THREE.MeshFaceMaterial;
	var Mesh                = THREE.Mesh;
	var OBJLoader           = THREE.OBJLoader;
	var Object3D            = THREE.Object3D;
	var PerspectiveCamera   = THREE.PerspectiveCamera;
	var PointLight          = THREE.PointLight;
	var Scene               = THREE.Scene;
	var Vector3             = THREE.Vector3;

	var Game = function ( generator ) {

		this._engineFpsCounter = new FPSCounter( );
		this._drawFpsCounter = new FPSCounter( );

		this._pool = new Pool( new Multi( [ generatorWorker, polygonizerWorker ] ), 8 );
		
		this._worldMaterials = [
			new MeshLambertMaterial( { map : ImageUtils.loadTexture( 'assets/images/dirt.png' ) } ),
			new MeshLambertMaterial( { map : ImageUtils.loadTexture( 'assets/images/grass.png' ) } ),
			new MeshLambertMaterial( { color : 0x0000ff, transparent : true, opacity : .5 } )
		];

		this._world = new World( );
		this._world3D = new Object3D( );
		this._regionsMeshes = [ ];
		
		this._generator = generator;
		this._generator.setPool( this._pool );

		this._polygonizer = new Polygonizer( );
		this._polygonizer.setPool( this._pool );

		this._bindWorldGenerationChain( );
		
		this._gravity = false;
		this._physics = [ ];
		
		this._scene = new Scene( );
		this._scene.fog = new Fog( 0xcce0ff, 500, 1000 );
		this._scene.add( this._world3D );
		
		this._player = new Player( );
		this._player.acceleration = new Vector3( 0, - 43, 0 );
		this._player.velocity = new Vector3( 0, 0, 0 );
		this._player.position.set( 61, 629, -34 );
		this._scene.add( this._player );
		this._physics.push( this._player );
		this._currentPlayerRegion = null;
		
		this._camera = new PerspectiveCamera( );
		this._cameraPitch = new Object3D( );
		this._cameraBase = new Object3D( );
		this._cameraBase.position.set( 0, 4, 0 );
		this._player.add( this._cameraBase );
		this._cameraBase.add( this._cameraPitch );
		this._cameraPitch.add( this._camera );

		this._scene.add( new THREE.AmbientLight( 0x666666 ) );
		this._light = new PointLight( 0xffffff );
		this._camera.add( this._light );
		
		this._gun = new Object3D( );
		this._gun.position.set( 1.3, - 1.1, - 3 );
		this._camera.add( this._gun );

		new OBJLoader( ).load( 'assets/models/blaster.obj', function ( group ) {

			var material = new MeshLambertMaterial( { map : THREE.ImageUtils.loadTexture( 'assets/models/blaster.png' ) } );

			group.rotation.set( - Math.PI / 2, 0, Math.PI / 2 );

			group.traverse( function ( object ) {
				if ( ! ( object instanceof Mesh ) )
					return ;
				object.scale.set( .07, .07, .07 );
				object.material = material;
			}.bind( this ) );

			this._gun.add( group );

		}.bind( this ) );

		screen.setClearColor( this._scene.fog.color );
		screen.domElement.addEventListener( 'click', function ( ) {
			screen.domElement.requestPointerLock( );
		} );

		shell.registerCommand( 'goto', this._gotoCommand, this );
		shell.registerCommand( 'gravity', this._gravityCommand, this );

	};

	Game.prototype.engineUpdate = function ( timer ) {

		var delta = timer.clock.getDelta( );

		$( '#engine-fps .value' ).text( SWAT.math.truncate( this._engineFpsCounter.step( delta ).fps, 2 ) );

		// JUMP, JUMP, JUMP ALL AROUND
		if ( this._gravity ) {
			if ( keyboard.pressed( Key.SPACE ) && this._player.velocity.y <= 0 ) {
				this._player.velocity.y += 20;
			}
		} else {
			if ( keyboard.pressed( Key.SPACE ) ) {
				this._player.position.y += 20 * delta;
			}
			if ( keyboard.pressed( Key.CONTROL ) ) {
				this._player.position.y -= 20 * delta;
			}
		}
		
		// Gravity
		this._physics.forEach( function ( object ) {

			if ( this._gravity ) object.velocity.y -= 43 * delta;

			object.frameVelocity = object.velocity.clone( ).multiplyScalar( delta );

		}, this );
		
		// Keyboard controls
		this._player.frameVelocity.add( new Vector3(
				keyboard.some( Keyset.RIGHT ) - keyboard.some( Keyset.LEFT ), 0,
				keyboard.some( Keyset.DOWN ) - keyboard.some( Keyset.UP ) ).multiplyScalar( 10 )
			.applyMatrix4( new Matrix4( ).makeRotationAxis( new Vector3( 0, 1, 0 ), this._player.rotation.y ) )
			.multiplyScalar( delta ) );
	
		// Application of velocity
		this._physics.forEach( function ( object ) {

			// Collision detection
			var collisions = this._computeCollisions( object, object.frameVelocity );
			object.frameVelocity.multiply( collisions );
			object.velocity.multiply( collisions );

			// Position update
			object.position.add( object.frameVelocity );

		}, this );

		$( '#position .x' ).text( SWAT.math.truncate( this._player.position.x, 2 ) );
		$( '#position .y' ).text( SWAT.math.truncate( this._player.position.y, 2 ) );
		$( '#position .z' ).text( SWAT.math.truncate( this._player.position.z, 2 ) );

		this._playerChunkUpdate( );

	};

	Game.prototype._playerChunkUpdate = function ( ) {

		var currentPlayerVoxel = [ Math.floor( this._player.position.x ), Math.floor( this._player.position.y ), Math.floor( this._player.position.z ) ];
		var currentPlayerRegion = World.getMainRegionKeyFromWorldVoxel( currentPlayerVoxel );

		if ( this._currentPlayerRegion !== null &&
			 this._currentPlayerRegion[ 0 ] === currentPlayerRegion[ 0 ] &&
			 this._currentPlayerRegion[ 1 ] === currentPlayerRegion[ 1 ] &&
			 this._currentPlayerRegion[ 2 ] === currentPlayerRegion[ 2 ] )
			return ;
		
		var previousPlayerRegion = this._currentPlayerRegion;
		this._currentPlayerRegion = currentPlayerRegion;

		if ( previousPlayerRegion )
			this._unloadRegionsAt( previousPlayerRegion, 6 );

		this._loadRegionsAt( currentPlayerRegion, 6 );

	};

	Game.prototype.drawUpdate = function ( timer ) {

		var delta = timer.clock.getDelta( );

		$( '#draw-fps .value' ).text( SWAT.math.truncate( this._drawFpsCounter.step( delta ).fps, 2 ) );

		var maxPitch = Math.PI / 2 * .9;
		this._player.rotation.y -= mouse.movement.x * Math.PI / 6 * delta;
		this._cameraPitch.rotation.x -= mouse.movement.y * Math.PI / 6 * delta;
		this._cameraPitch.rotation.x = SWAT.math.clamp( this._cameraPitch.rotation.x, - maxPitch, maxPitch );
		mouse.movement.set( 0, 0 );

		this.render( );
		
	};
	
	Game.prototype.render = function ( ) {
		
		if ( this._oldWidth !== screen.domElement.width || this._oldHeight !== screen.domElement.height ) {
			this._oldWidth = screen.domElement.width;
			this._oldHeight = screen.domElement.height;
			this._camera.aspect = this._oldWidth / this._oldHeight;
			this._camera.updateProjectionMatrix( );
		}

		screen.render( this._scene, this._camera );

	};

	Game.prototype._computeCollisions = function ( object, direction ) {

		var position = object.position;
		var size = object.geometry.boundingBox.size( );
		
		var check = function ( dAxis, uAxis, vAxis ) {
			
			if ( ! direction[ dAxis ] ) {
				return 1; }

			var sign = direction[ dAxis ] ? direction[ dAxis ] > 0 ? 1 : - 1 : 0;

			var from = new Vector3( );
			from[ uAxis ] = Math.floor( position[ uAxis ] - size[ uAxis ] / 2 );
			from[ vAxis ] = Math.floor( position[ vAxis ] - size[ vAxis ] / 2 );
			from[ dAxis ] = Math.floor( position[ dAxis ] + size[ dAxis ] / 2 * sign + direction[ dAxis ] );

			var to = new Vector3( );
			to[ uAxis ] = Math.ceil( position[ uAxis ] + size[ uAxis ] / 2 );
			to[ vAxis ] = Math.ceil( position[ vAxis ] + size[ vAxis ] / 2 );
			to[ dAxis ] = from[ dAxis ] + 1;

			for ( var x = from.x, X = to.x; x < X; ++ x ) {
				for ( var y = from.y, Y = to.y; y < Y; ++ y ) {
					for ( var z = from.z, Z = to.z; z < Z; ++ z ) {
						var value = this._world.getVoxel( [ x, y, z ] );
						if ( value !== 0xffffffff && value !== undefined ) {
							return 0;
						}
					}
				}
			}
			
			return 1;
			
		}.bind( this );

		return new Vector3( check( 'x', 'y', 'z' ), check( 'y', 'x', 'z' ), check( 'z', 'x', 'y' ) );

	};
	
	Game.prototype._bindWorldGenerationChain = function ( ) {

		this._polygonizer.addEventListener( 'polygonization', function ( e ) {

			if ( this._regionsMeshes[ e.regionKey ] && typeof this._regionsMeshes[ e.regionKey ] !== 'boolean' )
				this._world3D.remove( this._regionsMeshes[ e.regionKey ] );

			if ( e.geometries ) {

				var visibility = typeof this._regionsMeshes[ e.regionKey ] === 'object'
					? this._regionsMeshes[ e.regionKey ].visible
					: this._regionsMeshes[ e.regionKey ];
				console.log( typeof this._regionsMeshes[ e.regionKey ], visibility );

				this._world3D.add( this._regionsMeshes[ e.regionKey ] = new Object3D( ) );
				this._regionsMeshes[ e.regionKey ].position.set( e.regionKey[ 0 ] * Region.WIDTH, e.regionKey[ 1 ] * Region.HEIGHT, e.regionKey[ 2 ] * Region.DEPTH );

				Object.keys( e.geometries ).forEach( function ( materialIndex ) {
					this._regionsMeshes[ e.regionKey ].add( new Mesh( e.geometries[ materialIndex ], this._worldMaterials[ materialIndex ] ) );
				}, this );

				this._regionsMeshes[ e.regionKey ].traverse( function ( object ) {
					object.visible = visibility;
				} );

			}

		}.bind( this ) );

		this._world.addEventListener( 'new, update', function ( e ) {
			this._polygonizer.polygonize( e.regionKey, e.region );
		}.bind( this ) );

		this._generator.addEventListener( 'generation', function ( e ) {
			this._world.setRegion( e.regionKey, e.region );
		}.bind( this ) );

	};

	Game.prototype._loadRegionsAt = function ( regionKey, radius ) {

		for ( var x = - radius; x <= radius; ++ x ) {
			var dist = Math.sqrt( Math.pow( radius, 2 ) - Math.pow( x, 2 ) );
			for ( var z = Math.floor( - dist ), Z = Math.ceil( + dist ); z <= Z; ++ z ) {
				this._loadRegion( [ regionKey[ 0 ] + x, 0, regionKey[ 2 ] + z ] );
			}
		}

		return this;

	};

	Game.prototype._loadRegion = function ( regionKey ) {

		if ( typeof this._regionsMeshes[ regionKey ] === 'object' ) {

			this._regionsMeshes[ regionKey ].traverse( function ( object ) {
				object.visible = true;
			} );

		} else {

			this._regionsMeshes[ regionKey ] = true;

			if ( ! this._world.getRegion( regionKey ) )
				this._generator.generate( regionKey );

		}

	};

	Game.prototype._unloadRegionsAt = function ( regionKey, radius ) {

		for ( var x = - radius; x <= radius; ++ x ) {
			var dist = Math.sqrt( Math.pow( radius, 2 ) - Math.pow( x, 2 ) );
			for ( var z = Math.floor( - dist ), Z = Math.ceil( + dist ); z <= Z; ++ z ) {
				this._unloadRegion( [ regionKey[ 0 ] + x, 0, regionKey[ 2 ] + z ] );
			}
		}

	};

	Game.prototype._unloadRegion = function ( regionKey ) {

		if ( typeof this._regionsMeshes[ regionKey ] === 'object' ) {

			this._regionsMeshes[ regionKey ].traverse( function ( object ) {
				object.visible = false;
			} );

		} else {

			this._regionsMeshes[ regionKey ] = false;

		}

	};

	Game.prototype._gotoCommand = function ( stdin, stdout, argv ) {

		if ( argv.length < 4 ) {
			stdout.end( new Error( 'Usage : ' + argv[ 0 ] +' <x> <y> <z>' ) );
		} else {
			var x = Number( argv[ 1 ] ), y = Number( argv[ 2 ] ), z = Number( argv[ 3 ] );
			this._player.position.set( x, y, z );
			stdout.end( );
		}

	};

	Game.prototype._gravityCommand = function ( stdin, stdout, argv ) {

		if ( argv.length > 2 || argv.length === 2 && [ 'off', 'on' ].indexOf( argv[ 1 ] ) === - 1 ) {
			stdout.end( new Error( 'Usage : ' + argv[ 0 ] + ' [on|off]' ) );
		} else if ( argv.length === 1 ) {
			stdout.end( this._gravity ? 'Gravity is on' : 'Gravity is off' );
		} else {
			this._gravity = Boolean( [ 'off', 'on' ].indexOf( argv[ 1 ] ) );

			if ( ! this._gravity ) {
				this._physics.forEach( function ( object ) {
					object.velocity.y = 0;
				} );
			}

			stdout.end( );
		}

	};

	return Game;

} );
