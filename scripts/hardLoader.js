var hardLoader = new GAME.Loader( )

    .begin( function ( ) {
        $( document ).ready( function ( ) {
            $( document.body ).addClass( 'hard-loading' );
        } );
    } )

    .progress( function ( progress ) {
        $( document ).ready( function ( ) {
            $( '#hard-loading .cursor' ).css( 'width', ( progress * 100 ) + '%' );
        } );
    } )

    .complete( function ( ) {
        $( document ).ready( function ( ) {
            $( document.body ).removeClass( 'hard-loading' );
        } );
    } )

;
