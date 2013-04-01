define( [

	'SWAT',

	'Region'

], function ( SWAT, Region ) {

	var Event = SWAT.Event;

	var World = function ( ) {
		
		Event.initialize( this );

		this._regions = Object.create( null );

	};

	World.getMainRegionKeyFromWorldVoxel = function ( worldVoxel ) { return [
		Math.floor( worldVoxel[ 0 ] / Region.WIDTH ),
		Math.floor( worldVoxel[ 1 ] / Region.HEIGHT ),
		Math.floor( worldVoxel[ 2 ] / Region.DEPTH )
	]; };

	World.getLocalVoxelFromWorldVoxel = function ( worldVoxel, regionKey ) { return [
		worldVoxel[ 0 ] - regionKey[ 0 ] * Region.WIDTH,
		worldVoxel[ 1 ] - regionKey[ 1 ] * Region.HEIGHT,
		worldVoxel[ 2 ] - regionKey[ 2 ] * Region.DEPTH
	]; };

	Event.install( World.prototype, [ 'new', 'update', 'set' ] );

	World.prototype.getRegion = function ( regionKey ) {

		return this._regions[ regionKey ];

	};

	World.prototype.setRegion = function ( regionKey, region ) {

        this._regions[ regionKey ] = region;

		var copyBorders = function ( target, source, cx, cy, cz ) {

            for ( var x = 0, X = cx ? 1 : Region.WIDTH; x < X; ++ x ) {
                for ( var y = 0, Y = cy ? 1 : Region.HEIGHT; y < Y; ++ y ) {
                    for ( var z = 0, Z = cz ? 1 : Region.DEPTH; z < Z; ++ z ) {

                        target.set( [

                            ! cx ? x : Region.WIDTH,
                            ! cy ? y : Region.HEIGHT,
                            ! cz ? z : Region.DEPTH

                        ], source.get( [

                            cx ? 0 : x,
                            cy ? 0 : y,
                            cz ? 0 : z

                        ] ) );

                    }
                }
            }

		};

        var exportBorders = function ( cx, cy, cz ) {

			var targetRegionKey = [ regionKey[ 0 ] + cx, regionKey[ 1 ] + cy, regionKey[ 2 ] + cz ];
            var targetRegion = this._regions[ targetRegionKey ];

            if ( ! targetRegion )
				return ;

			copyBorders( targetRegion, region, cx, cy, cz );

			this.dispatchEvent( 'update', {
				regionKey : targetRegionKey,
				region : targetRegion
			} );

        }.bind( this );


        var importBorders = function ( cx, cy, cz ) {

			var sourceRegionKey = [ regionKey[ 0 ] + cx, regionKey[ 1 ] + cy, regionKey[ 2 ] + cz ];
            var sourceRegion = this._regions[ sourceRegionKey ];

            if ( ! sourceRegion )
				return ;

			copyBorders( region, sourceRegion, cx, cy, cz );

        }.bind( this );

        exportBorders( - 1, - 0, - 0 );
        exportBorders( - 1, - 1, - 0 );
        exportBorders( - 0, - 1, - 0 );
        exportBorders( - 0, - 0, - 1 );
        exportBorders( - 1, - 0, - 1 );
        exportBorders( - 1, - 1, - 1 );
        exportBorders( - 0, - 1, - 1 );

        importBorders( + 1, + 0, + 0 );
        importBorders( + 1, + 1, + 0 );
        importBorders( + 0, + 1, + 0 );
        importBorders( + 0, + 0, + 1 );
        importBorders( + 1, + 0, + 1 );
        importBorders( + 1, + 1, + 1 );
        importBorders( + 0, + 1, + 1 );

		this.dispatchEvent( 'new', {
			regionKey : regionKey,
			region : region
		} );

	};

	World.prototype.getVoxel = function ( worldVoxel ) {

		var regionKey = World.getMainRegionKeyFromWorldVoxel( worldVoxel );
		var regionVoxel = World.getLocalVoxelFromWorldVoxel( worldVoxel, regionKey );

		var region = this._regions[ regionKey ];

		return region ? region.get( regionVoxel ) : undefined;

	};

	World.prototype.setVoxel = function ( worldVoxel, value ) {

		var setLocalVoxel = function ( regionKey, localVoxel ) {

			var region = this._regions[ regionKey ];
			
			if ( ! region )
				return ;
			
			region.set( localVoxel, value );

			this.dispatchEvent( 'update', {
				regionKey : regionKey,
				region : region
			} );

		}.bind( this );

        var regionKey = World.getMainRegionKeyFromWorldVoxel( worldVoxel );
        var localVoxel = World.getLocalVoxelFromWorldVoxel( worldVoxel, regionKey );

		setLocalVoxel( regionKey, localVoxel );

        var checkNeighbor = function ( cx, cy, cz ) {

            if ( ( cx && localVoxel[ 0 ] !== 0 ) || ( cy && localVoxel[ 1 ] !== 0 ) || ( cz && localVoxel[ 2 ] !== 0 ) )
				return ;

			setLocalVoxel( [
				regionKey[ 0 ] + cx,
				regionKey[ 1 ] + cy,
				regionKey[ 2 ] + cz
			], [
				! cx ? localVoxel[ 0 ] : Region.WIDTH,
				! cy ? localVoxel[ 1 ] : Region.HEIGHT,
				! cz ? localVoxel[ 2 ] : Region.DEPTH
			] );
			
        };

        checkNeighbor( - 1, - 0, - 0 );
        checkNeighbor( - 0, - 1, - 0 );
        checkNeighbor( - 0, - 0, - 1 );
        checkNeighbor( - 1, - 1, - 0 );
        checkNeighbor( - 0, - 1, - 1 );
        checkNeighbor( - 1, - 0, - 1 );
        checkNeighbor( - 1, - 1, - 1 );

		this.dispatchEvent( 'set', {
			worldVoxel : worldVoxel,
			value : value
		} );

	};

	return World;

} );
