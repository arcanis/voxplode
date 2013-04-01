define( [

	'SWAT',
	'THREE',

	'Region'

], function ( SWAT, THREE, Region ) {

	var Event    = SWAT.Event;

	var Face3    = THREE.Face3;
	var Geometry = THREE.Geometry;
	var Vector2  = THREE.Vector2;
	var Vector3  = THREE.Vector3;

	var Polygonizer = function ( ) {

		Event.initialize( this );

		this._tasks = Object.create( null );

		this._version = 0;
		
	};

	Event.install( Polygonizer.prototype, [ 'polygonization' ] );
	
	Polygonizer.prototype.setPool = function ( pool ) {
		
		if ( this._pool ) {
			this._pool.removeEventListener( 'push', this._poolPush, this );
			this._pool.removeEventListener( 'shift', this._poolShift, this );
			this._pool.removeEventListener( 'complete', this._poolComplete, this );
		}

		this._pool = pool;
		
		if ( this._pool ) {
			this._pool.addEventListener( 'push', this._poolPush, this );
			this._pool.addEventListener( 'shift', this._poolShift, this );
			this._pool.addEventListener( 'complete', this._poolComplete, this );
		}
		
		return this;
		
	};
	
	Polygonizer.prototype.polygonize = function ( regionKey, region ) {
		
		if ( this._tasks[ regionKey ] && this._tasks[ regionKey ].pending > 0 )
			return this;
		
		this._pool.push( {

			cmd : 'polygonize',
			version : ++ this._version,
			
			width : Region.WIDTH,
			height : Region.HEIGHT,
			depth : Region.DEPTH,
			
			regionKey : regionKey.slice( ),
			buffer : region.data.buffer
			
		} );

		return this;
		
	};

	Polygonizer.prototype._poolPush = function ( e ) {

		if ( e.task.cmd !== 'polygonize' )
			return ;
		
		if ( ! this._tasks[ e.task.regionKey ] )
			this._tasks[ e.task.regionKey ] = { pending : 0, processing : 0, version : null };
		
		this._tasks[ e.task.regionKey ].pending += 1;

	};

	Polygonizer.prototype._poolShift = function ( e ) {

		if ( e.task.cmd !== 'polygonize' )
			return ;
		
		this._tasks[ e.task.regionKey ].pending -= 1;
		this._tasks[ e.task.regionKey ].processing += 1;

	};

	Polygonizer.prototype._poolComplete = function ( e ) {

		if ( e.task.cmd !== 'polygonize' )
			return ;

		this._tasks[ e.task.regionKey ].processing -= 1;
		var version = this._tasks[ e.task.regionKey ].version;

		if ( ! this._tasks[ e.task.regionKey ].pending && ! this._tasks[ e.task.regionKey ].processing )
			delete this._tasks[ e.task.regionKey ];

		if ( version !== null && version > e.task.version )
			return ;

		if ( this._tasks[ e.task.regionKey ] )
			this._tasks[ e.task.regionKey ].version = e.task.version;

		this.dispatchEvent( 'polygonization', {
			regionKey : e.task.regionKey,
			geometry : this._buildGeometry( e.data.polygons )
		} );

	};

	Polygonizer.prototype._buildGeometry = function ( polygons ) {

		if ( ! polygons.length )
			return null;
		
		var vertexIndexCache = Object.create( null );
		
		var geometry = new Geometry( );

		var vertexes = geometry.vertices;
		var faces = geometry.faces;
		
        for ( var t = 0, T = polygons.length; t < T; ++ t ) {
			
            var polygon = polygons[ t ];

            var polygonVertexes = polygon[ 0 ];
            var polygonNormal = polygon[ 1 ];

            var vertex_0 = polygonVertexes[ 0 ];
            var vertex_1 = polygonVertexes[ 1 ];
            var vertex_2 = polygonVertexes[ 2 ];

            var vertexIdentifier_0 = vertex_0[ 0 ] + '/' + vertex_0[ 1 ] + '/' + vertex_0[ 2 ];
            var vertexIdentifier_1 = vertex_1[ 0 ] + '/' + vertex_1[ 1 ] + '/' + vertex_1[ 2 ];
            var vertexIdentifier_2 = vertex_2[ 0 ] + '/' + vertex_2[ 1 ] + '/' + vertex_2[ 2 ];

            var vertexIndex_0 = typeof vertexIndexCache[ vertexIdentifier_0 ] !== 'undefined' ? vertexIndexCache[ vertexIdentifier_0 ] : vertexIndexCache[ vertexIdentifier_0 ] = vertexes.push( new Vector3( vertex_0[ 0 ], vertex_0[ 1 ], vertex_0[ 2 ] ) ) - 1;
            var vertexIndex_1 = typeof vertexIndexCache[ vertexIdentifier_1 ] !== 'undefined' ? vertexIndexCache[ vertexIdentifier_1 ] : vertexIndexCache[ vertexIdentifier_1 ] = vertexes.push( new Vector3( vertex_1[ 0 ], vertex_1[ 1 ], vertex_1[ 2 ] ) ) - 1;
            var vertexIndex_2 = typeof vertexIndexCache[ vertexIdentifier_2 ] !== 'undefined' ? vertexIndexCache[ vertexIdentifier_2 ] : vertexIndexCache[ vertexIdentifier_2 ] = vertexes.push( new Vector3( vertex_2[ 0 ], vertex_2[ 1 ], vertex_2[ 2 ] ) ) - 1;

            var face = new Face3( vertexIndex_2, vertexIndex_1, vertexIndex_0 );

            face.normal.set( polygonNormal[ 0 ], polygonNormal[ 1 ], polygonNormal[ 2 ] );
            face.vertexNormals.push( face.normal.clone( ), face.normal.clone( ), face.normal.clone( ) );

            face.materialIndex = polygonVertexes.sort( function ( a, b ) {
                return a[ 1 ] > b[ 1 ];
            } )[ 0 ][ 3 ] & 0x00FFFFFF;

            geometry.faces.push( face );
            geometry.faceVertexUvs[ 0 ].push( [
                new Vector2( 0, 0 ),
                new Vector2( 0, 1 ),
                new Vector2( 1, 0 )
            ] );

        }

		return geometry;

	};
	
	return Polygonizer;
	
} );
