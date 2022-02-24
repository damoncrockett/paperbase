import React, { Component } from 'react';
import * as THREE from 'three';

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
    document.getElementById("canvas").appendChild(renderer.domElement);

    // Add a point light with #fff color, .7 intensity, and 0 distance
    var light = new THREE.PointLight(0xffffff, .7, 0);

    // Specify the light's position in the x, y, and z dimensions
    light.position.set(1, 1, 100);

    // Add the light to the scene
    // This, btw, is necessary if you're using textures, it seems
    scene.add(light)

    // Create a texture loader so we can load the image file
    var loader = new THREE.TextureLoader();

    // Specify the path to an image
    var url = 'https://s3.amazonaws.com/duhaime/blog/tsne-webgl/assets/cat.jpg';

    // Load an image file into a MeshLambert material
    var material = new THREE.MeshLambertMaterial({
      map: loader.load(url)
    });

    // identify the image width and height
    var imageSize = {width: 4, height: 4};

    // identify the x, y, z coords where the image should be placed
    // inside the scene
    var coords = {x: -2, y: -2, z: 0};

    const vertices = [
      {
        pos:[coords.x, coords.y, coords.z],
        norm:[0,0,1],
        uv:[0,0]
      },
      {
        pos:[coords.x+imageSize.width, coords.y, coords.z],
        norm:[0,0,1],
        uv:[1,0]
      },
      {
        pos:[coords.x+imageSize.width, coords.y+imageSize.height, coords.z],
        norm:[0,0,1],
        uv:[1,1]
      },
      {
        pos:[coords.x+imageSize.width, coords.y+imageSize.height, coords.z],
        norm:[0,0,1],
        uv:[1,1]
      },
      {
        pos:[coords.x, coords.y+imageSize.height, coords.z],
        norm:[0,0,1],
        uv:[0,1]
      },
      {
        pos:[coords.x, coords.y, coords.z],
        norm:[0,0,1],
        uv:[0,0]
      },

    ];

    let positions = [];
    const normals = [];
    const uvs = [];

    vertices.forEach((item, i) => {
      positions.push(...item.pos);
      normals.push(...item.norm);
      uvs.push(...item.uv);
    });

    const geometry = new THREE.BufferGeometry();
    const positionNumComponents = 3;
    const normalNumComponents = 3;
    const uvNumComponents = 2;
    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));

    geometry.setAttribute(
        'normal',
        new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));

    geometry.setAttribute(
        'uv',
        new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));

    // combine the image geometry and material into a mesh
    var mesh = new THREE.Mesh(geometry, material);

    // set the position of the image mesh in the x,y,z dimensions
    mesh.position.set(0,0,-10);

    // add the image to the scene
    scene.add(mesh);

    // necessary for meshes it seems
    function animate() {
      requestAnimationFrame( animate );
        renderer.render( scene, camera );

        mesh.rotation.z += 0.01

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
