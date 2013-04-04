require( {

	baseUrl : 'application',

	paths : {

		'JQUERY'          : '../vendors/JQuery',
		'THREE'           : '../vendors/Three',
		'THREE.OBJLoader' : '../vendors/Three.OBJLoader',

		'SWAT'   : window.location.hostname === 'localhost'
			? '../vendors/swat/Swat.min'
			: '../vendors/Swat.min',
		
		'url'      : '../vendors/Require.url',
		'domReady' : '../vendors/Require.domReady'

	},

	shim : {

		'JQUERY'          : { exports : '$' },
		'THREE'           : { exports : 'THREE' },
		'THREE.OBJLoader' : { exports : 'THREE', deps : [ 'THREE' ] },
		'SWAT'            : { exports : 'SWAT', deps : [ 'THREE' ] }

	}

}, [ 'main' ] );
