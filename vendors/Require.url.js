define( [ 'module' ], function ( ) {

	return {

		load : function ( name, req, onLoad, config ) {
			onLoad( req.toUrl( name + '.js' ) );
		}

	};

} );
