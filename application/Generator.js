define( [
    
    'SWAT',

    'Region'
    
], function ( SWAT, Region ) {
    
    var Event = SWAT.Event;

    var Generator = function ( seed ) {

        Event.initialize( this );
        
        this._pending = Object.create( null );
        
        this._seed = seed;

    };

    Event.install( Generator.prototype, [ 'generation' ] );

    Generator.prototype.setPool = function ( pool ) {
        
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

            this._pool.broadcast( {
                
                cmd : 'seed',
                
                seed : this._seed
                
            } );
        }
        
        return this;

    };
    
    Generator.prototype._poolPush = function ( e ) {
        
        if ( e.task.cmd !== 'generate' )
            return ;

        this._pending[ e.task.regionKey ] = true;

    };

    Generator.prototype._poolShift = function ( e ) {

        if ( e.task.cmd !== 'generate' )
            return ;

        console.time( "Generating " + e.task.regionKey );

    };

    Generator.prototype._poolComplete = function ( e ) {

        if ( e.task.cmd !== 'generate' )
            return ;

        console.timeEnd( "Generating " + e.task.regionKey );

        delete this._pending[ e.task.regionKey ];

        this.dispatchEvent( 'generation', {
            regionKey : e.task.regionKey,
            region : new Region( e.data.buffer )
        } );

    };

    Generator.prototype.generate = function ( regionKey ) {

        if ( this._pending[ regionKey ] )
            return this;

        this._pool.push( {
            
            cmd : 'generate',
            
            width : Region.WIDTH,
            height : Region.HEIGHT,
            depth : Region.DEPTH,
            
            regionKey : regionKey.slice( )
            
        } );
        
        return this;

    };

    return Generator;

} );
