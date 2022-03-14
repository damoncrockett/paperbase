import React, { useState, useLayoutEffect, useEffect, useRef } from "react";
import { Canvas } from '@react-three/fiber';
import { Instances, Instance, OrbitControls } from '@react-three/drei';

function Boxes(props) {
  return (
    <Instances>
      <boxGeometry args={[1, 1, 0.2]} />
      <meshStandardMaterial />
      {props.data[props.model].map((data, i) => (
        <Instance key={i} position={data} />
      ))}
    </Instances>
  )
}

function returnDomain() {
  const production = process.env.NODE_ENV === 'production';
  return production ? '' : 'http://localhost:8888/'
}

export default function App() {
  const [model, setModel] = useState('tn');
  const [data, setData] = useState(null);

  useLayoutEffect(() => {
    fetch(returnDomain()+'data.json')
      .then(response => response.json())
      .then(data => setData(data))
  }, [])

  return (
    <div id='app'>
      <div id='viewpane'>
        <Canvas dpr={[1, 2]} camera={{ position: [1, 1, 100], far: 1000 }}>
          <color attach="background" args={[0x87ceeb]} />
          <ambientLight />
          <pointLight position={[1, 1, 100]} />
          <Boxes
            model={model}
            data={data}
          />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        </Canvas>
      </div>
      <div id='userControls'>
        <div className='radSwitch' onChange={e => setModel(e.target.value)}>
          <input type="radio" value={'tn'} name="Model" defaultChecked /> t-SNE
          <input type="radio" value={'un'} name="Model" /> UMAP
        </div>
      </div>
    </div>
  )
}
