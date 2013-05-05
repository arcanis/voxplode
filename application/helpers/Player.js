define( [

    'THREE'

], function ( THREE ) {

    var CubeGeometry      = THREE.CubeGeometry;
    var MeshBasicMaterial = THREE.MeshBasicMaterial;
    var Mesh              = THREE.Mesh;

    var geometry = new CubeGeometry( 1, 1, 1 );
    geometry.computeBoundingBox( );
    
    var material = new MeshBasicMaterial( { color : 0x0000ff, wireframe : true } );

    var Player = function ( ) {

        Mesh.call( this, geometry, material );

    };
    
    Player.prototype = Object.create( Mesh.prototype );

    return Player;

} );
