var States = States || Object.create( null );

States.Game = function ( top ) {

    this.top = top;

};

States.Game.prototype.construct = function ( ) {

    this.finalized = false;

    hardLoader

        // Allow to use the data of the parent scope
        .push( 'direct', function ( data ) {
            data.top = this.top;
        }.bind( this ) )

        // Initializes THREE objects
        .push( 'direct', function ( data ) {
            data.top.camera = new THREE.PerspectiveCamera( 60, 1, .001, 10000 );
            data.top.camera.position.set( 30, 30, 30 );
            data.top.camera.updateMatrix( );
            data.top.camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );
            data.top.scene.add( data.top.camera );

            data.light = new THREE.PointLight( 0xffffff );
            data.light.position = data.top.camera.position;
            data.top.scene.add( data.light );
        } )

        // Three.js textures
        .push( 'texture', 'block:grass', 'images/grass.png' )
        .push( 'texture', 'block:dirt', 'images/dirt.png' )

        // Creates voxel manager
        .push( 'direct', function ( data ) {
            data.top.scene.add( ( data.voxelManager = new VOXEL.Manager.Three( [
                new THREE.MeshLambertMaterial( { map : data[ 'block:grass' ] } ),
                new THREE.MeshLambertMaterial( { map : data[ 'block:dirt' ] } )
            ] ) ).object3D );
        } )

        // Creates world
        .push( 'deferred', function ( data, callback ) {

            data.voxelEngine = new VOXEL.Engine( data.voxelManager );

            for ( var x = - 50; x <= 50; ++ x )
                for ( var z = - 50; z <= 50; ++ z )
                    data.voxelEngine.set( x, 0, z, 0 );

            data.voxelEngine.commit( function ( infos ) {
                callback( infos.progress.success / infos.progress.total );
            } );

        }, 100 )

    .start( function ( ) {

        this.finalized = true;

    }.bind( this ) );

};
