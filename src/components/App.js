import React, { useState, useLayoutEffect, useEffect, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Object3D, Color, MOUSE, VertexColors } from 'three';
import { useSpring } from '@react-spring/three';
import { coords } from './models';
import { groups } from './groups';

const numItems = coords['gr'].length;
const animatedCoords = Array.from({ length: numItems }, () => [0, 0, 0]);

// key code constants
const ALT_KEY = 18;
const CTRL_KEY = 17;
const CMD_KEY = 91;

// colors
const colorArray = [0x79eb99, 0x513eb4, 0xfe7dda, 0x208eb7,
                    0xe3a6d5, 0x6c3357, 0x7487fb, 0x5f8138];

// re-use for instance computations
const colorSubstrate = new Color();

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
    config: {
      friction: 208,
      tension: 340,
      mass: 50,
    },
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

function updateColors({ group }) {
  const colorAttrib = useRef();
  const colorBuffer = useMemo(() => new Float32Array(numItems * 3), [numItems]);
  const colorVals = groups[group];

  useEffect(() => {
    for (let i = 0; i < numItems; ++i) {
      colorSubstrate.set(colorArray[colorVals[i]]);
      colorSubstrate.toArray(colorBuffer, i * 3);
    }
    colorAttrib.current.needsUpdate = true;
  }, [group, colorBuffer]);

  return { colorAttrib, colorBuffer }
}

function Boxes({ model, group }) {
  const meshRef = useRef();

  useSpringAnimation({
    coords,
    model,
    onChange: () => { updatePositions({ mesh: meshRef.current }) }
  });

  const { colorAttrib, colorBuffer } = updateColors({ group });

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, numItems]}
      onClick={e => console.log(e.instanceId)}
    >
      <boxBufferGeometry args={[0.75, 0.75, 0.25]}>
        <instancedBufferAttribute
            ref={colorAttrib}
            attachObject={['attributes', 'color']}
            args={[colorBuffer, 3]}
        />
      </boxBufferGeometry>
      <meshStandardMaterial
        attach="material"
        vertexColors={VertexColors}
      />
    </instancedMesh>
  )
}

function returnDomain() {
  const production = process.env.NODE_ENV === 'production';
  return production ? '' : 'http://localhost:8888/'
}

export default function App() {
  const [model, setModel] = useState('gr');
  const [group, setGroup] = useState('b');

  return (
    <div id='app'>
      <div id='viewpane'>
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 135], far: 20000 }}>
          <color attach="background" args={[0x87ceeb]} />
          <ambientLight />
          <pointLight position={[0, 0, 135]} />
          <Boxes
            model={model}
            group={group}
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
      <div className='controls' id='groupControls'>
        <div className='controlsLabel'>Groups</div>
        <button onClick={() => setGroup('b')} className={group === 'b' ? 'active' : undefined}>BINDER</button>
        <button onClick={() => setGroup('k')} className={group === 'k' ? 'active' : undefined}>KMEANS</button>
        <button onClick={() => setGroup('c')} className={group === 'c' ? 'active' : undefined}>HDBSCAN</button>
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
