define( [

    'JQUERY',
    'SWAT',

    'state/Game',
    'Generator'

], function ( $, SWAT, Game, Generator ) {
    
    $( '#app' ).show( );

    var generator = new Generator( 0 );
    var state = new Game( generator );
    SWAT.ticker.add( state ).start( );

} );
