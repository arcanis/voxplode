var State = State || Object.create( null );

State.Game = function ( top ) {

	this.ready = false;

    this.top = top;
    this.scope = null;

};

State.Game.LoadRadius = 10;
State.Game.WorldHeight = 64;

State.Game.prototype.construct = function ( ) {

    hardLoader

    	// The whole class will be able to access the scope
	    .push( 'direct', function ( data ) {
			this.scope = data;
			data.top = this.top;
			delete this.top;
		}.bind( this ) )

        // Initializes THREE objects
        .push( 'direct', function ( data ) {
            data.player = new Component.Player( 0xff0000 );
            data.player.position.set( 0, 50, 0 );
            data.player.acceleration.y = -9.81 * 4;
            data.top.scene.add( data.player.object3D );

            data.light = new THREE.PointLight( 0xffffff );
            data.light.position = data.player.position;
            data.top.scene.add( data.light );

            data.top.camera = new THREE.PerspectiveCamera( 60, 1, .001, 10000 );
            data.top.camera.rotation.y = Math.PI;
            data.player.object3D.add( data.top.camera );
        } )

        // Three.js textures
        .push( 'texture', 'block:grass', 'images/grass.png' )
        .push( 'texture', 'block:dirt', 'images/dirt.png' )

        // Creates world generator & voxel manager
        .push( 'direct', function ( data ) {
			data.generator = new PERLIN.WebGLGenerator( 100, 100 ).generate( );
            data.voxelEngine = new VOXEL.Engine( );
            data.top.scene.add( ( data.voxelManager = new VOXEL.ThreeManager( data.voxelEngine, [
                new THREE.MeshLambertMaterial( { map : data[ 'block:grass' ] } ),
                new THREE.MeshLambertMaterial( { color : 0x92b5d1, opacity : 0.4, transparent : true } )
            ] ) ).object3D );
        } )

        // Creates world
        .push( 'deferred', function ( data, callback ) {
			this.loadEnviron( data.player.position );
            data.voxelEngine.polygonize( function ( err, total, progress ) {
                callback( progress / total );
            } );
        }.bind( this ), 100 )

    	// Ask mouse lock
	    .push( 'direct', function ( data ) {
			GAME.mouse.pointerMode( data.top.renderer.domElement );
			document.addEventListener( 'click', function ( ) {
				GAME.mouse.pointerMode( data.top.renderer.domElement );
			} );
    	} )

    .start( function ( data ) {

		this.ready = true;

    }.bind( this ) );

};

State.Game.prototype.loadRegion = function ( regionKey ) {
	
	if ( this.scope.voxelEngine.getRegion( regionKey ) )
		return ;

    this.scope.voxelEngine.setRegion( regionKey, new VOXEL.Region( ) );
	
    var operations = [ ];
    for ( var x = regionKey[ 0 ] * VOXEL.RegionWidth, rx = 0; rx < VOXEL.RegionWidth; ++ rx ) {
		for ( var z = regionKey[ 2 ] * VOXEL.RegionDepth, rz = 0; rz < VOXEL.RegionDepth; ++ rz ) {
			var Y0 = Math.floor( this.scope.generator.get( x + rx, z + rz ) * State.Game.WorldHeight );
			var Y0 = 15;
            for ( var y = 0; y < Y0; ++ y ) {
                this.scope.voxelEngine.setVoxel( [ x + rx, y, z + rz ], VOXEL.L0 | 0 );
            }
        }
    }
	
};

State.Game.prototype.loadEnviron = function ( position ) {

	var centerRegion = VOXEL.getMainRegionKeyFromWorldVoxel( [
		Math.floor( position.x ),
		Math.floor( position.y ),
		Math.floor( position.z )
	] );

	var radiusX = Math.ceil( State.Game.LoadRadius / VOXEL.RegionWidth );
	var radiusY = Math.ceil( State.Game.WorldHeight / VOXEL.RegionHeight );
	var radiusZ = Math.ceil( State.Game.LoadRadius / VOXEL.RegionDepth );

	var startRegion = [ centerRegion[ 0 ] - radiusX, 0, centerRegion[ 2 ] - radiusZ ];
	var endRegion = [ centerRegion[ 0 ] + radiusX, radiusY, centerRegion[ 2 ] + radiusZ ];

	for ( var regionKey = startRegion.slice( ); regionKey[ 0 ] < endRegion[ 0 ]; ++ regionKey[ 0 ] ) {
		for ( regionKey[ 1 ] = startRegion[ 1 ]; regionKey[ 1 ] < endRegion[ 1 ]; ++ regionKey[ 1 ] ) {
			for ( regionKey[ 2 ] = startRegion[ 2 ]; regionKey[ 2 ] < endRegion[ 2 ]; ++ regionKey[ 2 ] ) {
				this.loadRegion( regionKey );
			}
		}
	}

};

State.Game.prototype.updateCamera = function ( delta ) {
	
	this.scope.player.rotation.y -= GAME.mouse.movement( ).x * Math.PI / 5 * delta;
	
};

State.Game.prototype.updatePlayer = function ( delta ) {

    this.scope.player.velocity.add( this.scope.player.acceleration.clone( ).multiplyScalar( delta ) );

    var zKeysVelocity = 0;
    if ( GAME.keyboard.pressed( GAME.Key.Up ) )   zKeysVelocity += 10;
    if ( GAME.keyboard.pressed( GAME.Key.Down ) ) zKeysVelocity -= 10;

    var xKeysVelocity = 0;
    if ( GAME.keyboard.pressed( GAME.Key.Left ) )  xKeysVelocity += 10;
    if ( GAME.keyboard.pressed( GAME.Key.Right ) ) xKeysVelocity -= 10;

    if ( GAME.keyboard.pressed( GAME.Key.Space, true ) )
        this.scope.player.velocity.y += 8 * 2;

	var directionMatrix = new THREE.Matrix4( ).makeRotationAxis( new THREE.Vector3( 0, 1, 0 ), this.scope.player.rotation.y );

    var frameVelocity = this.scope.player.velocity.clone( ).add( new THREE.Vector3(
		xKeysVelocity, 0, zKeysVelocity
	).applyMatrix4( directionMatrix ) ).multiplyScalar( delta );

    var collisions = this.collide( this.scope.player, frameVelocity );
	this.scope.player.velocity.multiply( collisions );
	frameVelocity.multiply( collisions );

    this.scope.player.position.add( frameVelocity );

	$( '#position .cursor' ).text( [
		'x : ' + Math.floor( this.scope.player.position.x * 100 ) / 100,
		'y : ' + Math.floor( this.scope.player.position.y * 100 ) / 100,
		'z : ' + Math.floor( this.scope.player.position.z * 100 ) / 100
	].join( ', ' ) );
	
	this.loadEnviron( this.scope.player.position );
    this.scope.voxelEngine.polygonize( );

};

State.Game.prototype.update = function ( delta ) {

    if ( ! this.ready ) return ;

	if ( GAME.mouse.pointerMode( ) === this.scope.top.renderer.domElement ) {
		this.updateCamera( delta );
		this.updatePlayer( delta );
	}

};

State.Game.prototype.collide = function ( component, velocity, callback ) {

    var check = function ( dAxis, uAxis, vAxis ) {

        if ( ! velocity[ dAxis ] ) {
            return 1; }

        var direction = velocity[ dAxis ] ? velocity[ dAxis ] > 0 ? 1 : - 1 : 0;

        var from = new THREE.Vector3( );
        from[ uAxis ] = Math.floor( component.position[ uAxis ] - component.size[ uAxis ] / 2 );
        from[ vAxis ] = Math.floor( component.position[ vAxis ] - component.size[ vAxis ] / 2 );
        from[ dAxis ] = Math.floor( component.position[ dAxis ] + component.size[ dAxis ] / 2 * direction + velocity[ dAxis ] );

        var size = new THREE.Vector3( );
        size[ uAxis ] = Math.ceil( component.position[ uAxis ] + component.size[ uAxis ] / 2 ) - from[ uAxis ];
        size[ vAxis ] = Math.ceil( component.position[ vAxis ] + component.size[ vAxis ] / 2 ) - from[ vAxis ];
        size[ dAxis ] = 1;

        for ( var x = from.x, X = from.x + size.x; x < X; ++ x ) {
            for ( var y = from.y, Y = from.y + size.y; y < Y; ++ y ) {
                for ( var z = from.z, Z = from.z + size.z; z < Z; ++ z ) {
					var value = this.scope.voxelEngine.getVoxel( [ x, y, z ] );
                    if ( value !== VOXEL.NOP && value !== undefined ) {
                        return 0;
                    }
                }
            }
        }

        return 1;

    }.bind( this );

    return new THREE.Vector3( check( 'x', 'y', 'z' ), check( 'y', 'x', 'z' ), check( 'z', 'x', 'y' ) );

};
