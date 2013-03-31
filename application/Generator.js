define( [
	
	'SWAT',

	'Region'
	
], function ( SWAT, Region ) {
	
	var Event = SWAT.Event;

	var Generator = function ( seed ) {

		Event.initialize( this );
		
		this._seed = seed;

	};

	Event.install( Generator.prototype, [ 'generation' ] );

	Generator.prototype.setPool = function ( pool ) {
		
		this._pool = pool;

		this._pool.addEventListener( 'complete', function ( e ) {

			if ( e.task.cmd !== 'generate' )
				return ;
			
			this.dispatchEvent( 'generation', {
				regionKey : e.task.regionKey,
				region : new Region( e.data.buffer )
			} );

		}.bind( this ) );
		
		this._pool.broadcast( {
			
			cmd : 'seed',

			seed : this._seed

		} );

		return this;

	};

	Generator.prototype.generate = function ( regionKey ) {

		this._pool.push( {
			
			cmd : 'generate',
			
			width : Region.WIDTH,
			height : Region.HEIGHT,
			depth : Region.DEPTH,
			
			regionKey : regionKey.slice( )
			
		}, { id : regionKey.toString( ) } );
		
		return this;

	};

	return Generator;

} );
