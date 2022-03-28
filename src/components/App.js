import React, { useState, useLayoutEffect, useEffect, useRef, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Object3D, Color, MOUSE, VertexColors } from 'three';
import { useSpring } from '@react-spring/three';
import { select } from 'd3-selection';
import { data } from './data';

/*Text------------------------------------------------------------------------*/

function writeTitleArray(i) {
  return [ data['man'][i], data['bran'][i], data['year'][i] ]
}

function writeInfoArray(i) {
  return [ data['textureWord'][i]==='_' ? '' : data['textureWord'][i] ]
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

/*Models----------------------------------------------------------------------*/

const numItems = data['grid'].length;
const animatedCoords = Array.from({ length: numItems }, () => [0, 0, 0]);

function interpolatePositions( animatedCoords, model, progress ) {
  animatedCoords.forEach((item, i) => {
    animatedCoords[i][0] = (1 - progress) * item[0] + progress * data[model][i][0];
    animatedCoords[i][1] = (1 - progress) * item[1] + progress * data[model][i][1];
    animatedCoords[i][2] = (1 - progress) * item[2] + progress * data[model][i][2];
  });
}

function useSpringAnimation({ animatedCoords, model, onChange }) {
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
      interpolatePositions( animatedCoords, model, ctrl.get().animationProgress );
      onChange();
    },
  }, [model]);
}

const substrate = new Object3D();

function updatePositions({ animatedCoords, mesh }) {
  if (!mesh) return;
  animatedCoords.forEach((item, i) => {
    substrate.position.set(item[0],item[1],item[2] * 0.35);
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
const colorBuffer = new Float32Array(numItems * 3);

function updateColors({ group, clickedItem, invalidate }) {
  const colorAttrib = useRef();
  const colorVals = data[group];

  useEffect(() => {
    for (let i = 0; i < numItems; ++i) {
      if ( i !== clickedItem ) { // so we don't recolor the clicked point
        const colorVal = groupColors[colorVals[i]] || colorVals[i];
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

function Boxes({ model, group, clickedItem, onClickItem }) {
  const meshRef = useRef();

  const { invalidate } = useThree();

  useSpringAnimation({
    animatedCoords,
    model,
    onChange: () => {
      updatePositions({ animatedCoords, mesh: meshRef.current });
      invalidate();
    }
  });

  const { colorAttrib } = updateColors({ group, clickedItem, invalidate });

  const handleClick = e => {
    // this appears to select first raycast intersection, but not sure
    e.stopPropagation();

    const { delta, instanceId } = e;
    const colorVals = data[group];

    if ( delta <= 5 ) {

      select("#catalog")
        .selectAll("p")
        .remove()

      select("#infoBar")
        .selectAll("p")
        .remove()

      select("#titleBar")
        .selectAll("p")
        .remove()

      if ( clickedItem === null ) {

        writePanel(instanceId);

        colorSubstrate.set(highlightColor);
        colorSubstrate.toArray(colorBuffer, instanceId * 3);
        onClickItem(instanceId);

      } else if ( clickedItem === instanceId ) {

        const colorVal = groupColors[colorVals[instanceId]] || colorVals[instanceId];
        colorSubstrate.set(colorVal);
        colorSubstrate.toArray(colorBuffer, instanceId * 3);
        onClickItem(null);

      } else {

        writePanel(instanceId);

        const colorVal = groupColors[colorVals[clickedItem]] || colorVals[clickedItem];
        colorSubstrate.set(colorVal);
        colorSubstrate.toArray(colorBuffer, clickedItem * 3);

        colorSubstrate.set(highlightColor);
        colorSubstrate.toArray(colorBuffer, instanceId * 3);
        onClickItem(instanceId)

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

/*App-------------------------------------------------------------------------*/

export default function App() {
  const [model, setModel] = useState('grid');
  const [group, setGroup] = useState('colorGroupBinder');
  const [clickedItem, setClickedItem] = useState(null);

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
          <ambientLight intensity={0.75}/>
          <pointLight position={[0, 0, 135]} intensity={1.0}/>
          <Boxes
            model={model}
            group={group}
            clickedItem={clickedItem}
            onClickItem={setClickedItem}
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
