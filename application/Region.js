define( function ( ) {

	var Region = function ( buffer ) {

		if ( ! buffer )
			buffer = new ArrayBuffer( Region.getBufferSize( ) );

		if ( buffer.byteLength !== Region.getBufferSize( ) )
			throw new Error( 'Invalid buffer size :(' );

		this.data = new Uint32Array( buffer );

	};

	Region.WIDTH = 32;

	Region.HEIGHT = 128;

	Region.DEPTH = 32;

	Region.getBufferSize = function ( ) {

		return ( Region.WIDTH + 1 ) * ( Region.HEIGHT + 1 ) * ( Region.DEPTH + 1 ) * 4;

	};

	Region.getDataIndexFromLocalVoxel = function ( localVoxel ) {

		return 0

   			+ localVoxel[ 2 ] * ( Region.WIDTH + 1 ) * ( Region.HEIGHT + 1 )
			+ localVoxel[ 1 ] * ( Region.WIDTH + 1 )
			+ localVoxel[ 0 ]

		;

	};

	Region.prototype.get = function ( localVoxel ) {

		return this.data[ Region.getDataIndexFromLocalVoxel( localVoxel ) ];

	};

	Region.prototype.set = function ( localVoxel, value ) {

		this.data[ Region.getDataIndexFromLocalVoxel( localVoxel ) ] = value;

	};

	return Region;

} );
