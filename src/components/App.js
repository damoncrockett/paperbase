import React, { Component, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { BufferAttribute } from 'three';

function Scatter(props) {
  const itemSize = 3;
  const data = props.data;

  const ref = useRef();

  const vertices = new Float32Array(data.pos);
  const normals = new Float32Array(data.norm);

  // this can apparently be useEffect or useLayoutEffect, no difference
  useEffect(() => {
      if (ref.current) {
        const newVertices = new BufferAttribute( vertices, itemSize );
        ref.current.geometry.setAttribute("position", newVertices);
        ref.current.geometry.attributes.position.needsUpdate = true;
      }
    }, [vertices]);

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
}

function returnDomain() {
  const production = process.env.NODE_ENV === 'production';
  return production ? '' : 'http://localhost:8888/'
}

export default function App() {
  const [model, setModel] = useState('tn');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(returnDomain()+model+'.json')
      .then(response => response.json())
      .then(data => setData(data[0]))
  }, [model])

  if (data !== null) {
    return (
      <div className='app'>
        <div id='componentEnclosure'>
          <Canvas dpr={[1, 2]} camera={{ position: [1, 1, 4000], far: 100000 }}>
            <color attach="background" args={[0xfff8dc]} />
            <ambientLight />
            <pointLight position={[1, 1, 2000]} />
            <Scatter
              data={data}
            />
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          </Canvas>
        </div>
        <div className='buttonStrip'>
          <div className='radSwitch' onChange={e => setModel(e.target.value)}>
            <input type="radio" value={'tn'} name="Model" defaultChecked /> t-SNE
            <input type="radio" value={'un'} name="Model" /> UMAP
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}
