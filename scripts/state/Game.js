var State = State || Object.create( null );

State.Game = function ( top ) {

    this.top = top;
    this.scope = null;

};

State.Game.prototype.construct = function ( ) {

    var top = this.top;
    delete this.top;

    hardLoader

        // Allow to use the data of the parent scope
        .push( 'direct', function ( data ) {
            data.top = top;
        }.bind( this ) )

        // Initializes THREE objects
        .push( 'direct', function ( data ) {
            data.player = new Component.Player( 0xff0000 );
            data.player.position.set( 0, 50, 0 );
            data.player.acceleration.y = -9.81 * 8;
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

        // Creates voxel manager
        .push( 'direct', function ( data ) {
            data.top.scene.add( ( data.voxelManager = new VOXEL.Manager.Three( [
                new THREE.MeshLambertMaterial( { map : data[ 'block:grass' ] } ),
                new THREE.MeshLambertMaterial( { color : 0x92b5d1, opacity : 0.4, transparent : true } )
            ] ) ).object3D );
        } )

        // Creates world
        .push( 'deferred', function ( data, callback ) {

            data.voxelEngine = new VOXEL.Engine( data.voxelManager );

            new PERLIN.Generator( ).generate( [ - 100, - 100 ], [ 201, 201 ], function ( coords, value ) {
                var Y = Math.floor( value * 30 );
                for ( var y1 = 0; y1 < Y; ++ y1 )
                    data.voxelEngine.set( coords[ 0 ], y1, coords[ 1 ], ( 0 << 24 ) | 0 );
                for ( var y2 = Y; y2 < 19; ++ y2 )
                    data.voxelEngine.set( coords[ 0 ], y2, coords[ 1 ], ( 1 << 24 ) | 1 );
            } );

            data.voxelEngine.commit( function ( infos ) {
                callback( infos.progress.success / infos.progress.total );
            } );

        }, 100 )

    .start( function ( data ) {

        this.scope = data;

    }.bind( this ) );

};

State.Game.prototype.update = function ( delta ) {

    if ( ! this.scope ) return ;

    if ( this.pending ) return ;
    this.pending = true;

    this.scope.player.velocity.add( this.scope.player.acceleration.clone( ).multiplyScalar( delta ) );

    var zKeysVelocity = 0;
    if ( GAME.keyboard.pressed( GAME.Key.Up ) )   zKeysVelocity += 10;
    if ( GAME.keyboard.pressed( GAME.Key.Down ) ) zKeysVelocity -= 10;

    var xKeysVelocity = 0;
    if ( GAME.keyboard.pressed( GAME.Key.Left ) )  xKeysVelocity += 10;
    if ( GAME.keyboard.pressed( GAME.Key.Right ) ) xKeysVelocity -= 10;

    if ( GAME.keyboard.pressed( GAME.Key.Space, true ) )
        this.scope.player.velocity.y += 4 * 8;

    this.scope.player.velocity.x += xKeysVelocity;
    this.scope.player.velocity.z += zKeysVelocity;
    var frameVelocity = this.scope.player.velocity.clone( ).multiplyScalar( delta );
    this.scope.player.velocity.z -= zKeysVelocity;
    this.scope.player.velocity.x -= xKeysVelocity;

    this.collide( this.scope.player, frameVelocity, function ( xCollision, yCollision, zCollision ) {

        if ( xCollision ) this.scope.player.velocity.x = frameVelocity.x = 0;
        if ( yCollision ) this.scope.player.velocity.y = frameVelocity.y = 0;
        if ( zCollision ) this.scope.player.velocity.z = frameVelocity.z = 0;
        this.scope.player.position.add( frameVelocity );

        this.pending = false;

    }.bind( this ) );

};

State.Game.prototype.collide = function ( component, velocity, callback ) {

    var check = function ( dAxis, uAxis, vAxis, callback ) {

        if ( ! velocity[ dAxis ] ) {
            callback( false );
            return ; }

        var direction = velocity[ dAxis ] ? velocity[ dAxis ] > 0 ? 1 : - 1 : 0;

        var from = new THREE.Vector3( );
        from[ uAxis ] = Math.floor( component.position[ uAxis ] - component.size[ uAxis ] / 2 );
        from[ vAxis ] = Math.floor( component.position[ vAxis ] - component.size[ vAxis ] / 2 );
        from[ dAxis ] = Math.floor( component.position[ dAxis ] + component.size[ dAxis ] / 2 * direction + velocity[ dAxis ] );

        var size = new THREE.Vector3( );
        size[ uAxis ] = Math.ceil( component.position[ uAxis ] + component.size[ uAxis ] / 2 ) - from[ uAxis ];
        size[ vAxis ] = Math.ceil( component.position[ vAxis ] + component.size[ vAxis ] / 2 ) - from[ vAxis ];
        size[ dAxis ] = 1;

        this.scope.voxelEngine.test(
            [ from.x, from.y, from.z ],
            [ size.x, size.y, size.z ],
            callback );

    }.bind( this );

    var delayed = GAME.delayedCallback( callback );
    check( 'x', 'y', 'z', delayed.step( ) );
    check( 'y', 'x', 'z', delayed.step( ) );
    check( 'z', 'x', 'y', delayed.step( ) );
    delayed.release( );

};
