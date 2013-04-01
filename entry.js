require( {

	baseUrl : 'application',

	paths : {

		'JQUERY' : '../vendor/JQuery',
		'THREE'  : '../vendor/Three',
		'SWAT'   : window.location.hostname === 'localhost' ? '../swat/Swat.min' : '../vendor/Swat.min',

		'url'      : '../vendor/Require.url',
		'domReady' : '../vendor/Require.domReady'

	},

	shim : {

		'JQUERY' : { exports : '$' },
		'THREE'  : { exports : 'THREE' },
		'SWAT'   : { exports : 'SWAT', deps : [ 'THREE' ] }

	}

}, [ 'main' ] );
