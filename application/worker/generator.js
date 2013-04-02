self.importScripts( 'vendor/Noise.js' );

( function ( ) {
	
	var T0 = 0 << 24;
	var T1 = 1 << 24;

	var AIR = 0xffffffff;
	var GRASS = T0 | 0;
	var WATER = T1 | 1;
	
	var F = 1.2e-2;

	self.addEventListener( 'message', function ( e ) {
		
		switch ( e.data.cmd ) {

		case 'seed':

			noise.seed( e.data.seed );

			break;

    	case 'generate':

			var ox = e.data.regionKey[ 0 ], oy = e.data.regionKey[ 1 ], oz = e.data.regionKey[ 2 ];
			var width = e.data.width, height = e.data.height, depth = e.data.depth;

			var data = new Uint32Array( ( width + 1 ) * ( height + 1 ) * ( depth + 1 ) );

		    for ( var t = 0, T = data.byteLength / 4; t < T; ++ t )
				data[ t ] = AIR;

			for ( var x = 0; x < width; ++ x ) {
				for ( var z = 0; z < depth; ++ z ) {
					var simplex = noise.simplex2( ( ox * width + x ) * F, ( oz * depth + z ) * F );
					var size = Math.floor( Math.abs( simplex ) * 10 + 4 );
					for ( var y = 0; y < size; ++ y )
						data[ z * ( width + 1 ) * ( height + 1 ) + y * ( width + 1 ) + x ] = GRASS;
					for ( var y = size; y < height * 5e-2; ++ y )
						data[ z * ( width + 1 ) * ( height + 1 ) + y * ( width + 1 ) + x ] = WATER; } }

			if ( 0 ) // 3D generation
			for ( var x = 0; x < width; ++ x ) {
				for ( var y = 0; y < height; ++ y ) {
					for ( var z = 0; z < depth; ++ z ) {
						var simplex = ( Math.abs( noise.simplex3( ( ox * width + x ) * F, ( oy * height + y ) * F, ( oz * depth + z ) * F ) ) + y / height ) / 2;
						data[ z * ( width + 1 ) * ( height + 1 ) + y * ( width + 1 ) + x ] = simplex < .2 ? GRASS : AIR;
					}
				}
			}
			
			self.postMessage( {
				buffer : data.buffer
			} );

			break;

		}
		
	} );

} )( );
