import React, { useState, useLayoutEffect, useEffect, useRef, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Object3D, Color, MOUSE, VertexColors } from 'three';
import { useSpring } from '@react-spring/three';
import { select } from 'd3-selection';
import { coords } from './models';
import { groups } from './groups';
import { db } from './db';

const catalog = db['c'];
const binder = db['b'];
const man = db['m'];
const bran = db['r'];
const year = db['y'];
const texture = db['x'];

function writePanelArray(i) {
  return [ catalog[i], binder[i], man[i], bran[i], year[i], texture[i] ]
}

const numItems = coords['gr'].length;
const animatedCoords = Array.from({ length: numItems }, () => [0, 0, 0]);

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
    config: {
      friction: 416,
      tension: 170,
      mass: 100,
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
    substrate.position.set(item[0],item[1],item[2] * 0.35);
    substrate.updateMatrix();
    mesh.setMatrixAt(i, substrate.matrix);
  });

  mesh.instanceMatrix.needsUpdate = true;
}

const groupColors = [0x79eb99, 0x513eb4, 0xfe7dda, 0x208eb7,
                     0xe3a6d5, 0x6c3357, 0x7487fb, 0x5f8138];

const colorSubstrate = new Color();
const colorBuffer = new Float32Array(numItems * 3);

function updateColors({ group, clickedItem, invalidate }) {
  const colorAttrib = useRef();
  const colorVals = groups[group];

  useEffect(() => {
    for (let i = 0; i < numItems; ++i) {
      if ( i !== clickedItem ) { // so we don't recolor the clicked point
        colorSubstrate.set(groupColors[colorVals[i]]);
        colorSubstrate.toArray(colorBuffer, i * 3);
      }
    }
    colorAttrib.current.needsUpdate = true;
    invalidate();
  }, [group]);

  return { colorAttrib }
}

function Boxes({ model, group }) {
  const meshRef = useRef();
  const [clickedItem, setClickedItem] = useState(null);
  const { invalidate } = useThree();

  useSpringAnimation({
    coords,
    model,
    onChange: () => {
      updatePositions({ mesh: meshRef.current });
      invalidate();
    }
  });

  const { colorAttrib } = updateColors({ group, clickedItem, invalidate });

  const handleClick = e => {
    // this appears to select first raycast intersection, but not sure
    e.stopPropagation();

    const { delta, instanceId } = e;
    const colorVals = groups[group];

    if ( delta <= 5 ) {

      select("#infoPanel")
        .selectAll("p")
        .remove()

      if ( clickedItem === null ) {

        select("#infoPanel")
          .selectAll("p")
          .data(writePanelArray(instanceId))
          .enter()
          .append("p")
          .text(d => d)

        colorSubstrate.set(0xffff00);
        colorSubstrate.toArray(colorBuffer, instanceId * 3);
        setClickedItem(instanceId);

      } else if ( clickedItem === instanceId ) {

        colorSubstrate.set(groupColors[colorVals[instanceId]]);
        colorSubstrate.toArray(colorBuffer, instanceId * 3);
        setClickedItem(null);

      } else {

        select("#infoPanel")
          .selectAll("p")
          .data(writePanelArray(instanceId))
          .enter()
          .append("p")
          .text(d => d)

        colorSubstrate.set(groupColors[colorVals[clickedItem]]);
        colorSubstrate.toArray(colorBuffer, clickedItem * 3);

        colorSubstrate.set(0xffff00);
        colorSubstrate.toArray(colorBuffer, instanceId * 3);
        setClickedItem(instanceId)

      }

      colorAttrib.current.needsUpdate = true;
      invalidate();
    }
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, numItems]}
      onClick={handleClick}
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
      <div id='infoPanel'></div>
      <div id='viewpane'>
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 135], far: 20000 }} frameloop="demand">
          <color attach="background" args={[0x87ceeb]} />
          <ambientLight intensity={0.25}/>
          <pointLight position={[0, 0, 135]} intensity={0.25}/>
          <Boxes
            model={model}
            group={group}
          />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
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
