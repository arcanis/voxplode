var Application = new GAME.StateMachine( );

hardLoader

    // Wait for DOM ready
    .push( 'ready' )

    // Standard Three.js objects
    .push( 'direct', function ( data ) {
        data.renderer = new THREE.WebGLRenderer( { canvas : $( '#screen' )[ 0 ], antialias : true } );
        data.scene = new THREE.Scene( );
    } )

    // Event handler waiting for screen resize
    .push( 'direct', function ( data ) {
        $( window ).resize( function ( ) {
            data.screenWidth = window.innerWidth;
            data.screenHeight = window.innerHeight;
            data.renderer.setSize( data.screenWidth, data.screenHeight );
        } ).resize( );
    } )

    // Main rendering loop
    .push( 'direct', function ( data ) {
        data.repaint = new GAME.Loop( GAME.Loop.repaint( ),
            function ( ) {
                if ( ! data.camera ) return ;
                data.camera.aspect = data.screenWidth / data.screenHeight;
                data.camera.updateProjectionMatrix( );
                data.renderer.render( data.scene, data.camera );
            }
        );
    } )

    // Main update loop
    .push( 'direct', function ( data ) {
        data.update = new GAME.Loop( GAME.Loop.fps( 60 ),
            function ( delta ) {
                if ( ! Application.state ) return ;
                Application.update( delta );
            }
        );
    } )

.start( function ( data ) {

    Application.setState( new State.Game( data ) );

} );
