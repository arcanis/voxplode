require( {

	baseUrl : 'application',

	paths : {

		'JQUERY' : '../vendor/JQuery',
		'THREE'  : '../vendor/Three',
		'SWAT'   : '../swat/Swat.min',

		'url'      : '../vendor/Require.url',
		'domReady' : '../vendor/Require.domReady'

	},

	shim : {

		'JQUERY' : { exports : '$' },
		'THREE'  : { exports : 'THREE' },
		'SWAT'   : { exports : 'SWAT', deps : [ 'THREE' ] }

	}

}, [ 'main' ] );
