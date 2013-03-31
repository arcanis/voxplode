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
	var keyboard            = SWAT.device.keyboard;
	var screen              = SWAT.screen;

	var AxisHelper          = THREE.AxisHelper;
	var ImageUtils          = THREE.ImageUtils;
	var Matrix4             = THREE.Matrix4;
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
		
		this._worldMaterial = new MeshFaceMaterial( [
			new MeshLambertMaterial( { map : ImageUtils.loadTexture( 'images/grass.png' ) } )
		] );

		this._world = new World( );
		this._world3D = new Object3D( );
		
		this._generator = generator;
		this._generator.setPool( this._pool );

		this._polygonizer = new Polygonizer( );
		this._polygonizer.setPool( this._pool );
		
		this._bindWorldGenerationChain( );
		
		this._physic = [ ];
		
		this._scene = new Scene( );
		this._scene.add( this._world3D );

		this._camera = new PerspectiveCamera( );
		this._camera.position.set( 100, 100, 100 );
		this._camera.updateMatrixWorld( );
		this._scene.add( this._camera );
		
		this._player = new Player( );
		this._player.light = new PointLight( 0xffffff );
		this._player.add( this._player.light );
		this._player.acceleration = new Vector3( 0, - 13, 0 );
		this._player.velocity = new Vector3( 0, 0, 0 );
		this._player.position.set( 0, 20, 0 );
		this._scene.add( this._player );
		this._physic.push( this._player );
		
		this._loadRegionsAt( [ 0, 0, 0 ], 3 );

	};

	Game.prototype.engineUpdate = function ( timer ) {

		var delta = timer.clock.getDelta( );

		this._physic.forEach( function ( object ) {
			// Acceleration
			object.velocity.add( object.acceleration.clone( ).multiplyScalar( delta ) );

			// JUMP, JUMP, JUMP ALL AROUND
			if ( keyboard.pressed( Key.SPACE ) && object.velocity.y <= 0 )
				object.velocity.y += 7;

			// Keyboard controls
			var velocity = object.velocity.clone( ).add( new Vector3(
				keyboard.some( Key.Set.RIGHT ) - keyboard.some( Key.Set.LEFT ), 0,
				keyboard.some( Key.Set.DOWN ) - keyboard.some( Key.Set.UP ) ).multiplyScalar( 10 ) );

			// Delta factor
			velocity.multiplyScalar( delta );

			// Player orientation
			var rotationMatrix = new Matrix4( ).makeRotationAxis( new Vector3( 0, 1, 0 ), this._player.rotation.y );
			velocity.applyMatrix4( rotationMatrix );
			
			// Collision detection
			var collisions = this._computeCollisions( object, velocity );
			console.log( collisions.x, collisions.y, collisions.z );
			object.velocity.multiply( collisions );
			velocity.multiply( collisions );

			// Position update
			object.position.add( velocity );
		}, this );

	};

	Game.prototype.drawUpdate = function ( ) {

		this._camera.position.copy( this._player.position );

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

			if ( e.geometry ) {
				this._world3D.add( regions[ e.regionKey ] = new Mesh( e.geometry, this._worldMaterial ) );
				regions[ e.regionKey ].position.set( e.regionKey[ 0 ] * Region.WIDTH, e.regionKey[ 1 ] * Region.HEIGHT, e.regionKey[ 2 ] * Region.DEPTH );
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