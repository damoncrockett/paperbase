import React, { Component } from 'react';
import * as THREE from 'three';

class Canvas extends Component {
  constructor(props) {
    super(props);

    this.state = {
    }

    this.returnDomain = this.returnDomain.bind(this);
    this.drawCanvas = this.drawCanvas.bind(this);

  }

  componentDidUpdate(prevProps, prevState) {
    // conditional prevents infinite loop
    if (prevProps.data !== this.props.data && prevProps.data === null) {
      this.drawCanvas();
    }

    if (prevProps.data !== this.props.data && prevProps.data !== null) {
      this.drawCanvas();
    }
  }

  returnDomain() {
    const production = process.env.NODE_ENV === 'production';
    return production ? '' : 'http://localhost:8888/'
  }


  drawCanvas() {
    // Create the scene and a camera to view it
    var scene = new THREE.Scene();

    // Specify the portion of the scene visiable at any time (in degrees)
    var fieldOfView = 75;

    // Specify the camera's aspect ratio
    var aspectRatio = window.innerWidth / window.innerHeight;

    // Specify the near and far clipping planes. Only objects
    // between those planes will be rendered in the scene
    // (these values help control the number of items rendered
    // at any given time)
    var nearPlane = 0.1;
    var farPlane = 1000;

    // Use the values specified above to create a camera
    var camera = new THREE.PerspectiveCamera(
      fieldOfView, aspectRatio, nearPlane, farPlane
    );

    // Finally, set the camera's position in the z-dimension
    camera.position.z = 5;

    // Create the canvas with a renderer and tell the
    // renderer to clean up jagged aliased lines
    var renderer = new THREE.WebGLRenderer({antialias: true});

    // Specify the size of the canvas
    renderer.setSize( window.innerWidth, window.innerHeight );

    // Add the canvas to the DOM
    document.body.appendChild( renderer.domElement );

    // Create a cube with width, height, and depth set to 1
    var geometry = new THREE.BoxGeometry( 1, 1, 1 );

    // Use a simple material with a specified hex color
    var material = new THREE.MeshBasicMaterial({ color: 0x1e90ff });

    // Combine the geometry and material into a mesh
    var cube = new THREE.Mesh( geometry, material );

    // Add the mesh to the scene
    scene.add( cube );

    function animate() {
      requestAnimationFrame( animate );
      renderer.render( scene, camera );

      // Rotate the object a bit each animation frame
      cube.rotation.y += 0.01;
      cube.rotation.z += 0.01;
    }

    animate();

  }

  render() {
    return (
      <div id='appField'>
        <div id='canvas'>
        </div>
      </div>
    );
  }
}

export default Canvas;
