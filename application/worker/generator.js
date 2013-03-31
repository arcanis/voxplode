self.importScripts( 'vendor/Noise.js' );

( function ( ) {

	self.addEventListener( 'message', function ( e ) {
		
		switch ( e.data.cmd ) {

		case 'seed':

			noise.seed( e.data.seed );

			break;

    	case 'generate':

			var data = new Uint32Array( ( e.data.width + 1 ) * ( e.data.height + 1 ) * ( e.data.depth + 1 ) );

		    for ( var t = 0, T = data.byteLength / 4; t < T; ++ t )
				data[ t ] = 0xffffffff;

			for ( var x = 0; x < e.data.width; ++ x ) {
				for ( var z = 0; z < e.data.depth; ++ z ) {
					var height = noise.simplex2( e.data.regionKey[ 0 ] * e.data.width + x, e.data.regionKey[ 2 ] * e.data.depth + z ) + 1 / 2 * 10;
					for ( var y = 0; y < Math.min( Math.max( 0, height - e.data.regionKey[ 1 ] * e.data.height ), e.data.height ); ++ y ) {
						data[ z * ( e.data.width + 1 ) * ( e.data.height + 1 ) + y * ( e.data.width + 1 ) + x ] = 0; } } }

		    self.postMessage( {
				buffer : data.buffer
			} );

			break;

		}
		
	} );

} )( );
