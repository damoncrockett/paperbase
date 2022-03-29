import React, { useState, useLayoutEffect, useEffect, useRef, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Object3D, Color, MOUSE, VertexColors } from 'three';
import { useSpring } from '@react-spring/three';
import { select } from 'd3-selection';
import { data } from './data';

/*MeshMap---------------------------------------------------------------------*/

const meshGroupArray = ['0_0','1_0','2_0','3_0',
                        '0_1','1_1','2_1','3_1',
                        '0_2','1_2','2_2'];

const meshAttributeArray = [
  {z: 0.05, r: 1, m: 0},
  {z: 0.25, r: 1, m: 0},
  {z: 0.5, r: 1, m: 0},
  {z: 0.75, r: 1, m: 0},
  {z: 0.05, r: 0.5, m: 0.5},
  {z: 0.25, r: 0.5, m: 0.5},
  {z: 0.5, r: 0.5, m: 0.5},
  {z: 0.75, r: 0.5, m: 0.5},
  {z: 0.05, r: 0, m: 1},
  {z: 0.25, r: 0, m: 1},
  {z: 0.5, r: 0, m: 1},
];

const meshMap = {};

meshGroupArray.forEach((item, i) => {
  let globalIndexArray = [];

  data['meshGroup'].forEach((meshGroup, j) => {
    if ( meshGroup === item ) {
      globalIndexArray.push(j)
    }
  });

  meshMap[item] = globalIndexArray;

});

/*Meshes----------------------------------------------------------------------*/

const animatedCoords00 = Array.from({ length: meshMap['0_0'].length }, () => [0, 0, 0]);
const animatedCoords10 = Array.from({ length: meshMap['1_0'].length }, () => [0, 0, 0]);
const animatedCoords20 = Array.from({ length: meshMap['2_0'].length }, () => [0, 0, 0]);
const animatedCoords30 = Array.from({ length: meshMap['3_0'].length }, () => [0, 0, 0]);
const animatedCoords01 = Array.from({ length: meshMap['0_1'].length }, () => [0, 0, 0]);
const animatedCoords11 = Array.from({ length: meshMap['1_1'].length }, () => [0, 0, 0]);
const animatedCoords21 = Array.from({ length: meshMap['2_1'].length }, () => [0, 0, 0]);
const animatedCoords31 = Array.from({ length: meshMap['3_1'].length }, () => [0, 0, 0]);
const animatedCoords02 = Array.from({ length: meshMap['0_2'].length }, () => [0, 0, 0]);
const animatedCoords12 = Array.from({ length: meshMap['1_2'].length }, () => [0, 0, 0]);
const animatedCoords22 = Array.from({ length: meshMap['2_2'].length }, () => [0, 0, 0]);

const meshArray = [
  animatedCoords00, animatedCoords10, animatedCoords20, animatedCoords30,
  animatedCoords01, animatedCoords11, animatedCoords21, animatedCoords31,
  animatedCoords02, animatedCoords12, animatedCoords22
];

const meshes = {};
meshGroupArray.forEach((item, i) => {
  meshes[item] = meshArray[i]
});

/*ColorBuffers----------------------------------------------------------------*/

const colorBuffer00 = new Float32Array(meshMap['0_0'].length * 3);
const colorBuffer10 = new Float32Array(meshMap['1_0'].length * 3);
const colorBuffer20 = new Float32Array(meshMap['2_0'].length * 3);
const colorBuffer30 = new Float32Array(meshMap['3_0'].length * 3);
const colorBuffer01 = new Float32Array(meshMap['0_1'].length * 3);
const colorBuffer11 = new Float32Array(meshMap['1_1'].length * 3);
const colorBuffer21 = new Float32Array(meshMap['2_1'].length * 3);
const colorBuffer31 = new Float32Array(meshMap['3_1'].length * 3);
const colorBuffer02 = new Float32Array(meshMap['0_2'].length * 3);
const colorBuffer12 = new Float32Array(meshMap['1_2'].length * 3);
const colorBuffer22 = new Float32Array(meshMap['2_2'].length * 3);

const colorBufferArray = [
  colorBuffer00, colorBuffer10, colorBuffer20, colorBuffer30,
  colorBuffer01, colorBuffer11, colorBuffer21, colorBuffer31,
  colorBuffer02, colorBuffer12, colorBuffer22
];

const colorBuffers = {};
meshGroupArray.forEach((item, i) => {
  colorBuffers[item] = colorBufferArray[i]
});

/*Text------------------------------------------------------------------------*/

function writeTitleArray(instanceId) {
  return [
    data['man'][instanceId],
    data['bran'][instanceId],
    data['year'][instanceId]
  ]
}

function writeInfoArray(instanceId) {
  return [ data['textureWord'][instanceId]==='_' ? '' : data['textureWord'][instanceId] ]
}

const pCatsTitle = [ "man", "bran", "year" ];
const pCatsInfo = [ "textureWord" ];

function writePanel(instanceId) {
  select("#catalog")
    .append("p")
    .text("#"+data['catalog'][instanceId])

  select("#titleBar")
    .selectAll("p.title")
    .data(writeTitleArray(instanceId))
    .enter()
    .append("p")
    .text(d => d)
    .attr("class", (d, i) => "title " + pCatsTitle[i])

  select("#infoBar")
    .selectAll("p.info")
    .data(writeInfoArray(instanceId))
    .enter()
    .append("p")
    .text(d => d)
    .attr("class", (d, i) => "info " + pCatsInfo[i])
}

function clearInfoPanel() {
  select("#catalog")
    .selectAll("p")
    .remove()

  select("#infoBar")
    .selectAll("p")
    .remove()

  select("#titleBar")
    .selectAll("p")
    .remove()
}

/*Models----------------------------------------------------------------------*/

function interpolatePositions({ animatedCoords, meshGroup, model }, progress ) {
  animatedCoords.forEach((item, i) => {
    animatedCoords[i][0] = (1 - progress) * item[0] + progress * data[model][meshMap[meshGroup][i]][0];
    animatedCoords[i][1] = (1 - progress) * item[1] + progress * data[model][meshMap[meshGroup][i]][1];
    animatedCoords[i][2] = (1 - progress) * item[2] + progress * data[model][meshMap[meshGroup][i]][2];
  });
}

function useSpringAnimation({ animatedCoords, meshGroup, model, onChange }) {
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
      interpolatePositions({ animatedCoords, meshGroup, model }, ctrl.get().animationProgress );
      onChange();
    },
  }, [model]);
}

const substrate = new Object3D();

function updatePositions({ animatedCoords, mesh }) {
  if (!mesh) return;
  animatedCoords.forEach((item, i) => {
    substrate.position.set(item[0],item[1],item[2]);
    substrate.updateMatrix();
    mesh.setMatrixAt(i, substrate.matrix);
  });

  mesh.instanceMatrix.needsUpdate = true;
}

/*Colors----------------------------------------------------------------------*/

const groupColors = [0x79eb99, 0x513eb4, 0xfe7dda, 0x208eb7,
                     0xe3a6d5, 0x6c3357, 0x7487fb, 0x5f8138];

const highlightColor = 0xff00ff;

const colorSubstrate = new Color();

function updateColors({ meshGroup, colorBuffer, group, globalClickedItem, invalidate }) {
  const colorAttrib = useRef();
  const colorVals = data[group];

  useEffect(() => {
    for (let i = 0; i < colorBuffer.length; ++i) {
      if ( meshMap[meshGroup][i] !== globalClickedItem ) { // so we don't recolor the clicked point
        const colorVal = groupColors[colorVals[meshMap[meshGroup][i]]] || colorVals[meshMap[meshGroup][i]];
        colorSubstrate.set(colorVal);
        colorSubstrate.toArray(colorBuffer, i * 3);
      }
    }
    colorAttrib.current.needsUpdate = true;
    invalidate();
  }, [group]);

  return { colorAttrib }
}

/*instancedMesh---------------------------------------------------------------*/

function Boxes({ meshGroup, model, group, clickedItem, onClickItem, meshAttributes }) {
  const globalClickedItem = clickedItem[1] === null ? null : meshMap[clickedItem[0]][clickedItem[1]];
  const meshRef = useRef();
  const { invalidate } = useThree();

  const animatedCoords = meshes[meshGroup];

  useSpringAnimation({
    animatedCoords,
    meshGroup,
    model,
    onChange: () => {
      updatePositions({ animatedCoords, mesh: meshRef.current });
      invalidate();
    }
  });

  const colorBuffer = colorBuffers[meshGroup];
  const { colorAttrib } = updateColors({ meshGroup, colorBuffer, group, globalClickedItem, invalidate });

  const handleClick = e => {
    // this appears to select first raycast intersection, but not sure
    e.stopPropagation();

    const { delta, instanceId } = e;
    const globalInstanceId = meshMap[meshGroup][instanceId];
    const colorVals = data[group];
    const oldColorVal = groupColors[colorVals[globalClickedItem]] || colorVals[globalClickedItem];

    if ( delta <= 5 ) {

      clearInfoPanel();

      if ( globalClickedItem !== globalInstanceId ) {

        writePanel(globalInstanceId);

        colorSubstrate.set(highlightColor);
        colorSubstrate.toArray(colorBuffer, instanceId * 3);

        onClickItem([e.object.name,instanceId,colorAttrib.current]);

        if ( clickedItem[1] !== null ) { // I think bc globalClickedItem here would be undefined, not null
          colorSubstrate.set(oldColorVal);
          colorSubstrate.toArray(colorBuffers[clickedItem[0]], clickedItem[1] * 3);
          clickedItem[2].needsUpdate = true; // previous colorAttrib
        }

      } else if (globalClickedItem === globalInstanceId) {
        colorSubstrate.set(oldColorVal); // also works with newColorVal
        colorSubstrate.toArray(colorBuffers[clickedItem[0]], clickedItem[1] * 3);
        clickedItem[2].needsUpdate = true; // previous colorAttrib // also works with instanceId
        onClickItem([null,null,null]);
      }
      colorAttrib.current.needsUpdate = true;
      invalidate();
    }
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, meshes[meshGroup].length]}
      onClick={handleClick}
      name={meshGroup}
    >
      <boxBufferGeometry args={[0.75, 0.75, meshAttributes['z']]}>
        <instancedBufferAttribute
            ref={colorAttrib}
            attachObject={['attributes', 'color']}
            args={[colorBuffer, 3]}
        />
      </boxBufferGeometry>
      <meshStandardMaterial
        attach="material"
        vertexColors={VertexColors}
        roughness={meshAttributes['r']}
        metalness={0.75}
      />
    </instancedMesh>
  )
}

/*App-------------------------------------------------------------------------*/

export default function App() {
  const [model, setModel] = useState('grid');
  const [group, setGroup] = useState('colorGroupBinder');
  const [clickedItem, setClickedItem] = useState([null,null,null]);

  // key code constants
  const ALT_KEY = 18;
  const CTRL_KEY = 17;
  const CMD_KEY = 91;

  return (
    <div id='app'>
      <div id='infoPanel'>
        <div id='catalog'></div>
        <div id='titleBar'></div>
        <div id='infoBar'></div>
      </div>
      <div id='viewpane'>
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 135], far: 20000 }} frameloop="demand">
          <color attach="background" args={[0x505050]} />
          <ambientLight intensity={0.5}/>
          <pointLight position={[0, 0, 135]} intensity={0.5}/>
          {meshGroupArray.map((d,i) => {
            return <Boxes key={i} meshGroup={d} model={model} group={group} clickedItem={clickedItem} onClickItem={setClickedItem} meshAttributes={meshAttributeArray[i]} />
          })}
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
        <button onClick={() => setGroup('colorGroupBinder')} className={group === 'colorGroupBinder' ? 'active' : undefined}>BINDER</button>
        <button onClick={() => setGroup('colorGroupKmeans')} className={group === 'colorGroupKmeans' ? 'active' : undefined}>KMEANS</button>
        <button onClick={() => setGroup('colorString')} className={group === 'colorString' ? 'active' : undefined}>COLOR</button>
        <button onClick={() => setGroup('colorStringSat')} className={group === 'colorStringSat' ? 'active' : undefined}>SAT</button>
        <button onClick={() => setGroup('colorStringHue')} className={group === 'colorStringHue' ? 'active' : undefined}>HUE</button>
      </div>
      <div className='controls' id='modelControls'>
        <div className='controlsLabel'>Models</div>
        <button onClick={() => setModel('grid')} className={model === 'grid' ? 'active' : undefined}>GRID</button>
        <button onClick={() => setModel('tsne')} className={model === 'tsne' ? 'active' : undefined}>t-SNE</button>
        <button onClick={() => setModel('umap')} className={model === 'umap' ? 'active' : undefined}>UMAP</button>
      </div>
    </div>
  )
}
