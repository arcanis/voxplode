define( [

	'SWAT',
	'THREE',

	'url!worker/generator',
	'url!worker/polygonizer',

	'helpers/Player',

	'Polygonizer',
	'Region',
	'World'

], function ( SWAT, THREE, generatorWorker, polygonizerWorker, Player, Polygonizer, Region, World ) {
	
	var Multi               = SWAT.thread.Multi;
	var Pool                = SWAT.thread.Pool;
	var Key                 = SWAT.device.Key;
	var Keyset              = SWAT.device.Keyset;
	var keyboard            = SWAT.device.keyboard;
	var mouse               = SWAT.device.mouse;
	var screen              = SWAT.screen;

	var Fog                 = THREE.Fog;
	var ImageUtils          = THREE.ImageUtils;
	var Matrix4             = THREE.Matrix4;
	var MeshBasicMaterial   = THREE.MeshBasicMaterial;
	var MeshLambertMaterial = THREE.MeshLambertMaterial;
	var MeshFaceMaterial    = THREE.MeshFaceMaterial;
	var Mesh                = THREE.Mesh;
	var Object3D            = THREE.Object3D;
	var PerspectiveCamera   = THREE.PerspectiveCamera;
	var PointLight          = THREE.PointLight;
	var Scene               = THREE.Scene;
	var Vector3             = THREE.Vector3;

	var Game = function ( generator ) {

		this._pool = new Pool( new Multi( [ generatorWorker, polygonizerWorker ] ), 10 );
		
		this._worldMaterials = [
			new MeshLambertMaterial( { color : 0xff0000 } ),
			new MeshLambertMaterial( { color : 0x0000ff } )
		];

		this._world = new World( );
		this._world3D = new Object3D( );
		
		this._generator = generator;
		this._generator.setPool( this._pool );

		this._polygonizer = new Polygonizer( );
		this._polygonizer.setPool( this._pool );
		
		this._bindWorldGenerationChain( );
		
		this._physic = [ ];
		
		this._scene = new Scene( );
		this._scene.fog = new Fog( 0xcce0ff, 500, 1000 );
		this._scene.add( this._world3D );
		
		this._camera = new PerspectiveCamera( );
		this._cameraPitch = new Object3D( );
		this._cameraYaw = new Object3D( );
		this._cameraBase = new Object3D( );

		this._scene.add( this._cameraBase );
		this._cameraBase.add( this._cameraYaw );
		this._cameraYaw.add( this._cameraPitch );
		this._cameraPitch.add( this._camera );

		this._light = new PointLight( 0xffffff );
		this._scene.add( this._light );
		
		this._player = new Player( );
		this._player.acceleration = new Vector3( 0, - 43, 0 );
		this._player.velocity = new Vector3( 0, 0, 0 );
		this._player.position.set( 0, 20, 0 );
		this._scene.add( this._player );
		this._physic.push( this._player );
		
		this._loadRegionsAt( [ 0, 0, 0 ], 5 );

		screen.setClearColor( this._scene.fog.color );
		screen.domElement.addEventListener( 'click', function ( ) {
			screen.domElement.requestPointerLock( );
		} );

	};

	Game.prototype.engineUpdate = function ( timer ) {

		var delta = timer.clock.getDelta( );

		this._physic.forEach( function ( object ) {
			// Acceleration
			object.velocity.add( object.acceleration.clone( ).multiplyScalar( delta ) );

			// JUMP, JUMP, JUMP ALL AROUND
			if ( keyboard.pressed( Key.SPACE ) && object.velocity.y <= 0 )
				object.velocity.y += 20;

			// Keyboard controls
			var velocity = object.velocity.clone( ).add( new Vector3(
				keyboard.some( Keyset.RIGHT ) - keyboard.some( Keyset.LEFT ), 0,
				keyboard.some( Keyset.DOWN ) - keyboard.some( Keyset.UP ) ).multiplyScalar( 10 ) );

			// Delta factor
			velocity.multiplyScalar( delta );

			// Player orientation
			var rotationMatrix = new Matrix4( ).makeRotationAxis( new Vector3( 0, 1, 0 ), this._cameraYaw.rotation.y );
			velocity.applyMatrix4( rotationMatrix );
			
			// Collision detection
			var collisions = this._computeCollisions( object, velocity );
			object.velocity.multiply( collisions );
			velocity.multiply( collisions );

			// Position update
			object.position.add( velocity );
		}, this );

		var playerPosition = [ Math.floor( this._player.position.x ), Math.floor( this._player.position.y ), Math.floor( this._player.position.z ) ];
		this._loadRegionsAt( playerPosition, 5 );

	};

	Game.prototype.drawUpdate = function ( timer ) {

		var delta = timer.clock.getDelta( );

		var maxPitch = Math.PI / 2 * .9;
		this._cameraYaw.rotation.y -= mouse.movement.x * Math.PI / 5 * delta;
		this._cameraPitch.rotation.x -= mouse.movement.y * Math.PI / 5 * delta;
		this._cameraPitch.rotation.x = SWAT.math.clamp( this._cameraPitch.rotation.x, - maxPitch, maxPitch );
		mouse.movement.set( 0, 0 );

		this._cameraBase.position.copy( this._player.position );
		this._cameraBase.position.add( new Vector3( 0, 4, 0 ) );

		this._light.position.copy ( this._cameraBase.position );

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

		var regions = Object.create( null );

		this._polygonizer.addEventListener( 'polygonization', function ( e ) {

			if ( regions[ e.regionKey ] )
				this._world3D.remove( regions[ e.regionKey ] );

			if ( e.geometries ) {
				this._world3D.add( regions[ e.regionKey ] = new Object3D( ) );
				regions[ e.regionKey ].position.set( e.regionKey[ 0 ] * Region.WIDTH, e.regionKey[ 1 ] * Region.HEIGHT, e.regionKey[ 2 ] * Region.DEPTH );
				Object.keys( e.geometries ).forEach( function ( materialIndex ) {
					regions[ e.regionKey ].add( new Mesh( e.geometries[ materialIndex ], this._worldMaterials[ materialIndex ] ) );
				}, this );
			}

		}.bind( this ) );

		this._world.addEventListener( 'new, update', function ( e ) {
			this._polygonizer.polygonize( e.regionKey, e.region );
		}.bind( this ) );

		this._generator.addEventListener( 'generation', function ( e ) {
			this._world.setRegion( e.regionKey, e.region );
		}.bind( this ) );

	};

	Game.prototype._loadRegionsAt = function ( worldVoxel, radius ) {

		var mainRegionKey = World.getMainRegionKeyFromWorldVoxel( worldVoxel );

		for ( var x = - radius; x <= radius; ++ x ) {
			var dist = Math.sqrt( Math.pow( radius, 2 ) - Math.pow( x, 2 ) );
			for ( var z = Math.floor( - dist ), Z = Math.ceil( + dist ); z <= Z; ++ z ) {
				this._loadRegion( [ mainRegionKey[ 0 ] + x, mainRegionKey[ 1 ], mainRegionKey[ 2 ] + z ] );
			}
		}

		return this;

	};

	Game.prototype._loadRegion = function ( regionKey ) {

		if ( ! this._world.getRegion( regionKey ) )
			this._generator.generate( regionKey );

		return this;

	};

	return Game;

} );
