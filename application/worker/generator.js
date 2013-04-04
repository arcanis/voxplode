self.importScripts( 'vendors/Noise.js' );

( function ( ) {
	
	var T0 = 0 << 24;
	var T1 = 1 << 24;

	var AIR   = 0xffffffff;
	var DIRT  = T0 | 0;
	var GRASS = T0 | 1;
	var WATER = T1 | 2;
	
	var getNoise = function ( xF, yF, zF, x, y, z ) {
		return ( Math.abs( noise.simplex3( x * xF, y * yF, z * zF ) ) + 0.5 ) * 2 - 1; };
	
	var getRoughness = getNoise.bind( null, 8e-3, 6e-3, 8e-3 );
	var getDetail    = getNoise.bind( null, 4e-3, 4e-3, 4e-3 );
	var getElevation = getNoise.bind( null, 1e-2, 1e-2, 1e-2 );

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
				for ( var y = 0; y < height; ++ y ) {
					for ( var z = 0; z < depth; ++ z ) {

						var roughness = getRoughness ( ox * width + x, oy * height + y, oz * depth + z );
						var detail    = getDetail    ( ox * width + x, oy * height + y, oz * depth + z );
						var elevation = getElevation ( ox * width + x, oy * height + y, oz * depth + z );

						var combined = 1 - y / height + Math.abs( roughness * detail + elevation ) / 2;
						var combined = 1 - y / height + roughness * elevation - detail;
						
						var block = AIR;

						if ( y === 0 ) {
							block = DIRT;
						} else if ( combined > .32 ) {
							block = DIRT;
						} else if ( combined > .30 && y < 50 ) {
							block = DIRT;
						} else if ( combined > .30 ) {
							block = GRASS;
						} else if ( y < 50 ) {
							block = WATER;
						}

						data[ z * ( width + 1 ) * ( height + 1 ) + y * ( width + 1 ) + x ] = block;
						
					}
				}
			}
			
			self.postMessage( {
				buffer : data.buffer
			}, [ data.buffer ] );

			break;

		}
		
	} );

} )( );
