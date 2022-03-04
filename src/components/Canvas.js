import React, { Component } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class Canvas extends Component {
  constructor(props) {
    super(props);

    this.state = {}

    this.returnDomain = this.returnDomain.bind(this);
    this.drawCanvas = this.drawCanvas.bind(this);

  }

  componentDidUpdate(prevProps, prevState) {
    // conditional prevents infinite loop
    if (prevProps.data !== this.props.data && prevProps.data === null) {
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
    scene.background = new THREE.Color( 0xfff8dc );

    // Specify the portion of the scene visible at any time (in degrees)
    var fieldOfView = 90;

    // Specify the camera's aspect ratio
    var aspectRatio = window.innerWidth / window.innerHeight;

    // Specify the near and far clipping planes. Only objects
    // between those planes will be rendered in the scene
    // (these values help control the number of items rendered
    // at any given time)
    var nearPlane = 0.1;
    var farPlane = 100000;

    // Use the values specified above to create a camera
    var camera = new THREE.PerspectiveCamera(
      fieldOfView, aspectRatio, nearPlane, farPlane
    );

    // Finally, set the camera's position in the z-dimension
    camera.position.z = 1200;

    // Create the canvas with a renderer and tell the
    // renderer to clean up jagged aliased lines
    var renderer = new THREE.WebGLRenderer({antialias: true});

    // Add support for retina displays
    renderer.setPixelRatio(window.devicePixelRatio);

    // Specify the size of the canvas
    renderer.setSize( window.innerWidth, window.innerHeight );

    // Add the canvas to the DOM
    document.getElementById("canvas").appendChild(renderer.domElement);

    // Add a point light with #fff color, .7 intensity, and 0 distance
    var light = new THREE.PointLight(0xffffff, 1.0, 0);

    // Specify the light's position in the x, y, and z dimensions
    light.position.set(1, 1, 1200);

    // Add the light to the scene
    // This, btw, is necessary if you're using textures, it seems
    scene.add(light)

    // Create a texture loader so we can load the image file
    var loader = new THREE.TextureLoader();

    const data = this.props.data;

    for (var i=0; i<3; i++) {
      // Load an image file into a MeshLambert material
      let material = new THREE.MeshLambertMaterial({
        map: loader.load(this.returnDomain()+'img/'+ i +'.jpg')
      });

      let vertices = data[i];

      let geometry = new THREE.BufferGeometry();
      let positionNumComponents = 3;
      let normalNumComponents = 3;
      let uvNumComponents = 2;
      geometry.setAttribute(
          'position',
          new THREE.BufferAttribute(new Float32Array(vertices.pos), positionNumComponents));

      geometry.setAttribute(
          'normal',
          new THREE.BufferAttribute(new Float32Array(vertices.norm), normalNumComponents));

      geometry.setAttribute(
          'uv',
          new THREE.BufferAttribute(new Float32Array(vertices.uv), uvNumComponents));

      // combine the image geometry and material into a mesh
      var mesh = new THREE.Mesh(geometry, material);

      // set the position of the image mesh in the x,y,z dimensions
      mesh.position.set(0,0,0);

      // add the image to the scene
      scene.add(mesh);

    }

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.maxDistance = 10000;

    // necessary for meshes it seems
    function animate() {
      controls.update();
      requestAnimationFrame( animate );
        renderer.render( scene, camera );
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
