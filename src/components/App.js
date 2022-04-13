import React, { useState, useLayoutEffect, useEffect, useRef, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Object3D, Color, MOUSE, VertexColors } from 'three';
import { useSpring } from '@react-spring/three';
import { select } from 'd3-selection';
import { data } from './data';

/*MeshMap---------------------------------------------------------------------*/

const meshGroupArray = Array.from(new Set(data['meshGroup']));
const zArray = meshGroupArray.map(d => d.split("_")[0]==='0' ? 0.05 : d.split("_")[0]==='1' ? 0.25 : d.split("_")[0]==='2' ? 0.5 : 0.75);

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

const animatedCoords = Array.from({ length: data['meshGroup'].length }, () => [0, 0, 0]);

function interpolatePositions({ globalIndicesForThisMesh, model }, progress ) {
  globalIndicesForThisMesh.forEach((item, i) => {
    animatedCoords[item][0] = (1 - progress) * animatedCoords[item][0] + progress * data[model][globalIndicesForThisMesh[i]][0];
    animatedCoords[item][1] = (1 - progress) * animatedCoords[item][1] + progress * data[model][globalIndicesForThisMesh[i]][1];
    animatedCoords[item][2] = (1 - progress) * animatedCoords[item][2] + progress * data[model][globalIndicesForThisMesh[i]][2];
  });
}

function useSpringAnimation({ globalIndicesForThisMesh, model, onChange }) {
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
      interpolatePositions({ globalIndicesForThisMesh, model }, ctrl.get().animationProgress );
      onChange();
    },
  }, [model]);
}

const substrate = new Object3D();

function updatePositions({ globalIndicesForThisMesh, mesh }) {
  if (!mesh) return;
  globalIndicesForThisMesh.forEach((item, i) => {
    substrate.position.set(animatedCoords[item][0],animatedCoords[item][1],animatedCoords[item][2]);
    substrate.updateMatrix();
    mesh.setMatrixAt(i, substrate.matrix);
  });

  mesh.instanceMatrix.needsUpdate = true;
}

/*Colors----------------------------------------------------------------------*/

const groupColors = [0x79eb99, 0x513eb4, 0xfe7dda, 0x208eb7, 0xe3a6d5, 0x6c3357, 0x7487fb, 0x5f8138];
const highlightColor = 0xff00ff;
const colorSubstrate = new Color();

/*instancedMesh---------------------------------------------------------------*/

function Boxes({ meshGroup, model, group, clickedItem, onClickItem, z }) {
  let globalIndicesForThisMesh = meshMap[meshGroup];
  let clickedGlobalInstanceId = clickedItem[1];
  const meshRef = useRef();
  const { invalidate } = useThree();

  useSpringAnimation({
    globalIndicesForThisMesh,
    model,
    onChange: () => {
      updatePositions({ globalIndicesForThisMesh, mesh: meshRef.current });
      invalidate();
    }
  });

  const colorVals = data[group];

  useLayoutEffect(() => {
    globalIndicesForThisMesh.forEach((item, i) => {
      if ( item !== clickedGlobalInstanceId ) { // so we don't recolor the clicked point
        const colorVal = groupColors[colorVals[item]] || colorVals[item];
        colorSubstrate.set(colorVal);
        meshRef.current.setColorAt(i, colorSubstrate);
      }
    });
    meshRef.current.instanceColor.needsUpdate = true;
    invalidate();
  }, [group]);


  const handleClick = e => {
    // this appears to select first raycast intersection, but not sure
    e.stopPropagation();

    const { delta, instanceId } = e;
    const globalInstanceId = globalIndicesForThisMesh[instanceId];
    const colorVals = data[group];
    const oldColorVal = groupColors[colorVals[clickedGlobalInstanceId]] || colorVals[clickedGlobalInstanceId];

    if ( delta <= 5 ) {

      clearInfoPanel();

      if ( clickedGlobalInstanceId !== globalInstanceId ) {

        writePanel(globalInstanceId);
        colorSubstrate.set(highlightColor);
        meshRef.current.setColorAt(instanceId, colorSubstrate);
        onClickItem([instanceId, globalInstanceId, meshRef.current]);

        if ( clickedGlobalInstanceId !== null ) { // I think bc globalClickedItem here would be undefined, not null
          colorSubstrate.set(oldColorVal);
          clickedItem[2].setColorAt(clickedItem[0], colorSubstrate);
          clickedItem[2].instanceColor.needsUpdate = true; // previous instanceColor
        }

      } else if (clickedGlobalInstanceId === globalInstanceId) {
        colorSubstrate.set(oldColorVal); // also works with newColorVal
        clickedItem[2].setColorAt(clickedItem[0], colorSubstrate);
        clickedItem[2].instanceColor.needsUpdate = true; // previous instanceColor
        onClickItem([null,null,null]);
      }
      meshRef.current.instanceColor.needsUpdate = true;
      invalidate();
    }
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, meshMap[meshGroup].length]}
      name={meshGroup}
      onClick={handleClick}
    >
      <boxBufferGeometry args={[0.75, 0.75, z]}>
      </boxBufferGeometry>
      <meshStandardMaterial
        attach="material"
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
            return <Boxes key={i} meshGroup={d} model={model} group={group} clickedItem={clickedItem} onClickItem={setClickedItem} z={zArray[i]} />
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
