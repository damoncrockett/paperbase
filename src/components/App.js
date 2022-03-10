import React, { Component, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { BufferAttribute } from 'three';

function Scatter(props) {
  const itemSize = 3;
  const data = props.data;

  const ref = useRef();

  if (data !== null) {
    const vertices = new Float32Array(data.pos);
    const normals = new Float32Array(data.norm);

    // this can apparently be useEffect or useLayoutEffect, no difference
    useEffect(() => {
        if (ref.current) {
          const newVertices = new BufferAttribute( vertices, itemSize );
          ref.current.geometry.setAttribute("position", newVertices);
          ref.current.geometry.attributes.position.needsUpdate = true;
        }
      },
      [vertices]
    );

    return (
      <mesh ref={ref}>
        <bufferGeometry>
          <bufferAttribute
            attachObject={['attributes', 'position']}
            array={vertices}
            count={vertices.length / itemSize}
            itemSize={itemSize}
          />
          <bufferAttribute
            attachObject={['attributes', 'normal']}
            array={normals}
            count={normals.length / itemSize}
            itemSize={itemSize}
          />
        </bufferGeometry>
        <meshPhongMaterial color={'dodgerblue'} />
      </mesh>
    )
  } else {
    return null
  }
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: null,
      model: 'pn'
    }

    this.returnDomain = this.returnDomain.bind(this);
    this.getData = this.getData.bind(this);
    this.handleModel = this.handleModel.bind(this);

  }

  componentDidMount() {
    this.getData();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.model!==this.state.model && this.state.data !== null) {
      this.getData();
    }

  }

  returnDomain() {
    const production = process.env.NODE_ENV === 'production';
    return production ? '' : 'http://localhost:8888/'
  }

  getData() {
    fetch(this.returnDomain()+this.state.model+'.json')
      .then(response => response.json())
      .then(data => this.setState(state => ({
        data: data[0]
      })));
    }

  handleModel(e) {
    const model = e.target.value
    this.setState(state => ({
      model: model
    }));
    }

  render() {
    return (
      <div className='app'>
        <div id='componentEnclosure'>
          <Canvas dpr={[1, 2]} camera={{ position: [1, 1, 4000], far: 100000 }}>
            <color attach="background" args={[0xfff8dc]} />
            <ambientLight />
            <pointLight position={[1, 1, 2000]} />
            <Scatter
              data={this.state.data}
            />
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          </Canvas>
        </div>
        <div className='buttonStrip'>
          <div className='radSwitch' onChange={this.handleModel}>
            <input type="radio" value={'pn'} name="Model" defaultChecked /> PCA
            <input type="radio" value={'tn'} name="Model" /> t-SNE
            <input type="radio" value={'un'} name="Model" /> UMAP
          </div>
        </div>
      </div>
    )
  }
}

export default App;
