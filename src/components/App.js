import React, { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Object3D } from 'three';
import { coords } from './data';

const substrate = new Object3D();

function Boxes({ model }) {
  const meshRef = useRef();
  const data = coords[model];
  const n = data.length;

  useEffect(() => {
    const mesh = meshRef.current;

    data.forEach((item, i) => {
      substrate.position.set(item[0],item[1],item[2]);
      substrate.updateMatrix();
      mesh.setMatrixAt(i, substrate.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;

  }, [model]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, n]}>
      <boxBufferGeometry args={[0.5, 0.5, 0.1]} />
      <meshStandardMaterial />
    </instancedMesh>
  )
}

function returnDomain() {
  const production = process.env.NODE_ENV === 'production';
  return production ? '' : 'http://localhost:8888/'
}

export default function App() {
  const [model, setModel] = useState('gr');

  return (
    <div id='app'>
      <div id='viewpane'>
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 200], far: 20000 }}>
          <color attach="background" args={[0x87ceeb]} />
          <ambientLight />
          <pointLight position={[0, 0, 100]} />
          <Boxes
            model={model}
          />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        </Canvas>
      </div>
      <div id='userControls'>
        <div className='radSwitch' onChange={e => setModel(e.target.value)}>
          <input type="radio" value={'tn'} name="Model" /> t-SNE
          <input type="radio" value={'un'} name="Model" /> UMAP
          <input type="radio" value={'gr'} name="Model" defaultChecked /> GRID
        </div>
      </div>
    </div>
  )
}
