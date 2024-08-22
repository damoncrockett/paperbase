import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { Object3D, MOUSE, DoubleSide } from 'three';
import { useSpring } from '@react-spring/three';
import { Slider } from '@mui/material';
import { max, min, cloneDeep, intersection, set } from 'lodash';
import data from '../assets/data/data.json';
import { returnDomain } from '../utils/img';
import PanelItem from './PanelItem';
import Download from './Download';
import BoxSelection from './BoxSelection';

console.log(data);

export const missingDminHexIdxs = [];
data['dminHex'].forEach((d,i) => {
  if ( d === '' ) {
    missingDminHexIdxs.push(i);
  }
});

import { valueCounts, rankTransform } from '../utils/stats';

import { 
  makeColorArray, 
  highlightColor,
  missingColorTone,
  colorSubstrate,
  continuousColorCols,
  valToColor,
  applyFilterColors,
  getColorVal
} from '../utils/color';

import { 
  makeGroupLabels,
  makeMap,
  radarVertices,
  radarNormals
} from '../utils/glyph';

import { 
  makeGrid,
  makeHist,
  makeScatter
} from '../utils/plot';

const initialGroupColors = makeColorArray();
let colorVals; //this gets used in many places

const n = data['catalog'].length; // nrows in data; 'catalog' could be any column

//parse and round measurement values in `data`
data['year'] = data['year'].map(d => parseInt(d));
data['thickness'] = data['thickness'].map(d => parseFloat(parseFloat(d).toFixed(3)));
data['gloss'] = data['gloss'].map(d => parseFloat(parseFloat(d).toFixed(3)));
data['roughness'] = data['roughness'].map(d => parseFloat(parseFloat(d).toFixed(3)));
data['dmin'] = data['dmin'].map(d => parseFloat(parseFloat(d).toFixed(3)));
data['dmax'] = data['dmax'].map(d => parseFloat(parseFloat(d).toFixed(3)));
data['auc'] = data['auc'].map(d => parseFloat(parseFloat(d).toFixed(3)));
data['expressiveness'] = data['expressiveness'].map(d => parseFloat(parseFloat(d).toFixed(3)));

const yearMin = min(data['year']);
const yearMax = max(data['year']);
const thicknessMin = min(data['thickness']);
const thicknessMax = max(data['thickness']);
const glossMin = min(data['gloss']);
const glossMax = max(data['gloss']);
const roughnessMin = min(data['roughness']);
const roughnessMax = max(data['roughness']);
const colorMin = min(data['dmin']);
const colorMax = max(data['dmin']);
const toneMin = min(data['dmax']);
const toneMax = max(data['dmax']);
const uvMin = min(data['auc']);
const uvMax = max(data['auc']);
const expMin = min(data['expressiveness']);
const expMax = max(data['expressiveness']);

data['radarColor'] = makeGroupLabels(data['radarGroup']);
data['colorGroupColorWord'] = makeGroupLabels(data['colorWord']);
data['colorGroupThickWord'] = makeGroupLabels(data['thicknessWord']);
data['colorGroupTextureWord'] = makeGroupLabels(data['textureWord']);
data['colorGroupGlossWord'] = makeGroupLabels(data['glossWord']);
data['colorGroupMan'] = makeGroupLabels(data['man']);
data['colorGroupBran'] = makeGroupLabels(data['bran']);
data['colorGroupColl'] = makeGroupLabels(data['sb']);

// new filters for processing, backp, surf, resin, toner, postcard, circa, sbid
data['colorGroupProcessing'] = makeGroupLabels(data['processing']);
data['colorGroupBackp'] = makeGroupLabels(data['backp']);
data['colorGroupSurf'] = makeGroupLabels(data['surf']);
data['colorGroupResin'] = makeGroupLabels(data['resin']);
data['colorGroupToner'] = makeGroupLabels(data['toner']);
data['colorGroupPostcard'] = makeGroupLabels(data['postcard']);
data['colorGroupCirca'] = makeGroupLabels(data['circa']);
data['colorGroupSbid'] = makeGroupLabels(data['sbid']);

/*Metadata value counts-------------------------------------------------------*/

const thicknessValCounts = valueCounts(data['thicknessWord']);
const colorValCounts = valueCounts(data['colorWord']);
const textureValCounts = valueCounts(data['textureWord']);
const glossValCounts = valueCounts(data['glossWord']);
const manValCounts = valueCounts(data['man']);
const branValCounts = valueCounts(data['bran']);
const collValCounts = valueCounts(data['sb']);

const processingValCounts = valueCounts(data['processing']);
const backpValCounts = valueCounts(data['backp']);
const surfValCounts = valueCounts(data['surf']);
const resinValCounts = valueCounts(data['resin']);
const tonerValCounts = valueCounts(data['toner']);
const postcardValCounts = valueCounts(data['postcard']);
const circaValCounts = valueCounts(data['circa']);
const sbidValCounts = valueCounts(data['sbid']);

data['boxGroup'] = Array(n).fill('b');
const boxGroupArray = ['b'];
const boxMap = makeMap(data, boxGroupArray, 'boxGroup');

const expressivenessGroupArray = Array.from(new Set(data['expressivenessGroup']));
const expressivenessMap = makeMap(data, expressivenessGroupArray, 'expressivenessGroup');

const isoGroupArray = Array.from(new Set(data['isoGroup']));
const isoMap = makeMap(data, isoGroupArray, 'isoGroup');
const zArray = isoGroupArray.map(d => d === "" ? 0 : d === 0 ? 0.05 : d === 1 ? 0.25 : d === 2 ? 0.5 : 0.75);

const radarGroupArray = Array.from(new Set(data['radarGroup']));
const radarMap = makeMap(data, radarGroupArray, 'radarGroup');


export const dataU = {
  dmin: rankTransform(data['dmin']),
  thickness: rankTransform(data['thickness']),
  roughness: rankTransform(data['roughness']),
  gloss: rankTransform(data['gloss'])
};

console.log('dataU',dataU);

/*Models----------------------------------------------------------------------*/

const animatedCoords = Array.from({ length: n }, () => [0, 0, 0]);

function interpolatePositions({ globalIndicesForThisMesh, targetCoords }, progress ) {
  globalIndicesForThisMesh.forEach((item, i) => {
    animatedCoords[item][0] = (1 - progress) * animatedCoords[item][0] + progress * targetCoords[globalIndicesForThisMesh[i]][0];
    animatedCoords[item][1] = (1 - progress) * animatedCoords[item][1] + progress * targetCoords[globalIndicesForThisMesh[i]][1];
    animatedCoords[item][2] = (1 - progress) * animatedCoords[item][2] + progress * targetCoords[globalIndicesForThisMesh[i]][2];
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

/*instancedMesh---------------------------------------------------------------*/

const scatterFactorMid = 250;
const scatterFactorIncrement = 50;
const axisTicks = 10;
const axisTickFontSize = 3;

const meshList = {};
let targetCoords;

function Glyphs({ 
  glyphMap, glyphGroup, glyph, model, xcol, xcolAsc, ycol, ycolAsc, zcol, zcolAsc, 
  group, multiClick, clickedItems, setClickedItems, z, 
  vertices, normals, itemSize, s, spreadSlide, scatterFactorMid, scatterFactorIncrement, 
  axisTicks, setXTicks, setYTicks, setZTicks, axisTickFontSize,
  groupColors, raisedItem, setRaisedItem, filter, filterIdxList, invalidateSignal
}) {

  /*
  Each call to `Glyphs` produces glyphs for a single mesh, which are defined by
  a glyph group (for the box glyph, all are in one mesh). I had to do this
  because all items in a mesh must have the same geometry, and I wanted to be
  able to vary geometries in a scene.
  */

  // This is simply a list of global indices for this particular group, the
  // same-geometried items that form this mesh
  const globalIndicesForThisMesh = glyphMap[glyphGroup];

  const meshRef = useRef();
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    
    if ( model === 'grid' ) {

      targetCoords = makeGrid(data, n, xcol, xcolAsc, spreadSlide);

    } else if ( model === 'hist' ) {

      const columnsPerBin = xcol === 'year' ? 3 : 1;
      targetCoords = makeHist(data, xcol, xcolAsc, ycol, ycolAsc, spreadSlide, columnsPerBin);

    } else if ( model === 'scatter' ) {
      
      const { scratchArray, xTickArray, yTickArray, zTickArray } = makeScatter(data, xcol, xcolAsc, ycol, ycolAsc, zcol, zcolAsc, spreadSlide, scatterFactorMid, scatterFactorIncrement, axisTicks, axisTickFontSize);
      
      targetCoords = scratchArray;
      setXTicks(xTickArray);
      setYTicks(yTickArray);

      if ( zcol !== 'none' ) {
        setZTicks(zTickArray);
      }

    } else if ( model === 'gep' ) {

      let gepCoords = spreadSlide === -2 ? 'gep100' : spreadSlide === -1 ? 'gep150' : spreadSlide === 0 ? 'gep200' : spreadSlide === 1 ? 'gep250' : 'gep300';
      targetCoords = cloneDeep(data[gepCoords]); 

    } else if ( model === 'tmap' ) {

      targetCoords = cloneDeep(data['tmap']); 

    }

    if ( raisedItem !== null ) {

      targetCoords[raisedItem][2] = 2

    }

  }, [model, xcol, xcolAsc, ycol, ycolAsc, zcol, zcolAsc, spreadSlide, raisedItem, axisTicks])

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
      interpolatePositions({ globalIndicesForThisMesh, targetCoords }, ctrl.get().animationProgress );
      updatePositions({ globalIndicesForThisMesh, mesh: meshRef.current });
      invalidate();
    },
  }, [model, xcol, xcolAsc, ycol, ycolAsc, zcol, zcolAsc, spreadSlide, raisedItem]);

  useLayoutEffect(() => {

    /*
    This somewhat unassuming line is pretty important. `meshList` is really a
    dictionary where the keys are glyph groups (really, values like '1_0_1' or
    whatever) and the values are direct references to the meshes themselves. We
    need this dictionary in order to reset all the color values below in
    `handleClick`, which we do every single time we click.
    */
    meshList[glyphGroup] = meshRef.current;

    if ( continuousColorCols.includes(group) ) {
      const baseData = data[group];
      if ( group === 'auc' ) {
        colorVals = valToColor(baseData, true)
      } else {
        colorVals = valToColor(baseData);
      }
    } else {
      colorVals = data[group];
      if ( group === 'dmaxHex') {
        colorVals = colorVals.map(d => d === '' ? missingColorTone : d);
      } else if ( group === 'dminHex') {
        colorVals = colorVals.map(d => d === '' ? 0x4a4a4a : d);
      }
    }

    globalIndicesForThisMesh.forEach((item, i) => {
      if ( !clickedItems.includes(item) ) { // so we don't recolor the clicked point
        /*
        `colorVals[item]` returns either a color or a group index. If the former,
        then `groupColors[colorVals[item]]` fails, and we get `colorVals[item]`,
        which again is a color. If the latter, then we get a groupColor, and
        these are generated randomly.
        */
        const colorVal = getColorVal(groupColors,colorVals,item);
        colorSubstrate.set(colorVal);
        applyFilterColors(item, colorSubstrate, filter, group, filterIdxList);
        meshRef.current.setColorAt(i, colorSubstrate);
      } else {
        colorSubstrate.set(highlightColor);
        meshRef.current.setColorAt(i, colorSubstrate);
      }
    });
    meshRef.current.instanceColor.needsUpdate = true;
    invalidate();

  }, [group, groupColors, filter, filterIdxList, invalidateSignal]);

  const handleClick = e => {
    // this appears to select first raycast intersection, but not sure
    e.stopPropagation();

    // instanceId here is an index LOCAL TO THIS MESH of the item we just clicked
    // But we also need the global index of the item we just clicked, hence below
    const { delta, instanceId } = e;
    const globalInstanceId = globalIndicesForThisMesh[instanceId];

    // If the click is followed by mouse movement of sufficient duration, it is
    // not interpreted as a click
    if ( delta <= 5 ) {

      if ( !multiClick ) {
        // full color update every click
        Object.keys(glyphMap).forEach((item, i) => {
          const mesh = meshList[item];
          glyphMap[item].forEach((globalIndex, j) => {
            const colorVal = getColorVal(groupColors,colorVals,globalIndex);
            // if the item we are considering in this loop iteration is not identical to the item we just clicked
            // basically, this case handles items that need to be set to whatever color they had before
            if ( globalInstanceId !== globalIndex ) {
              colorSubstrate.set(colorVal);
              applyFilterColors(globalIndex, colorSubstrate, filter, group, filterIdxList);
              mesh.setColorAt(j, colorSubstrate);
            } else if ( globalInstanceId === globalIndex ) { // loop iteration item IS ALSO the item we just clicked
              if ( !clickedItems.includes(globalInstanceId) ) { // if this item not already clicked, highlight it
                colorSubstrate.set(highlightColor);
                mesh.setColorAt(j, colorSubstrate);
                setClickedItems([globalInstanceId]);
              } else { // if already clicked, unclick
                colorSubstrate.set(colorVal);
                applyFilterColors(globalIndex, colorSubstrate, filter, group, filterIdxList);
                mesh.setColorAt(j, colorSubstrate);
                setClickedItems([]);
                if ( raisedItem !== null && raisedItem === globalInstanceId ) {
                  setRaisedItem(null);
                }
              }
            }
          });
          mesh.instanceColor.needsUpdate = true;
          invalidate();
        });
      } else {
        // full color update every click
        Object.keys(glyphMap).forEach((item, i) => {
          const mesh = meshList[item];
          glyphMap[item].forEach((globalIndex, j) => {
            const colorVal = getColorVal(groupColors,colorVals,globalIndex);
            // if the item we are considering in this loop iteration is not identical to the item we just clicked
            // basically, this case handles items that need to be set to whatever color they had before
            if ( globalInstanceId !== globalIndex ) {
              // if the item we're considering in this loop iteration is not already clicked, set to its normal color
              if ( !clickedItems.includes(globalIndex) ) {
                colorSubstrate.set(colorVal);
                applyFilterColors(globalIndex, colorSubstrate, filter, group, filterIdxList);
                mesh.setColorAt(j, colorSubstrate);
              } else { // but if it is clicked, set to highlight color
                colorSubstrate.set(highlightColor);
                mesh.setColorAt(j, colorSubstrate);
              }
            } else if ( globalInstanceId === globalIndex ) { // loop iteration item IS ALSO the item we just clicked
              if ( !clickedItems.includes(globalInstanceId) ) { // if this item not already clicked, highlight it
                colorSubstrate.set(highlightColor);
                mesh.setColorAt(j, colorSubstrate);
                setClickedItems(clickedItems => [...clickedItems, globalInstanceId]);
              } else { // if already clicked, unclick
                colorSubstrate.set(colorVal);
                applyFilterColors(globalIndex, colorSubstrate, filter, group, filterIdxList);
                mesh.setColorAt(j, colorSubstrate);
                setClickedItems(clickedItems => clickedItems.filter(d => d !== globalInstanceId));
                if ( raisedItem !== null && raisedItem === globalInstanceId ) {
                  setRaisedItem(null);
                }
              }
            }
          });
          mesh.instanceColor.needsUpdate = true;
          invalidate();
        });
      }
    }
  }

  if ( glyph === 'box' ) {
    return (
      <instancedMesh ref={meshRef} args={[null, null, n]} onClick={handleClick} name={glyphGroup} >
        <boxBufferGeometry args={[0.75, 0.75, 0.75]}></boxBufferGeometry>
        <meshStandardMaterial attach="material" />
      </instancedMesh>
    )
  } else if ( glyph === 'exp' ) {
    return (
      <instancedMesh ref={meshRef} args={[null, null, glyphMap[glyphGroup].length]} onClick={handleClick} name={glyphGroup} >
        <boxBufferGeometry args={[s, s, s]}></boxBufferGeometry>
        <meshStandardMaterial attach="material"/>
      </instancedMesh>
    )
  } else if ( glyph === 'iso' ) {
    return (
      <instancedMesh ref={meshRef} args={[null, null, glyphMap[glyphGroup].length]} onClick={handleClick} name={glyphGroup} >
        <boxBufferGeometry args={[0.75, 0.75, z]}></boxBufferGeometry>
        <meshStandardMaterial attach="material"/>
      </instancedMesh>
    )
  } else if ( glyph === 'radar' ) {
    return (
      <instancedMesh ref={meshRef} args={[null, null, glyphMap[glyphGroup].length]} onClick={handleClick} name={glyphGroup} >
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
        <meshStandardMaterial attach="material" side={DoubleSide}/>
      </instancedMesh>
    )
  }
}

/*Text------------------------------------------------------------------------*/

export const glyphToMap = {
  'box':boxMap,
  'exp':expressivenessMap,
  'iso':isoMap,
  'radar':radarMap
}

export function getDetailImageString(texture,backprintImage,i) {
  let catalog = data['catalog'][i];
  catalog = catalog.includes('1860') ? '1860' : catalog;
  
  const sb = data['sb'][i];
  const detailFolder = texture ? 'texture/' : backprintImage ? 'backprints_detail/bp' : sb === '1' ? 'samplebooks_2048/' : 'packages_2048/'; 
  const detailImgString = returnDomain() + detailFolder + catalog + '.jpg';

  return detailImgString;
}

/*App-------------------------------------------------------------------------*/

let sliderKey = 0; // a hack to reset all sliders with `removeAllFilters`

export default function App() {
  const [boxSelectMode, setBoxSelectMode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const [model, setModel] = useState('grid');
  const [xcol, setXcol] = useState('dmin');
  const [ycol, setYcol] = useState('thickness');
  const [zcol, setZcol] = useState('none');
  const [xcolAsc, setXcolAsc] = useState(true);
  const [ycolAsc, setYcolAsc] = useState(true);
  const [zcolAsc, setZcolAsc] = useState(true);
  const [group, setGroup] = useState('dminHex');
  const [xTicks, setXTicks] = useState(null);
  const [yTicks, setYTicks] = useState(null);
  const [zTicks, setZTicks] = useState(null);
  
  const [clickedItems, setClickedItems] = useState([]);
  const [multiClick, setMultiClick] = useState(false);
  const [gridMode, setGridMode] = useState(false);
  const [textLength, setTextLength] = useState(2);
  const [infoPanelFontSize, setInfoPanelFontSize] = useState(3);
  const [smallItem, setSmallItem] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(false);
  const [texture, setTexture] = useState(false);
  const [svgRadar, setSvgRadar] = useState(false);
  const [packageImage, setPackageImage] = useState(false);
  const [backprintImage, setBackprintImage] = useState(false);
  const [glyph, setGlyph] = useState('box');
  const [spreadSlide, setSpreadSlide] = useState(0);
  const [groupColors, setGroupColors] = useState(initialGroupColors);
  const [raisedItem, setRaisedItem] = useState(null);
  const itemSize = 3;

  const [filter, setFilter] = useState(false);
  const [filterList, setFilterList] = useState({
    'sb':[],
    'year':[],
    'man':[],
    'bran':[],
    'thickness':[],
    'thicknessWord':[],
    'dmin':[],
    'colorWord':[],
    'roughness':[],
    'textureWord':[],
    'gloss':[],
    'glossWord':[],
    'auc':[],
    'expressiveness':[],
    'processing':[],
    'backp':[],
    'surf':[],
    'resin':[],
    'toner':[],
    'postcard':[],
    'circa':[],
    'sbid':[]
  });
  const [filterIdxList, setFilterIdxList] = useState([]);
  const [filterModal, setFilterModal] = useState('closed');
  const [manExpand, setManExpand] = useState(false);
  const [branExpand, setBranExpand] = useState(false);
  const [surfExpand, setSurfExpand] = useState(false);
  const [sbidExpand, setSbidExpand] = useState(false);
  const [yearSlide, setYearSlide] = useState([yearMin,yearMax]);
  const [thicknessSlide, setThicknessSlide] = useState([thicknessMin,thicknessMax]);
  const [colorSlide, setColorSlide] = useState([colorMin,colorMax]);
  const [toneSlide, setToneSlide] = useState([toneMin,toneMax]);
  const [roughnessSlide, setRoughnessSlide] = useState([roughnessMin,roughnessMax]);
  const [glossSlide, setGlossSlide] = useState([glossMin,glossMax]);
  const [uvSlide, setUvSlide] = useState([uvMin,uvMax]);
  const [expSlide, setExpSlide] = useState([expMin,expMax]);
  
  const [yearSlideMarks, setYearSlideMarks] = useState(null);
  const [thicknessSlideMarks, setThicknessSlideMarks] = useState(null);
  const [colorSlideMarks, setColorSlideMarks] = useState(null);
  const [toneSlideMarks, setToneSlideMarks] = useState(null);
  const [roughnessSlideMarks, setRoughnessSlideMarks] = useState(null);
  const [glossSlideMarks, setGlossSlideMarks] = useState(null);
  const [uvSlideMarks, setUvSlideMarks] = useState(null);
  const [expSlideMarks, setExpSlideMarks] = useState(null);
  
  const [filteredThicknessFrequencies, setFilteredThicknessFrequencies] = useState(thicknessValCounts);
  const [filteredColorFrequencies, setFilteredColorFrequencies] = useState(colorValCounts);
  const [filteredTextureFrequencies, setFilteredTextureFrequencies] = useState(textureValCounts);
  const [filteredGlossFrequencies, setFilteredGlossFrequencies] = useState(glossValCounts);
  const [filteredManFrequencies, setFilteredManFrequencies] = useState(manValCounts);
  const [filteredBranFrequencies, setFilteredBranFrequencies] = useState(branValCounts);
  const [filteredCollFrequencies, setFilteredCollFrequencies] = useState(collValCounts);
  
  const [filteredProcessingFrequencies, setFilteredProcessingFrequencies] = useState(processingValCounts);
  const [filteredBackpFrequencies, setFilteredBackpFrequencies] = useState(backpValCounts);
  const [filteredSurfFrequencies, setFilteredSurfFrequencies] = useState(surfValCounts);
  const [filteredResinFrequencies, setFilteredResinFrequencies] = useState(resinValCounts);
  const [filteredTonerFrequencies, setFilteredTonerFrequencies] = useState(tonerValCounts);
  const [filteredPostcardFrequencies, setFilteredPostcardFrequencies] = useState(postcardValCounts);
  const [filteredCircaFrequencies, setFilteredCircaFrequencies] = useState(circaValCounts);
  const [filteredSbidFrequencies, setFilteredSbidFrequencies] = useState(sbidValCounts);

  const [detailScreen,setDetailScreen] = useState(false);
  const [detailImageStringState,setDetailImageStringState] = useState('');
  const [detailImageIndex, setDetailImageIndex] = useState('');
  const [packageImageIndex, setPackageImageIndex] = useState(0);
  const [invalidateSignal, setInvalidateSignal] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // key code constants
  const ALT_KEY = 18;
  const CTRL_KEY = 17;
  const CMD_KEY = 91;

  const exprStringToFloat = ebin => {
    return ebin / 10
  };

  const orbitRef = useRef();
  const selectionDivRef = useRef();

  useEffect(() => {
    if (selectionDivRef.current) {
      selectionDivRef.current.style.position = 'absolute';
      selectionDivRef.current.style.border = '4px dashed #FFF';
    }
  }, []);

  useLayoutEffect(() => {

    const workingIdxList = filterIdxList.length === 0 && filter ? [] : filterIdxList.length === 0 && !filter ? data['catalog'].map((_,i) => i) : filterIdxList;

    const filteredThicknessValCounts = valueCounts(data['thicknessWord'].filter((_,i) => workingIdxList.includes(i)));
    const filteredColorValCounts = valueCounts(data['colorWord'].filter((_,i) => workingIdxList.includes(i)));
    const filteredTextureValCounts = valueCounts(data['textureWord'].filter((_,i) => workingIdxList.includes(i)));
    const filteredGlossValCounts = valueCounts(data['glossWord'].filter((_,i) => workingIdxList.includes(i)));
    const filteredManValCounts = valueCounts(data['man'].filter((_,i) => workingIdxList.includes(i)));
    const filteredBranValCounts = valueCounts(data['bran'].filter((_,i) => workingIdxList.includes(i)));
    const filteredCollValCounts = valueCounts(data['sb'].filter((_,i) => workingIdxList.includes(i)));

    const filteredProcessingValCounts = valueCounts(data['processing'].filter((_,i) => workingIdxList.includes(i)));
    const filteredBackpValCounts = valueCounts(data['backp'].filter((_,i) => workingIdxList.includes(i)));
    const filteredSurfValCounts = valueCounts(data['surf'].filter((_,i) => workingIdxList.includes(i)));
    const filteredResinValCounts = valueCounts(data['resin'].filter((_,i) => workingIdxList.includes(i)));
    const filteredTonerValCounts = valueCounts(data['toner'].filter((_,i) => workingIdxList.includes(i)));
    const filteredPostcardValCounts = valueCounts(data['postcard'].filter((_,i) => workingIdxList.includes(i)));
    const filteredCircaValCounts = valueCounts(data['circa'].filter((_,i) => workingIdxList.includes(i)));
    const filteredSbidValCounts = valueCounts(data['sbid'].filter((_,i) => workingIdxList.includes(i)));

    setFilteredThicknessFrequencies(filteredThicknessValCounts);
    setFilteredColorFrequencies(filteredColorValCounts);    
    setFilteredTextureFrequencies(filteredTextureValCounts);
    setFilteredGlossFrequencies(filteredGlossValCounts);
    setFilteredManFrequencies(filteredManValCounts);
    setFilteredBranFrequencies(filteredBranValCounts);
    setFilteredCollFrequencies(filteredCollValCounts);

    setFilteredProcessingFrequencies(filteredProcessingValCounts);
    setFilteredBackpFrequencies(filteredBackpValCounts);
    setFilteredSurfFrequencies(filteredSurfValCounts);
    setFilteredResinFrequencies(filteredResinValCounts);
    setFilteredTonerFrequencies(filteredTonerValCounts);
    setFilteredPostcardFrequencies(filteredPostcardValCounts);
    setFilteredCircaFrequencies(filteredCircaValCounts);
    setFilteredSbidFrequencies(filteredSbidValCounts);

    const filteredYears = data['year'].filter((_,i) => workingIdxList.includes(i));
    const filteredThicknesses = data['thickness'].filter((_,i) => workingIdxList.includes(i));
    const filteredColors = data['dmin'].filter((_,i) => workingIdxList.includes(i));
    const filteredTones = data['dmax'].filter((_,i) => workingIdxList.includes(i));
    const filteredRoughnesses = data['roughness'].filter((_,i) => workingIdxList.includes(i));
    const filteredGlosses = data['gloss'].filter((_,i) => workingIdxList.includes(i));
    const filteredUvs = data['auc'].filter((_,i) => workingIdxList.includes(i));
    const filteredExps = data['expressiveness'].filter((_,i) => workingIdxList.includes(i));

    const filteredYearsMin = min(filteredYears);
    const filteredYearsMax = max(filteredYears);
    const filteredThicknessesMin = min(filteredThicknesses);
    const filteredThicknessesMax = max(filteredThicknesses);
    const filteredColorsMin = min(filteredColors);
    const filteredColorsMax = max(filteredColors);
    const filteredTonesMin = min(filteredTones);
    const filteredTonesMax = max(filteredTones);
    const filteredRoughnessesMin = min(filteredRoughnesses);
    const filteredRoughnessesMax = max(filteredRoughnesses);
    const filteredGlossesMin = min(filteredGlosses);
    const filteredGlossesMax = max(filteredGlosses);
    const filteredUvsMin = min(filteredUvs);
    const filteredUvsMax = max(filteredUvs);
    const filteredExpsMin = min(filteredExps);
    const filteredExpsMax = max(filteredExps);

    if ( filteredYearsMin == null || filteredYearsMax == null ) {
      setYearSlideMarks(null);
    } else {
      setYearSlideMarks([{value: filteredYearsMin, label: filteredYearsMin.toString()},{value: filteredYearsMax, label: filteredYearsMax.toString()}])
    }

    if ( filteredThicknessesMin == null || filteredThicknessesMax == null ) {
      setThicknessSlideMarks(null);
    } else {
      setThicknessSlideMarks([{value: filteredThicknessesMin, label: filteredThicknessesMin.toString()},{value: filteredThicknessesMax, label: filteredThicknessesMax.toString()}])
    }

    if ( filteredColorsMin == null || filteredColorsMax == null ) {
      setColorSlideMarks(null);
    } else {
      setColorSlideMarks([{value: filteredColorsMin, label: filteredColorsMin.toString()},{value: filteredColorsMax, label: filteredColorsMax.toString()}])
    }

    if ( filteredTonesMin == null || filteredTonesMax == null ) {
      setToneSlideMarks(null);
    } else {
      setToneSlideMarks([{value: filteredTonesMin, label: filteredTonesMin.toString()},{value: filteredTonesMax, label: filteredTonesMax.toString()}])
    }

    if ( filteredRoughnessesMin == null || filteredRoughnessesMax == null ) {
      setRoughnessSlideMarks(null);
    } else {
      setRoughnessSlideMarks([{value: filteredRoughnessesMin, label: filteredRoughnessesMin.toString()},{value: filteredRoughnessesMax, label: filteredRoughnessesMax.toString()}])
    }

    if ( filteredGlossesMin == null || filteredGlossesMax == null ) {
      setGlossSlideMarks(null);
    } else {
      setGlossSlideMarks([{value: filteredGlossesMin, label: filteredGlossesMin.toString()},{value: filteredGlossesMax, label: filteredGlossesMax.toString()}])
    }

    if ( filteredUvsMin == null || filteredUvsMax == null ) {
      setUvSlideMarks(null);
    } else {
      setUvSlideMarks([{value: filteredUvsMin, label: filteredUvsMin.toString()},{value: filteredUvsMax, label: filteredUvsMax.toString()}])
    }

    if ( filteredExpsMin == null || filteredExpsMax == null ) {
      setExpSlideMarks(null);
    } else {
      setExpSlideMarks([{value: filteredExpsMin, label: filteredExpsMin.toString()},{value: filteredExpsMax, label: filteredExpsMax.toString()}])
    }
    
  },[filterIdxList]);
  
  const handleDetailScreenNav = e => {

    console.log('handleDetailScreenNav');

    e.stopPropagation();
    const label = e.target.innerText;
    const clickedItemsPositionIndex = clickedItems.findIndex(d => d === detailImageIndex);

    let newClickedItemsPositionIndex;
    if ( label === 'keyboard_arrow_left' ) {
      newClickedItemsPositionIndex = clickedItemsPositionIndex - 1;
    } else if ( label === 'keyboard_arrow_right' ) {
      newClickedItemsPositionIndex = clickedItemsPositionIndex + 1;
    }

    if ( newClickedItemsPositionIndex >= 0 && newClickedItemsPositionIndex <= clickedItems.length - 1 ) {
      const newDetailImageIndex = clickedItems[newClickedItemsPositionIndex];
      setDetailImageIndex(newDetailImageIndex);
      setPackageImageIndex(0);

      const newDetailImageString = getDetailImageString(texture,backprintImage,newDetailImageIndex);
      setDetailImageStringState(newDetailImageString);
    }
  }

  const handlePackageImages = e => {

    console.log('handlePackageImages');

    e.stopPropagation();

    const suffs = data['suffs'][detailImageIndex];
    const suffsArr = suffs.split('|');
    suffsArr.unshift('');
    const catalog = data['catalog'][detailImageIndex];
    const packageImageArray = suffsArr.map(suff => returnDomain() + 'packages_2048/' + catalog + suff + '.jpg');

    const label = e.target.innerText;
    let newPackageImageIndex;

    if ( label === 'keyboard_arrow_up' ) {
      newPackageImageIndex = packageImageIndex - 1;
    } else if ( label === 'keyboard_arrow_down' ) {
      newPackageImageIndex = packageImageIndex + 1;
    }

    if ( newPackageImageIndex >= 0 && newPackageImageIndex <= packageImageArray.length - 1 ) {
      setDetailImageStringState(packageImageArray[newPackageImageIndex]);
      setPackageImageIndex(newPackageImageIndex);
    }
  }

  const sliderMap = {
    'year':[yearSlide,yearMin,yearMax],
    'thickness':[thicknessSlide,thicknessMin,thicknessMax],
    'dmin':[colorSlide,colorMin,colorMax],
    'dmax':[toneSlide,toneMin,toneMax],
    'roughness':[roughnessSlide,roughnessMin,roughnessMax],
    'gloss':[glossSlide,glossMin,glossMax],
    'auc':[uvSlide,uvMin,uvMax],
    'expressiveness':[expSlide,expMin,expMax]
  };

  const handleSliderFilter = e => {
    e.stopPropagation();
    
    const newFilterIdxList = applyFilterList(filterList); // filterList itself doesn't change here, so no need to setFilterList
    setFilterIdxList(newFilterIdxList);
    
    // if all sliders are back to their extrema, then set filter to false
    if ( yearSlide[0] === yearMin && yearSlide[1] === yearMax &&
      thicknessSlide[0] === thicknessMin && thicknessSlide[1] === thicknessMax &&
      colorSlide[0] === colorMin && colorSlide[1] === colorMax &&
      toneSlide[0] === toneMin && toneSlide[1] === toneMax &&
      roughnessSlide[0] === roughnessMin && roughnessSlide[1] === roughnessMax &&
      glossSlide[0] === glossMin && glossSlide[1] === glossMax &&
      uvSlide[0] === uvMin && uvSlide[1] === uvMax &&
      expSlide[0] === expMin && expSlide[1] === expMax &&
      Object.values(filterList).every(d => d.length === 0) ) {
        setFilter(false);
      } else {
        setFilter(true);
    }
    setInvalidateSignal(!invalidateSignal);
  };

  const handleFilter = e => {
    e.stopPropagation();

    const dataCat = e.target.getAttribute('data-cat');
    const dataVal = e.target.getAttribute('data-val');

    const alreadyInFilterList = filterList[dataCat].includes(dataVal);
    let newFilterList = {...filterList};

    if ( alreadyInFilterList ) {
      newFilterList[dataCat] = newFilterList[dataCat].filter(d => d !== dataVal); // remove from filter
    } else {
      newFilterList[dataCat].push(dataVal); // add to filter
    }

    const newFilterIdxList = applyFilterList(newFilterList);

    setFilterIdxList(newFilterIdxList);
    setFilterList(newFilterList);

    // if filterList is empty and the sliders are all at their extrema, then set filter to false
    if ( Object.values(newFilterList).every(d => d.length === 0 ) &&
      yearSlide[0] === yearMin && yearSlide[1] === yearMax &&
      thicknessSlide[0] === thicknessMin && thicknessSlide[1] === thicknessMax &&
      colorSlide[0] === colorMin && colorSlide[1] === colorMax &&
      toneSlide[0] === toneMin && toneSlide[1] === toneMax &&
      roughnessSlide[0] === roughnessMin && roughnessSlide[1] === roughnessMax &&
      glossSlide[0] === glossMin && glossSlide[1] === glossMax &&
      uvSlide[0] === uvMin && uvSlide[1] === uvMax &&
      expSlide[0] === expMin && expSlide[1] === expMax ) {
      setFilter(false);
    } else {
      setFilter(true);
    }
  }

  function applyFilterList( newFilterList ) {

    // collect keepers for each slider
    let allKeeperLists = [];
    Object.keys(sliderMap).forEach(col => {
      const sliderVal = sliderMap[col][0];
      const sliderMin = sliderMap[col][1];
      const sliderMax = sliderMap[col][2];
      
      /*
      There is a sublety here. If the slider is at its extrema, then we don't want to filter on it.
      Why? Because the dataset is ultimately filtered on the *intersection* of all filters. Thus, if,
      say, we are missing a year value for some item, filtering on the year extrema will remove that
      item from the filtered dataset. But if the user hasn't set a year filter, why should we eliminate
      that item? This has the effect, for example, of leaving out any Man Ray prints that are missing
      a year value when we filter on "Man Ray": they don't make it to the "year" list, and thus they don't
      make it to the final list, because in order to make it to the final list, you have to appear on all lists.
      But if all the user wants is to see the Man Ray prints, she doesn't care that some of them are missing
      a year value. She will only care about that if she has set a year filter. 
      */

      if ( sliderVal[0] !== sliderMin || sliderVal[1] !== sliderMax ) {
        const keepersForThisSlider = [];
        data[col].forEach((d,i) => {
          if ( !isNaN(d) && d >= sliderVal[0] && d <= sliderVal[1] ) {
            keepersForThisSlider.push(i);
          }});
        allKeeperLists = [...allKeeperLists,keepersForThisSlider];
      }
    });

    // get intersection of all keepers
    let keepers = intersection(...allKeeperLists);
    
    // if no sliders are set, then keepers will be empty. In that case, we want to keep all items.
    if ( keepers.length === 0 ) {
      keepers = data['catalog'].map((_,i) => i);
    }

    let newFilterIdxList = [];

    // this is getting OR for each filter category
    Object.keys(newFilterList).forEach((cat, i) => {
      let catList = []; // probably not necessary to initialize as a list but whatevs
      if ( newFilterList[cat].length === 0 ) {
        catList = data['sb'].map((_,i) => i).filter(d => keepers.includes(d));
      } else {
        data[cat].forEach((val, i) => {
          if ( newFilterList[cat].includes(val) && keepers.includes(i) ) {
            catList.push(i);
          }
        });
      }
      newFilterIdxList = [...newFilterIdxList,catList];
    });
    // this is getting AND for all filter categories
    newFilterIdxList = intersection(...newFilterIdxList);
    return newFilterIdxList;
  }
  
  const handleFilterToSelection = (e) => {
    e.stopPropagation();
    const addMode = e.target.innerText;

    filterIdxList.sort(function(a, b) {
      return a - b;
    });

    if ( addMode === 'queue' ) {
      setClickedItems(clickedItems => [...clickedItems,...filterIdxList]);
      setInvalidateSignal(!invalidateSignal);
    } else if ( addMode === 'open_in_new' ) {
      setClickedItems(filterIdxList);
      setInvalidateSignal(!invalidateSignal);
    }
    setMultiClick(true);
  }

  const removeAllFilters = () => {

    setFilterIdxList([]);
    
    setFilterList({
      'sb':[],
      'year':[],
      'man':[],
      'bran':[],
      'thickness':[],
      'thicknessWord':[],
      'dmin':[],
      'dmax':[],
      'colorWord':[],
      'roughness':[],
      'textureWord':[],
      'gloss':[],
      'glossWord':[],
      'auc':[],
      'expressiveness':[],
      'processing':[],
      'backp':[],
      'surf':[],
      'resin':[],
      'toner':[],
      'postcard':[],
      'circa':[],
      'sbid':[]
    });
    
    setFilter(false);

    setYearSlide([yearMin,yearMax]);
    setThicknessSlide([thicknessMin,thicknessMax]);
    setColorSlide([colorMin,colorMax]);
    setToneSlide([toneMin,toneMax]);
    setRoughnessSlide([roughnessMin,roughnessMax]);
    setGlossSlide([glossMin,glossMax]);
    setUvSlide([uvMin,uvMax]);
    setExpSlide([expMin,expMax]);
    sliderKey+=1;

  };

  useEffect(() => {
    if ( detailScreen ) {
      function advanceNav(e) {
        e.preventDefault();
        
        const keyCode = e.keyCode;
        const clickedItemsPositionIndex = clickedItems.findIndex(d => d === detailImageIndex);
        let newClickedItemsPositionIndex;
        let newPackageImageIndex;
        
        if ( keyCode === 37 ) { // left arrow
          newClickedItemsPositionIndex = clickedItemsPositionIndex - 1;
        } else if ( keyCode === 39 ) { // right arrow
          newClickedItemsPositionIndex = clickedItemsPositionIndex + 1;
        } else if ( keyCode === 38 ) { // up arrow
          newPackageImageIndex = packageImageIndex - 1;
        } else if ( keyCode === 40 ) { // down arrow
          newPackageImageIndex = packageImageIndex + 1;
        }

        if ( newClickedItemsPositionIndex !== undefined ) {
          console.log('new clicked items position index');
          if ( newClickedItemsPositionIndex >= 0 && newClickedItemsPositionIndex <= clickedItems.length - 1 ) {
          const newDetailImageIndex = clickedItems[newClickedItemsPositionIndex];
          setDetailImageIndex(newDetailImageIndex);
          setPackageImageIndex(0);

          const newDetailImageString = getDetailImageString(texture,backprintImage,newDetailImageIndex);
          setDetailImageStringState(newDetailImageString);
        }
      }

        if ( newPackageImageIndex !== undefined && detailImageStringState.includes('packages_') ) {
          console.log('new package image index');
          const suffs = data['suffs'][detailImageIndex];
          const suffsArr = suffs.split('|');
          suffsArr.unshift('');
          const catalog = data['catalog'][detailImageIndex];
          const packageImageArray = suffsArr.map(suff => returnDomain() + 'packages_2048/' + catalog + suff + '.jpg');

          if ( newPackageImageIndex >= 0 && newPackageImageIndex <= packageImageArray.length - 1 ) {
            setDetailImageStringState(packageImageArray[newPackageImageIndex]);
            setPackageImageIndex(newPackageImageIndex);
          }
        }
      }

      document.addEventListener("keydown", advanceNav);

      return function cleanup() {
      document.removeEventListener("keydown", advanceNav);
    };
  }
},[detailScreen, detailImageIndex, packageImageIndex])

useEffect(() => {
  if ( zcol === 'none' ) {
    setZTicks(null);
  }
} ,[zcol]);

  return (
    <div id='app'>
      <div className={isDragging ? 'noPointerEvents controls' : 'controls'} id='multiClick'>
        <div id="panelStructure">
          {gridMode && <button title='switch to list mode' className={'material-icons active'} onClick={() => {setGridMode(false);smallItem && setSmallItem(false)}} >list</button>}
          {!gridMode && <button title='switch to grid mode' className={'material-icons'} onClick={() => setGridMode(true)} >grid_view</button>}
          {smallItem && <button title='switch to normal item size' className={'material-icons active'} onClick={() => setSmallItem(false)} >photo_size_select_actual</button>}
          {!smallItem && <button title='switch to small item size' className={'material-icons'} onClick={() => gridMode && setSmallItem(true)} >photo_size_select_large</button>}
        </div>
        <div id="panelFill">
          <button title='add paper color to background' className={backgroundColor ? 'material-icons active' : 'material-icons'} onClick={() => {setBackgroundColor(!backgroundColor); texture && setTexture(false); packageImage && setPackageImage(false); svgRadar && setSvgRadar(false); backprintImage && setBackprintImage(false)}} >format_color_fill</button>
          <button title='add paper texture to background' className={texture ? 'material-icons active' : 'material-icons'} onClick={() => {setTexture(!texture); backgroundColor && setBackgroundColor(false); packageImage && setPackageImage(false); svgRadar && setSvgRadar(false); backprintImage && setBackprintImage(false)}} >texture</button>
          <button title='add package image to background' className={packageImage ? 'material-icons active' : 'material-icons'} onClick={() => {setPackageImage(!packageImage); backgroundColor && setBackgroundColor(false); texture && setTexture(false); svgRadar && setSvgRadar(false); backprintImage && setBackprintImage(false)}} >image</button>
          <button title='add backprint image to background' className={backprintImage ? 'material-icons active' : 'material-icons'} onClick={() => {setBackprintImage(!backprintImage); backgroundColor && setBackgroundColor(false); texture && setTexture(false); svgRadar && setSvgRadar(false); packageImage && setPackageImage(false)}} >fingerprint</button>
          <button title='add radar glyph to background' className={svgRadar ? 'material-icons active' : 'material-icons'} onClick={() => {setSvgRadar(!svgRadar); backgroundColor && setBackgroundColor(false); texture && setTexture(false); packageImage && setPackageImage(false); backprintImage && setBackprintImage(false)}} >radar</button>
        </div>
        <div id="panelText">
          <button title='change text length' className='material-icons' onClick={() => setTextLength(textLength => (textLength + 1) % 3)}>short_text</button>
          <button title='change font size' className='material-icons' onClick={() => setInfoPanelFontSize(infoPanelFontSize => (infoPanelFontSize % 3) + 1)}>format_size</button>
        </div>
        <div id="panelSelection">
          <button title='multi-select mode' className={multiClick ? 'material-icons active' : 'material-icons'} onClick={() => setMultiClick(!multiClick)} >done_all</button>
          <button title='clear selection' className='material-icons' onClick={() => {setInvalidateSignal(!invalidateSignal); setClickedItems([]); setRaisedItem(null)}} >delete_sweep</button>
          <Download data={data} idxList={clickedItems} etitle="download selected data as CSV" />
          <div title='number of selected items' className='countPrint' id="panelCount">{clickedItems.length === 0 ? data['catalog'].length : clickedItems.length}</div>
        </div>
      </div>
      <div id='infoPanel' className={isDragging && gridMode ? 'grid noPointerEvents' : !isDragging && gridMode ? 'grid' : isDragging ? 'list noPointerEvents' : 'list'}>
        {clickedItems.map((clickedItem,i) => <PanelItem
                                                data={data}
                                                meshList={meshList}
                                                colorVals={colorVals}
                                                clickedItem={clickedItem}
                                                clickedItems={clickedItems}
                                                setClickedItems={setClickedItems}
                                                multiClick={multiClick}
                                                glyph={glyph}
                                                groupColors={groupColors}
                                                textLength={textLength}
                                                raisedItem={raisedItem}
                                                setRaisedItem={setRaisedItem}
                                                gridMode={gridMode}
                                                infoPanelFontSize={infoPanelFontSize}
                                                backgroundColor={backgroundColor}
                                                texture={texture}
                                                packageImage={packageImage}
                                                backprintImage={backprintImage}
                                                svgRadar={svgRadar}
                                                smallItem={smallItem}
                                                key={i}
                                                detailScreen={detailScreen}
                                                setDetailScreen={setDetailScreen}
                                                detailImageStringState={detailImageStringState}
                                                setDetailImageStringState={setDetailImageStringState}
                                                setDetailImageIndex={setDetailImageIndex}
                                                setPackageImageIndex={setPackageImageIndex}
                                                filter={filter}
                                                group={group}
                                                filterIdxList={filterIdxList}
                                                invalidateSignal={invalidateSignal}
                                                setInvalidateSignal={setInvalidateSignal}
                                               />
                                             )}
      </div>
      <div id='viewpane' onMouseDown={handleDragStart} onMouseUp={handleDragEnd}>
        <Canvas
          dpr={[1, 2]} 
          camera={{ position: [0,0,75], far: 4000 }} 
          frameloop="demand"
        >
          <color attach="background" args={[0x4a4a4a]} />
          <ambientLight intensity={0.5}/>
          <pointLight position={[0, 0, 135]} intensity={0.5}/>
          {model === 'scatter' && <axesHelper args={[1000]} />}
          {glyph==='box' && boxGroupArray.map((d,i) => {
            return <Glyphs
                      key={i}
                      glyphMap={boxMap}
                      glyphGroup={d}
                      glyph={glyph}
                      model={model}
                      xcol={xcol}
                      xcolAsc={xcolAsc}
                      ycol={ycol}
                      ycolAsc={ycolAsc}
                      zcol={zcol}
                      zcolAsc={zcolAsc}
                      group={group}
                      multiClick={multiClick}
                      clickedItems={clickedItems}
                      setClickedItems={setClickedItems}
                      z={null}
                      vertices={null}
                      normals={null}
                      itemSize={null}
                      s={null}
                      spreadSlide={spreadSlide}
                      scatterFactorMid={scatterFactorMid}
                      scatterFactorIncrement={scatterFactorIncrement}
                      axisTicks={axisTicks}
                      setXTicks={setXTicks}
                      setYTicks={setYTicks}
                      setZTicks={setZTicks}
                      axisTickFontSize={axisTickFontSize}
                      groupColors={groupColors}
                      raisedItem={raisedItem}
                      setRaisedItem={setRaisedItem}
                      filter={filter}
                      filterIdxList={filterIdxList}
                      invalidateSignal={invalidateSignal}
                      handleDragStart={handleDragStart}
                      handleDragEnd={handleDragEnd}
                     />
          })}
          {glyph==='exp' && expressivenessGroupArray.map((d,i) => {
            return <Glyphs
                      key={i}
                      glyphMap={expressivenessMap}
                      glyphGroup={d}
                      glyph={glyph}
                      model={model}
                      xcol={xcol}
                      xcolAsc={xcolAsc}
                      ycol={ycol}
                      ycolAsc={ycolAsc}
                      zcol={zcol}
                      zcolAsc={zcolAsc}
                      group={group}
                      multiClick={multiClick}
                      clickedItems={clickedItems}
                      setClickedItems={setClickedItems}
                      z={null}
                      vertices={null}
                      normals={null}
                      itemSize={null}
                      s={exprStringToFloat(d)}
                      spreadSlide={spreadSlide}
                      scatterFactorMid={scatterFactorMid}
                      scatterFactorIncrement={scatterFactorIncrement}
                      axisTicks={axisTicks}
                      setXTicks={setXTicks}
                      setYTicks={setYTicks}
                      setZTicks={setZTicks}
                      axisTickFontSize={axisTickFontSize}
                      groupColors={groupColors}
                      raisedItem={raisedItem}
                      setRaisedItem={setRaisedItem}
                      filter={filter}
                      filterIdxList={filterIdxList}
                      invalidateSignal={invalidateSignal}
                      handleDragStart={handleDragStart}
                      handleDragEnd={handleDragEnd}
                     />
          })}
          {glyph==='iso' && isoGroupArray.map((d,i) => {
            return <Glyphs
                      key={i}
                      glyphMap={isoMap}
                      glyphGroup={d}
                      glyph={glyph}
                      model={model}
                      xcol={xcol}
                      xcolAsc={xcolAsc}
                      ycol={ycol}
                      ycolAsc={ycolAsc}
                      zcol={zcol}
                      zcolAsc={zcolAsc}
                      group={group}
                      multiClick={multiClick}
                      clickedItems={clickedItems}
                      setClickedItems={setClickedItems}
                      z={zArray[i]}
                      vertices={null}
                      normals={null}
                      itemSize={null}
                      s={null}
                      spreadSlide={spreadSlide}
                      scatterFactorMid={scatterFactorMid}
                      scatterFactorIncrement={scatterFactorIncrement}
                      axisTicks={axisTicks}
                      setXTicks={setXTicks}
                      setYTicks={setYTicks}
                      setZTicks={setZTicks}
                      axisTickFontSize={axisTickFontSize}
                      groupColors={groupColors}
                      raisedItem={raisedItem}
                      setRaisedItem={setRaisedItem}
                      filter={filter}
                      filterIdxList={filterIdxList}
                      invalidateSignal={invalidateSignal}
                      handleDragStart={handleDragStart}
                      handleDragEnd={handleDragEnd}
                     />
          })}
          {glyph==='radar' && radarGroupArray.map((d,i) => {
            return <Glyphs
                      key={i}
                      glyphMap={radarMap}
                      glyphGroup={d}
                      glyph={glyph}
                      model={model}
                      xcol={xcol}
                      xcolAsc={xcolAsc}
                      ycol={ycol}
                      ycolAsc={ycolAsc}
                      zcol={zcol}
                      zcolAsc={zcolAsc}
                      group={group}
                      multiClick={multiClick}
                      clickedItems={clickedItems}
                      setClickedItems={setClickedItems}
                      z={null}
                      vertices={radarVertices(d)}
                      normals={radarNormals(d)}
                      itemSize={itemSize}
                      s={null}
                      spreadSlide={spreadSlide}
                      scatterFactorMid={scatterFactorMid}
                      scatterFactorIncrement={scatterFactorIncrement}
                      axisTicks={axisTicks}
                      setXTicks={setXTicks}
                      setYTicks={setYTicks}
                      setZTicks={setZTicks}
                      axisTickFontSize={axisTickFontSize}
                      groupColors={groupColors}
                      raisedItem={raisedItem}
                      setRaisedItem={setRaisedItem}
                      filter={filter}
                      filterIdxList={filterIdxList}
                      invalidateSignal={invalidateSignal}
                      handleDragStart={handleDragStart}
                      handleDragEnd={handleDragEnd}
                     />
          })}
          {model === 'scatter' && xTicks && xTicks.map((d,i) => {
            return  <Text
                      key={i}
                      position={d.pos}
                      fontSize={axisTickFontSize}
                      color={'#fff'}
                      anchorX={'center'}
                      anchorY={'middle'}
                      > 
                      {d.label}
                    </Text>
          })}
          {model === 'scatter' && yTicks && yTicks.map((d,i) => {
            return  <Text
                      key={i}
                      position={d.pos}
                      fontSize={axisTickFontSize}
                      color={'#fff'}
                      anchorX={'center'}
                      anchorY={'middle'}
                      > 
                      {d.label}
                    </Text>
          })}
          {model === 'scatter' && zTicks && zTicks.map((d,i) => {
            return  <Text
                      key={i}
                      position={d.pos}
                      fontSize={axisTickFontSize}
                      color={'#fff'}
                      anchorX={'center'}
                      anchorY={'middle'}
                      rotation={[0,Math.PI / 2,0]}
                      > 
                      {d.label}
                    </Text>
          })}
          <OrbitControls
            ref={orbitRef}
            maxDistance={4000}
            enablePan={!boxSelectMode}
            enableZoom={true}
            enableRotate={!boxSelectMode}
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
          {boxSelectMode && (
            <BoxSelection
              setBoxSelectMode={setBoxSelectMode}
              isSelecting={isSelecting}
              selectionBox={selectionBox}
              selectionDivRef={selectionDivRef}
              setSelectionBox={setSelectionBox}
              setIsSelecting={setIsSelecting}
              clickedItems={clickedItems}
              setClickedItems={setClickedItems}
              setMultiClick={setMultiClick}
              invalidateSignal={invalidateSignal}
              setInvalidateSignal={setInvalidateSignal}
              glyph={glyph}
              glyphToMap={glyphToMap}
            />
          )}
        </Canvas>
      </div>
      <div ref={selectionDivRef} style={{position: 'absolute', border: '4px dashed #F0F'}}></div>
      <div className={isDragging ? 'controls noPointerEvents' : 'controls'} id='cameraReset'>
        <button title='reset camera' className={'material-icons'} onClick={() => orbitRef.current.reset()} >flip_camera_ios</button>
        <button title='box select mode' className={boxSelectMode ? 'material-icons active' : 'material-icons' } onClick={() => setBoxSelectMode(!boxSelectMode)}>select_all</button>
      </div>
      {detailScreen && <div id='detailScreen' >
        <a href={detailImageStringState.replace("_2048","")} target="_blank">
            <img id="detailImage" src={detailImageStringState} alt="Detail Image" />
        </a>
        <button 
          title='open LUX record in new tab'
          className='material-icons detailScreenLUX'
          onClick={(e) => {
            e.stopPropagation();
            const luxURL = "https://lux.collections.yale.edu/view/group/6e15bc74-fc7c-425f-9ae0-0123c1adf405";
            window.open(luxURL, '_blank');
          }}
          >
            flare
        </button>
        {data['processing'][detailImageIndex] === '1' && <button 
          title='open processing instructions in new tab' 
          className='material-icons detailScreenProcessingInstructions' 
          onClick={
            (e) => {
              e.stopPropagation();
              const processingURL = returnDomain() + 'processing/' + data['catalog'][detailImageIndex] + '.pdf';
              window.open(processingURL, '_blank');
          }}
          >
            science
        </button>}
        {data['backp'][detailImageIndex] !== "" && <button 
          title='open backprint in new tab' 
          className='material-icons detailScreenBackprint' 
          onClick={(e) => {
            e.stopPropagation();
            const backprintURL = returnDomain() + 'backprints_pattern/bp' + data['catalog'][detailImageIndex] + '.jpg';
            window.open(backprintURL, '_blank');
          }}
          >
            fingerprint
        </button>}
        <button title='close modal' className='material-icons detailScreenRemove' onClick={(e) => {e.stopPropagation(); setDetailScreen(false)}}>cancel</button>
        {clickedItems.length > 1 && <button title='previous panel item' id='previousPanelItem' className='material-icons' onClick={handleDetailScreenNav}>keyboard_arrow_left</button>}
        {clickedItems.length > 1 && <button title='next panel item' id='nextPanelItem' className='material-icons' onClick={handleDetailScreenNav}>keyboard_arrow_right</button>}
        {detailImageStringState.includes('packages_') && data['suffs'][detailImageIndex] !== '' && <button title='previous package image' id='previousPackageImage' className='material-icons' onClick={handlePackageImages}>keyboard_arrow_up</button>}
        {detailImageStringState.includes('packages_') && data['suffs'][detailImageIndex] !== '' && <button title='next package image' id='nextPackageImage' className='material-icons' onClick={handlePackageImages}>keyboard_arrow_down</button>}
        <div id='detailScreenInfoBar'><p>{'#'+data['catalog'][detailImageIndex] + " " + data['man'][detailImageIndex] + " " + data['bran'][detailImageIndex] + " " + data['year'][detailImageIndex]}</p></div>
      </div>}
      <div id='topControls'>
        <div className={isDragging ? 'controls noPointerEvents' : 'controls'} id='spreadControls'>
          <Slider
            color='primary'
            onChange={e => setSpreadSlide(e.target.value)}
            defaultValue={0}
            valueLabelDisplay="auto"
            step={1}
            marks
            min={-2}
            max={2}
          />
        </div>
        <div className={isDragging ? 'controls noPointerEvents' : 'controls'} id='glyphControls'>
          <button title='box glyph' onClick={() => setGlyph('box')} className={glyph === 'box' ? 'material-icons active' : 'material-icons' }>square</button>
          <button title='expressiveness glyph' onClick={() => setGlyph('exp')} className={glyph === 'exp' ? 'material-icons active' : 'material-icons' }>aspect_ratio</button>
          <button title='iso glyph' onClick={() => setGlyph('iso')} className={glyph === 'iso' ? 'material-icons active' : 'material-icons' }>line_weight</button>
          <button title='radar glyph' onClick={() => setGlyph('radar')} className={glyph === 'radar' ? 'material-icons active' : 'material-icons' }>radar</button>
        </div>
      </div>
      <div id='bottomControls'>
        <div className={isDragging ? 'controls noPointerEvents' : 'controls'} id='axisMenus'>
          <select value={xcol} onChange={e => setXcol(e.target.value)} title='x-axis'>
            <option value='year'>year</option>
            <option value='thickness'>thickness</option>
            <option value='gloss'>gloss</option>
            <option value='dmin'>base color</option>
            <option value='dmax'>tone</option>
            <option value='roughness'>roughness</option>
            <option value='expressiveness'>expressiveness</option>
            <option value='auc'>fluorescence</option>
            <option value='colorGroupColl'>collection</option>
            <option value='colorGroupMan'>manufacturer</option>
            <option value='colorGroupBran'>brand</option>
            <option value='colorGroupTextureWord'>texture description</option>
            <option value='colorGroupColorWord'>base color description</option>
            <option value='colorGroupGlossWord'>gloss description</option>
            <option value='colorGroupThickWord'>weight description</option>
            <option value='radarColor'>radar group</option>
            <option value='colorGroupProcessing'>has processing instructions</option>
            <option value='colorGroupBackp'>backprint</option>
            <option value='colorGroupSurf'>surface</option>
            <option value='colorGroupResin'>is resin-coated</option>
            <option value='colorGroupToner'>toner</option>
            <option value='colorGroupPostcard'>is postcard</option>
            <option value='colorGroupCirca'>date is approximate</option>
            <option value='colorGroupSbid'>sample book</option>
          </select>
          {xcolAsc && <button className={'material-icons'} title='sort x-axis descending' onClick={() => setXcolAsc(false)} >arrow_downward</button>}
          {!xcolAsc && <button className={'material-icons active'} title='sort x-axis ascending' onClick={() => setXcolAsc(true)} >arrow_upward</button>}
          <select value={ycol} onChange={e => setYcol(e.target.value)} title='y-axis'>
            <option value='year'>year</option>
            <option value='thickness'>thickness</option>
            <option value='gloss'>gloss</option>
            <option value='dmin'>base color</option>
            <option value='dmax'>tone</option>
            <option value='roughness'>roughness</option>
            <option value='expressiveness'>expressiveness</option>
            <option value='auc'>fluorescence</option>
            <option value='colorGroupColl'>collection</option>
            <option value='colorGroupMan'>manufacturer</option>
            <option value='colorGroupBran'>brand</option>
            <option value='colorGroupTextureWord'>texture description</option>
            <option value='colorGroupColorWord'>base color description</option>
            <option value='colorGroupGlossWord'>gloss description</option>
            <option value='colorGroupThickWord'>weight description</option>
            <option value='radarColor'>radar group</option>
            <option value='colorGroupProcessing'>has processing instructions</option>
            <option value='colorGroupBackp'>backprint</option>
            <option value='colorGroupSurf'>surface</option>
            <option value='colorGroupResin'>is resin-coated</option>
            <option value='colorGroupToner'>toner</option>
            <option value='colorGroupPostcard'>is postcard</option>
            <option value='colorGroupCirca'>date is approximate</option>
            <option value='colorGroupSbid'>sample book</option>
          </select>
          {ycolAsc && <button className={'material-icons'} title='sort y-axis descending' onClick={() => setYcolAsc(false)} >arrow_downward</button>}
          {!ycolAsc && <button className={'material-icons active'} title='sort y-axis ascending' onClick={() => setYcolAsc(true)} >arrow_upward</button>}
          <select value={zcol} onChange={e => setZcol(e.target.value)} title='z-axis'>
            <option value='none'>no z-axis</option>
            <option value='year'>year</option>
            <option value='thickness'>thickness</option>
            <option value='gloss'>gloss</option>
            <option value='dmin'>base color</option>
            <option value='dmax'>tone</option>
            <option value='roughness'>roughness</option>
            <option value='expressiveness'>expressiveness</option>
            <option value='auc'>fluorescence</option>
          </select>
          {zcolAsc && <button className={'material-icons'} title='sort z-axis descending' onClick={() => setZcolAsc(false)} >arrow_downward</button>}
          {!zcolAsc && <button className={'material-icons active'} title='sort z-axis ascending' onClick={() => setZcolAsc(true)} >arrow_upward</button>}
          <select value={group} onChange={e => setGroup(e.target.value)} title='glyph color'>
            <option value='dminHex'>base color</option>
            <option value='dmaxHex'>tone</option>
            <option value='colorGroupColl'>collection</option>
            <option value='colorGroupMan'>manufacturer</option>
            <option value='colorGroupBran'>brand</option>
            <option value='colorGroupTextureWord'>texture description</option>
            <option value='colorGroupColorWord'>base color description</option>
            <option value='colorGroupGlossWord'>gloss description</option>
            <option value='colorGroupThickWord'>weight description</option>
            <option value='thickness'>thickness</option>
            <option value='gloss'>gloss</option>
            <option value='roughness'>roughness</option>
            <option value='expressiveness'>expressiveness</option>
            <option value='auc'>fluorescence</option>
            <option value='year'>year</option>
            <option value='radarColor'>radar group</option>
            <option value='colorGroupProcessing'>has processing instructions</option>
            <option value='colorGroupBackp'>backprint</option>
            <option value='colorGroupSurf'>surface</option>
            <option value='colorGroupResin'>is resin-coated</option>
            <option value='colorGroupToner'>toner</option>
            <option value='colorGroupPostcard'>is postcard</option>
            <option value='colorGroupCirca'>date is approximate</option>
            <option value='colorGroupSbid'>sample book</option>
          </select>
          <button title='group color shuffle' onClick={() => setGroupColors(makeColorArray())} className={'material-icons'}>shuffle</button>
        </div>
      </div>
      <div className={isDragging ? 'controls noPointerEvents' : 'controls'} id='plottypeControls'>
        <button title='grid montage' className={model === 'grid' ? 'material-icons active' : 'material-icons'} onClick={() => setModel('grid')} >apps</button>
        <button title='histogram' className={model === 'hist' ? 'material-icons active' : 'material-icons'} onClick={() => setModel('hist')} >bar_chart</button>
        <button title='scatter plot' className={model === 'scatter' ? 'material-icons active' : 'material-icons'} onClick={() => setModel('scatter')} >grain</button>
        <button title='cluster plot' className={model === 'gep' ? 'material-icons active' : 'material-icons'} onClick={() => setModel('gep')} >bubble_chart</button>
        <button title='texture map' className={model === 'tmap' ? 'material-icons active' : 'material-icons'} onClick={() => setModel('tmap')} >map</button>
      </div>
      <div className={isDragging ? 'controls noPointerEvents' : 'controls'} id='filterControls'>
        {filterModal!=='closed' && <button title='close filter window' className={filter ? 'material-icons active' : 'material-icons'} style={{backgroundColor: filter ? 'var(--yaledarkgray)' : 'var(--yalewhite)'}} onClick={() => {setFilterModal('closed');setManExpand(false);setBranExpand(false)}} >close</button>}
        {filterModal==='closed' && <button title='open filter window' className={filter ? 'material-icons active' : 'material-icons'} onClick={() => setFilterModal('open')} >filter_alt</button>}
        <button title='remove all filters' className='material-icons' onClick={removeAllFilters} >filter_alt_off</button>
        <Download data={data} idxList={filterIdxList} etitle="download filtered data as CSV" />
        <div title='number of filtered items' className='countPrint' id="filterCount">{!filter ? data['catalog'].length : filterIdxList.length}</div>
      </div>
      {filterModal!=='closed' && <div id='filterModal' className={isDragging ? `noPointerEvents ${filterModal}` : filterModal}>
        {filterModal==='open' && <button title='replace selection with filter' className='material-icons replaceFilterWithSelection' style={{right:'28vw'}} onClick={handleFilterToSelection} >open_in_new</button>}
        {filterModal==='expanded' && <button title='replace selection with filter' className='material-icons replaceFilterWithSelection' style={{right:'56vw'}} onClick={handleFilterToSelection} >open_in_new</button>}
        {filterModal==='open' && <button title='add filter to selection' className='material-icons addFilterToSelection' style={{right:'28vw'}} onClick={handleFilterToSelection} >queue</button>}
        {filterModal==='expanded' && <button title='add filter to selection' className='material-icons addFilterToSelection' style={{right:'56vw'}} onClick={handleFilterToSelection} >queue</button>}
        {filterModal==='open' && <button title='expand filter window' className='material-icons expandButtons' style={{right:'28vw'}} onClick={e => {e.stopPropagation; setFilterModal('expanded')}} >chevron_left</button>}
        {filterModal==='expanded' && <button title='contract filter window' className='material-icons expandButtons' style={{right:'56vw'}} onClick={e => {e.stopPropagation; setFilterModal('open')}} >chevron_right</button>}
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >REFERENCE COLLECTION</p></div>
          {Object.keys(collValCounts).sort().map((d,i) => <button key={i} data-cat='sb' data-val={d} onClick={handleFilter} className={filterList['sb'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredCollFrequencies,d)} >{d === '0' ? 'LML Packages' : 'LML Sample Books'}</button>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >YEAR</p></div>
          <div className='sliderContainer'><Slider key={sliderKey} color='primary' data-cat='year' onChangeCommitted={handleSliderFilter} onChange={e => setYearSlide(e.target.value)} defaultValue={[yearMin,yearMax]} valueLabelDisplay="on" min={yearMin} max={yearMax} marks={yearSlideMarks}/></div>
        </div>
        <div className='filterCategoryContainer'>
          <div id='manHead' className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >MANUFACTURER</p></div>
          {!manExpand && Object.keys(manValCounts).sort().slice(0,20).map((d,i) => <button key={i} data-cat='man' data-val={d} onClick={handleFilter} className={filterList['man'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredManFrequencies,d)} >{d}</button>)}
          {!manExpand && <button title='expand manufacturer options' className='material-icons active filterButton' onClick={e => {e.stopPropagation; setManExpand(true)}} >more_horiz</button>}
          {manExpand && Object.keys(manValCounts).sort().map((d,i) => <button key={i} data-cat='man' data-val={d} onClick={handleFilter} className={filterList['man'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredManFrequencies,d)} >{d}</button>)}
          {manExpand && <button title='contract manufacturer options' className='material-icons active filterButton' onClick={e => {e.stopPropagation; setManExpand(false); document.getElementById("manHead").scrollIntoView();}} >expand_less</button>}
        </div>
        <div className='filterCategoryContainer'>
          <div id='branHead' className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >BRAND</p></div>
          {!branExpand && Object.keys(branValCounts).sort().slice(0,20).map((d,i) => <button key={i} data-cat='bran' data-val={d} onClick={handleFilter} className={filterList['bran'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredBranFrequencies,d)} >{d}</button>)}
          {!branExpand && <button title='expand brand options' className='material-icons active filterButton' onClick={e => {e.stopPropagation; setBranExpand(true)}} >more_horiz</button>}
          {branExpand && Object.keys(branValCounts).sort().map((d,i) => <button key={i} data-cat='bran' data-val={d} onClick={handleFilter} className={filterList['bran'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredBranFrequencies,d)} >{d}</button>)}
          {branExpand && <button title='contract brand options' className='material-icons active filterButton' onClick={e => {e.stopPropagation; setBranExpand(false); document.getElementById("branHead").scrollIntoView();}} >expand_less</button>}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >THICKNESS</p></div>
          <div className='sliderContainer'><Slider key={sliderKey} color='primary' data-cat='thickness' onChangeCommitted={handleSliderFilter} onChange={e => setThicknessSlide(e.target.value)} defaultValue={[thicknessMin,thicknessMax]} valueLabelDisplay="on" min={thicknessMin} max={thicknessMax} step={0.001} marks={thicknessSlideMarks}/></div>
          {Object.keys(thicknessValCounts).sort().map((d,i) => <button key={i} data-cat='thicknessWord' data-val={d} onClick={handleFilter} className={filterList['thicknessWord'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredThicknessFrequencies,d)} >{d}</button>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >BASE COLOR</p></div>
          <div className='sliderContainer'><Slider key={sliderKey} color='primary' data-cat='dmin' onChangeCommitted={handleSliderFilter} onChange={e => setColorSlide(e.target.value)} defaultValue={[colorMin,colorMax]} valueLabelDisplay="on" min={colorMin} max={colorMax} step={0.01} marks={colorSlideMarks}/></div>
          {Object.keys(colorValCounts).sort().map((d,i) => <button key={i} data-cat='colorWord' data-val={d} onClick={handleFilter} className={filterList['colorWord'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredColorFrequencies,d)} >{d}</button>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >TONE COLOR</p></div>
          <div className='sliderContainer'><Slider key={sliderKey} color='primary' data-cat='dmax' onChangeCommitted={handleSliderFilter} onChange={e => setToneSlide(e.target.value)} defaultValue={[toneMin,toneMax]} valueLabelDisplay="on" min={toneMin} max={toneMax} step={0.01} marks={toneSlideMarks}/></div>
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >TEXTURE</p></div>
          <div className='sliderContainer'><Slider key={sliderKey} color='primary' data-cat='roughness' onChangeCommitted={handleSliderFilter} onChange={e => setRoughnessSlide(e.target.value)} defaultValue={[roughnessMin,roughnessMax]} valueLabelDisplay="on" min={roughnessMin} step={0.001} max={roughnessMax} marks={roughnessSlideMarks}/></div>
          {Object.keys(textureValCounts).sort().map((d,i) => <button key={i} data-cat='textureWord' data-val={d} onClick={handleFilter} className={filterList['textureWord'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredTextureFrequencies,d)} >{d}</button>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >GLOSS</p></div>
          <div className='sliderContainer'><Slider key={sliderKey} color='primary' data-cat='gloss' onChangeCommitted={handleSliderFilter} onChange={e => setGlossSlide(e.target.value)} defaultValue={[glossMin,glossMax]} valueLabelDisplay="on" min={glossMin} max={glossMax} marks={glossSlideMarks}/></div>
          {Object.keys(glossValCounts).sort().map((d,i) => <button key={i} data-cat='glossWord' data-val={d} onClick={handleFilter} className={filterList['glossWord'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredGlossFrequencies,d)} >{d}</button>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >EXPRESSIVENESS</p></div>
          <div className='sliderContainer'><Slider key={sliderKey} color='primary' data-cat='expressiveness' onChangeCommitted={handleSliderFilter} onChange={e => setExpSlide(e.target.value)} defaultValue={[expMin,expMax]} valueLabelDisplay="on" min={expMin} max={expMax} step={0.01} marks={expSlideMarks}/></div>
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >FLUORESCENCE</p></div>
          <div className='sliderContainer'><Slider key={sliderKey} color='primary' data-cat='auc' onChangeCommitted={handleSliderFilter} onChange={e => setUvSlide(e.target.value)} defaultValue={[uvMin,uvMax]} valueLabelDisplay="on" min={uvMin} max={uvMax} marks={uvSlideMarks}/></div>
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >PROCESSING INSTRUCTIONS</p></div>
          {Object.keys(processingValCounts).sort().map((d,i) => <button key={i} data-cat='processing' data-val={d} onClick={handleFilter} className={filterList['processing'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredProcessingFrequencies,d)} >{d === '1' ? 'True' : 'False'}</button>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >BACKPRINT</p></div>
          {Object.keys(backpValCounts).sort().map((d,i) => <button key={i} data-cat='backp' data-val={d} onClick={handleFilter} className={filterList['backp'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredBackpFrequencies,d)} >{d}</button>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >SURFACE</p></div>
          {!surfExpand && Object.keys(surfValCounts).sort().slice(0,20).map((d,i) => <button key={i} data-cat='surf' data-val={d} onClick={handleFilter} className={filterList['surf'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredSurfFrequencies,d)} >{d}</button>)}
          {!surfExpand && <button title='expand surface options' className='material-icons active filterButton' onClick={e => {e.stopPropagation; setSurfExpand(true)}} >more_horiz</button>}
          {surfExpand && Object.keys(surfValCounts).sort().map((d,i) => <button key={i} data-cat='surf' data-val={d} onClick={handleFilter} className={filterList['surf'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredSurfFrequencies,d)} >{d}</button>)}
          {surfExpand && <button title='contract surface options' className='material-icons active filterButton' onClick={e => {e.stopPropagation; setSurfExpand(false); document.getElementById("surfHead").scrollIntoView();}} >expand_less</button>}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >RESIN-COATED</p></div>
          {Object.keys(resinValCounts).sort().map((d,i) => <button key={i} data-cat='resin' data-val={d} onClick={handleFilter} className={filterList['resin'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredResinFrequencies,d)} >{d === '1' ? 'True' : 'False'}</button>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >TONER</p></div>
          {Object.keys(tonerValCounts).sort().map((d,i) => <button key={i} data-cat='toner' data-val={d} onClick={handleFilter} className={filterList['toner'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredTonerFrequencies,d)} >{d}</button>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >POSTCARD</p></div>
          {Object.keys(postcardValCounts).sort().map((d,i) => <button key={i} data-cat='postcard' data-val={d} onClick={handleFilter} className={filterList['postcard'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredPostcardFrequencies,d)} >{d === '1' ? 'True' : 'False'}</button>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >APPROXIMATE DATE</p></div>
          {Object.keys(circaValCounts).sort().map((d,i) => <button key={i} data-cat='circa' data-val={d} onClick={handleFilter} className={filterList['circa'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredCircaFrequencies,d)} >{d === '1' ? 'True' : 'False'}</button>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className="filterCategoryHeading" >SAMPLE BOOK</p></div>
          {!sbidExpand && Object.keys(sbidValCounts).sort().slice(0,20).map((d,i) => <button key={i} data-cat='sbid' data-val={d} onClick={handleFilter} className={filterList['sbid'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredSbidFrequencies,d)} >{d}</button>)}
          {!sbidExpand && <button title='expand sample book options' className='material-icons active filterButton' onClick={e => {e.stopPropagation; setSbidExpand(true)}} >more_horiz</button>}
          {sbidExpand && Object.keys(sbidValCounts).sort().map((d,i) => <button key={i} data-cat='sbid' data-val={d} onClick={handleFilter} className={filterList['sbid'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredSbidFrequencies,d)} >{d}</button>)}
          {sbidExpand && <button title='contract sample book options' className='material-icons active filterButton' onClick={e => {e.stopPropagation; setSbidExpand(false); document.getElementById("sbidHead").scrollIntoView();}} >expand_less</button>}
        </div>
      </div>}
    </div>
  )
}

function filterButtonStyle(filteredFrequencies, d) {

  const style = {};

  if (Object.keys(filteredFrequencies).includes(d)) {
    style.backgroundColor = `hsl(0,0%,${parseInt(100 - filteredFrequencies[d] * 100)}%)`;
  } else {
    style.backgroundColor = 'transparent';
  }

  if (filteredFrequencies[d] > 0.5) {
    style.color = 'var(--yalewhite)';
  } else {
    style.color = 'var(--yaledarkgray)';
  }

  return style;

}
