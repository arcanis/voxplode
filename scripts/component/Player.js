var Component = Component || Object.create( null );

Component.Player = function ( color ) {

    this.object3D = new THREE.Mesh(
        new THREE.CubeGeometry( 5, 5, 5 ),
        new THREE.MeshBasicMaterial( {
            color : color } ) );

    this.acceleration = new THREE.Vector3( );
    this.velocity = new THREE.Vector3( );
    this.position = this.object3D.position;

    this.rotation = this.object3D.rotation;
    this.size = new THREE.Vector3( 5, 5, 5 );

};

Component.Player.prototype.getDirection2D = function ( ) {

    return new THREE.Vector3( Math.cos( this.rotation.y ), 0, Math.sin( this.rotation.y ) );

};

Component.Player.prototype.getForward2D = function ( distance ) {

    return this.position.clone( ).add( this.getDirection2D( ).multiplyScalar( distance ) ) ;

};

Component.Player.prototype.getBackward2D = function ( distance ) {

    return this.position.clone( ).add( this.getDirection2D( ).multiplyScalar( - distance ) ) ;

};
