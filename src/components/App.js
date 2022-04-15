import React, { useState, useLayoutEffect, useEffect, useRef, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Object3D, Color, MOUSE, VertexColors } from 'three';
import { useSpring } from '@react-spring/three';
import { select } from 'd3-selection';
import { data } from './data';

/*isoMap----------------------------------------------------------------------*/

const isoGroupArray = Array.from(new Set(data['isoGroup']));
const isoMap = {};

isoGroupArray.forEach((item, i) => {
  let globalIndexArray = [];
  data['isoGroup'].forEach((isoGroup, j) => {
    if ( isoGroup === item ) {
      globalIndexArray.push(j)
    }
  });
  isoMap[item] = globalIndexArray;
});

const zArray = isoGroupArray.map(d => d===0 ? 0.05 : d===1 ? 0.25 : d===2 ? 0.5 : 0.75);

/*radarMap--------------------------------------------------------------------*/

const radarGroupArray = Array.from(new Set(data['radarGroup']));
const radarMap = {};

radarGroupArray.forEach((item, i) => {
  let globalIndexArray = [];
  data['radarGroup'].forEach((radarGroup, j) => {
    if ( radarGroup === item ) {
      globalIndexArray.push(j)
    }
  });
  radarMap[item] = globalIndexArray;
});

const axisNotch = (binNumber, numBins) => {
  if ( numBins === 3 ) {
    return binNumber === '0' ? 0.33/2 : binNumber === '1' ? 0.66/2 : 0.99/2
  } else if ( numBins === 4 ) {
    return binNumber === '0' ? 0.25/2 : binNumber === '1' ? 0.5/2 : binNumber === '2' ? 0.75/2 : 1.0/2
  }
}

function radarVertices(glyphGroup) {
  let [thick, rough, gloss, color] = glyphGroup.split('_');

  thick = axisNotch(thick, 4) * -1;
  rough = axisNotch(rough, 3) * -1;
  gloss = axisNotch(gloss, 3);
  color = axisNotch(color, 4);

  let glyphThickness = 0.1;

  let thicktop = [thick,0,glyphThickness];
  let thickbottom = [thick,0,0];
  let roughtop = [0,rough,glyphThickness];
  let roughbottom = [0,rough,0];
  let glosstop = [gloss,0,glyphThickness];
  let glossbottom = [gloss,0,0];
  let colortop = [0,color,glyphThickness];
  let colorbottom = [0,color,0];

  let bottom = [thickbottom, glossbottom, colorbottom, roughbottom, glossbottom, thickbottom];
  let top = [thicktop, glosstop, colortop, roughtop, glosstop, thicktop];
  let upperLeft = [colorbottom, thicktop, colortop, colorbottom, thickbottom, thicktop];
  let upperRight = [glossbottom, colortop, glosstop, glossbottom, colorbottom, colortop];
  let lowerLeft = [thickbottom, roughtop, thicktop, thickbottom, roughbottom, roughtop];
  let lowerRight = [roughbottom, glosstop, roughtop, roughbottom, glossbottom, glosstop];

  const rawVertices = [bottom, top, upperLeft, upperRight, lowerLeft, lowerRight];
  return new Float32Array(rawVertices.flat(2))

}

function radarNormals(glyphGroup) {
  let [thick, rough, gloss, color] = glyphGroup.split('_');

  thick = axisNotch(thick, 4) * -1;
  rough = axisNotch(rough, 3) * -1;
  gloss = axisNotch(gloss, 3);
  color = axisNotch(color, 4);

  const rawNormals = [
    [0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1], //bottom
    [0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1], //top
    [-1*color,thick,0],[-1*color,thick,0],[-1*color,thick,0],[-1*color,thick,0],[-1*color,thick,0],[-1*color,thick,0], //upperLeft
    [color,gloss,0],[color,gloss,0],[color,gloss,0],[color,gloss,0],[color,gloss,0],[color,gloss,0], //upperRight
    [rough,thick,0],[rough,thick,0],[rough,thick,0],[rough,thick,0],[rough,thick,0],[rough,thick,0], //lowerLeft
    [-1*rough,-1*gloss,0],[-1*rough,-1*gloss,0],[-1*rough,-1*gloss,0],[-1*rough,-1*gloss,0],[-1*rough,-1*gloss,0],[-1*rough,-1*gloss,0] //lowerRight
  ];
  return new Float32Array(rawNormals.flat())
}

/*Text------------------------------------------------------------------------*/

function writeTitleArray(globalInstanceId) {
  return [
    data['man'][globalInstanceId],
    data['bran'][globalInstanceId],
    data['year'][globalInstanceId]
  ]
}

function writeInfoArray(globalInstanceId) {
  let textureWord = data['textureWord'][globalInstanceId];
  let glossWord = data['glossWord'][globalInstanceId];

  textureWord = textureWord === '_' ? '' : textureWord;
  glossWord = glossWord === '_' ? '' : glossWord;

  return [textureWord + " " + glossWord]
}

const pCatsTitle = [ "man", "bran", "year" ];
const pCatsInfo = [ "textureWord" ];

function writePanel(globalInstanceId) {
  select("#catalog")
    .append("p")
    .text("#"+data['catalog'][globalInstanceId])

  select("#titleBar")
    .selectAll("p.title")
    .data(writeTitleArray(globalInstanceId))
    .enter()
    .append("p")
    .text(d => d)
    .attr("class", (d, i) => "title " + pCatsTitle[i])

  select("#infoBar")
    .selectAll("p.info")
    .data(writeInfoArray(globalInstanceId))
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

const animatedCoords = Array.from({ length: data['isoGroup'].length }, () => [0, 0, 0]);

function interpolatePositions({ globalIndicesForThisMesh, model }, progress ) {
  globalIndicesForThisMesh.forEach((item, i) => {
    animatedCoords[item][0] = (1 - progress) * animatedCoords[item][0] + progress * data[model][globalIndicesForThisMesh[i]][0];
    animatedCoords[item][1] = (1 - progress) * animatedCoords[item][1] + progress * data[model][globalIndicesForThisMesh[i]][1];
    animatedCoords[item][2] = (1 - progress) * animatedCoords[item][2] + progress * data[model][globalIndicesForThisMesh[i]][2];
  });
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

function Glyphs({ glyphMap, glyphGroup, glyph, model, group, clickedItem, onClickItem, newMeshWithClickedGlobalInstanceId, setNewMeshWithClickedGlobalInstanceId, z, vertices, normals, itemSize }) {
  const globalIndicesForThisMesh = glyphMap[glyphGroup];
  const clickedGlobalInstanceId = clickedItem[1];
  const colorVals = data[group];
  const oldColorVal = groupColors[colorVals[clickedGlobalInstanceId]] || colorVals[clickedGlobalInstanceId];

  const meshRef = useRef();
  const { invalidate } = useThree();

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
      updatePositions({ globalIndicesForThisMesh, mesh: meshRef.current });
      invalidate();
    },
  }, [model]);

  useLayoutEffect(() => {
    globalIndicesForThisMesh.forEach((item, i) => {
      if ( item !== clickedGlobalInstanceId ) { // so we don't recolor the clicked point
        const colorVal = groupColors[colorVals[item]] || colorVals[item];
        colorSubstrate.set(colorVal);
        meshRef.current.setColorAt(i, colorSubstrate);
      } else {
        // clickedGlobalInstanceId is guaranteed non-null here
        setNewMeshWithClickedGlobalInstanceId([meshRef.current, i, oldColorVal]); // oldColorVal at time of replacing meshes
        colorSubstrate.set(highlightColor);
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

    if ( delta <= 5 ) {

      clearInfoPanel();

      if ( clickedGlobalInstanceId !== globalInstanceId ) {

        writePanel(globalInstanceId);
        colorSubstrate.set(highlightColor);
        meshRef.current.setColorAt(instanceId, colorSubstrate);
        onClickItem([instanceId, globalInstanceId, meshRef.current]); // not sure why this should be here, but if after conditional below => bug

        if ( clickedGlobalInstanceId !== null ) {
          colorSubstrate.set(oldColorVal);

          // if we haven't just replaced the meshes
          clickedItem[2].setColorAt(clickedItem[0], colorSubstrate);
          clickedItem[2].instanceColor.needsUpdate = true; // previous instanceColor

          // if we have just replaced the meshes
          colorSubstrate.set(newMeshWithClickedGlobalInstanceId[2]);
          newMeshWithClickedGlobalInstanceId[0].setColorAt(newMeshWithClickedGlobalInstanceId[1], colorSubstrate);
          newMeshWithClickedGlobalInstanceId[0].instanceColor.needsUpdate = true;

        }

      } else if (clickedGlobalInstanceId === globalInstanceId) {

        colorSubstrate.set(oldColorVal); // also works with newColorVal

        // if we haven't just replaced the meshes
        clickedItem[2].setColorAt(clickedItem[0], colorSubstrate);
        clickedItem[2].instanceColor.needsUpdate = true; // previous instanceColor
        onClickItem([null,null,null]);

        // if we have just replaced the meshes
        colorSubstrate.set(newMeshWithClickedGlobalInstanceId[2]);
        newMeshWithClickedGlobalInstanceId[0].setColorAt(newMeshWithClickedGlobalInstanceId[1], colorSubstrate);
        newMeshWithClickedGlobalInstanceId[0].instanceColor.needsUpdate = true;
      }
      meshRef.current.instanceColor.needsUpdate = true;
      invalidate();
    }
  }

  if ( glyph === 'iso' ) {
    return (
      <instancedMesh ref={meshRef} args={[null, null, glyphMap[glyphGroup].length]} onClick={handleClick}>
        <boxBufferGeometry args={[0.75, 0.75, z]}></boxBufferGeometry>
        <meshStandardMaterial attach="material"/>
      </instancedMesh>
    )
  } else if ( glyph === 'radar' ) {
    return (
      <instancedMesh ref={meshRef} args={[null, null, glyphMap[glyphGroup].length]} onClick={handleClick}>
        <bufferGeometry>
          <bufferAttribute
            attachObject={["attributes", "position"]}
            array={vertices}
            count={vertices.length / itemSize}
            itemSize={itemSize}
          />
          <bufferAttribute
            attachObject={["attributes", "normal"]}
            array={normals}
            count={normals.length / itemSize}
            itemSize={itemSize}
          />
        </bufferGeometry>
        <meshStandardMaterial attach="material"/>
      </instancedMesh>
    )
  }
}

/*App-------------------------------------------------------------------------*/

export default function App() {
  const [model, setModel] = useState('grid');
  const [group, setGroup] = useState('colorGroupBinder');
  const [clickedItem, setClickedItem] = useState([null,null,null]);
  const [newMeshWithClickedGlobalInstanceId, setNewMeshWithClickedGlobalInstanceId] = useState([null,null]);
  const [glyph, setGlyph] = useState('iso');
  const itemSize = 3;

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
          {glyph==='iso' && isoGroupArray.map((d,i) => {
            return <Glyphs key={i} glyphMap={isoMap} glyphGroup={d} glyph={glyph} model={model} group={group} clickedItem={clickedItem} onClickItem={setClickedItem} newMeshWithClickedGlobalInstanceId={newMeshWithClickedGlobalInstanceId} setNewMeshWithClickedGlobalInstanceId={setNewMeshWithClickedGlobalInstanceId} z={zArray[i]} vertices={null} normals={null} itemSize={null} />
          })}
          {glyph==='radar' && radarGroupArray.map((d,i) => {
            return <Glyphs key={i} glyphMap={radarMap} glyphGroup={d} glyph={glyph} model={model} group={group} clickedItem={clickedItem} onClickItem={setClickedItem} newMeshWithClickedGlobalInstanceId={newMeshWithClickedGlobalInstanceId} setNewMeshWithClickedGlobalInstanceId={setNewMeshWithClickedGlobalInstanceId} z={null} vertices={radarVertices(d)} normals={radarNormals(d)} itemSize={itemSize} />
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
      <div className='controls' id='glyphControls'>
        <div className='controlsLabel'>Glyphs</div>
        <button onClick={() => setGlyph('iso')} className={glyph === 'iso' ? 'active' : undefined}>ISO</button>
        <button onClick={() => setGlyph('radar')} className={glyph === 'radar' ? 'active' : undefined}>RADAR</button>
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
