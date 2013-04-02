define( [

	'SWAT',
	'THREE',

	'Region'

], function ( SWAT, THREE, Region ) {

	var Event          = SWAT.Event;

	var BufferGeometry = THREE.BufferGeometry;

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
			geometries : this._buildGeometries( e.data )
		} );

	};
	
	Polygonizer.prototype._buildGeometries = function ( geometriesBuffers ) {

		return Object.keys( geometriesBuffers ).reduce( function ( geometries, materialIndex ) {

			var geometry = geometries[ materialIndex ] = new BufferGeometry( );
			var geometryBuffers = geometriesBuffers[ materialIndex ];
			
			geometry.attributes = {
				
				index : {
					itemSize : 1,
					array : new Uint16Array( geometryBuffers.indices ),
					numItems : geometryBuffers.triangleCount * 3
				},
				
				position : {
					itemSize : 3,
					array : new Float32Array( geometryBuffers.positions ),
					numItems : geometryBuffers.triangleCount * 3 * 3
				},
				
				normal : {
					itemSize : 3,
					array : new Float32Array( geometryBuffers.normals ),
					numItems : geometryBuffers.triangleCount * 3 * 3
				}
				
			};
			
			geometry.offsets = [ {
				start : 0,
				count : geometryBuffers.triangleCount * 3,
				index : 0
			} ];
			
			return geometries;
			
		}, { } );

	};
	
	return Polygonizer;
	
} );
