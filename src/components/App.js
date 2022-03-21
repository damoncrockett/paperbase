import React, { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Object3D, Color, MOUSE } from 'three';
import { useSpring } from '@react-spring/three';
import { coords } from './data';

const animatedCoords = Array.from({ length: coords['gr'].length }, () => [0, 0, 0]);

// key code constants
const ALT_KEY = 18;
const CTRL_KEY = 17;
const CMD_KEY = 91;

function interpolatePositions(coords, model, progress) {
  animatedCoords.forEach((item, i) => {
    animatedCoords[i][0] = (1 - progress) * item[0] + progress * coords[model][i][0];
    animatedCoords[i][1] = (1 - progress) * item[1] + progress * coords[model][i][1];
    animatedCoords[i][2] = (1 - progress) * item[2] + progress * coords[model][i][2];
  });
}

function useSpringAnimation({ coords, model, onChange }) {
  useSpring({
    to: { animationProgress: 1 },
    from: { animationProgress: 0 },
    reset: true,
    onChange: (_, ctrl) => {
      interpolatePositions( coords, model, ctrl.get().animationProgress );
      onChange();
    },
  }, [model]);
}

const substrate = new Object3D();

function updatePositions({ mesh }) {
  if (!mesh) return;
  animatedCoords.forEach((item, i) => {
    substrate.position.set(item[0],item[1],item[2]);
    substrate.updateMatrix();
    mesh.setMatrixAt(i, substrate.matrix);
  });

  mesh.instanceMatrix.needsUpdate = true;
}

function Boxes({ model }) {
  const numItems = animatedCoords.length;
  const meshRef = useRef();

  useSpringAnimation({
    coords,
    model,
    onChange: () => { updatePositions({ mesh: meshRef.current }) }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, numItems]}
      onClick={e => console.log(e.instanceId)}
    >
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
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 135], far: 20000 }}>
          <color attach="background" args={[0x87ceeb]} />
          <ambientLight />
          <pointLight position={[0, 0, 135]} />
          <Boxes
            model={model}
          />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={false}
            keys={[
              ALT_KEY, // orbit
              CTRL_KEY, // zoom
              CMD_KEY, // pan
            ]}
            mouseButtons={{
              LEFT: MOUSE.PAN, // make pan the default instead of rotate
              MIDDLE: MOUSE.ZOOM,
              RIGHT: MOUSE.ROTATE,
            }}
          />
        </Canvas>
      </div>
      <div className='controls' id='modelControls'>
        <div className='controlsLabel'>Models</div>
        <button onClick={() => setModel('gr')} className={model === 'gr' ? 'active' : undefined}>GRID</button>
        <button onClick={() => setModel('tn')} className={model === 'tn' ? 'active' : undefined}>t-SNE</button>
        <button onClick={() => setModel('un')} className={model === 'un' ? 'active' : undefined}>UMAP</button>
      </div>
    </div>
  )
}
