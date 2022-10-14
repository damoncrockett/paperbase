import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
//import create from 'zustand';
import { Object3D, Color, MOUSE, DoubleSide } from 'three';
import { useSpring } from '@react-spring/three';
import { Slider } from '@mui/material';
import { select } from 'd3-selection';
import { bin } from 'd3-array';
import { transition } from 'd3-transition';
import { orderBy, compact, max, min, cloneDeep } from 'lodash';
import { data } from './data';

/*Misc functions--------------------------------------------------------------*/

function returnDomain() {
  const production = process.env.NODE_ENV === 'production';
  return production ? '' : 'http://localhost:8888/'
}

const svgSide = window.innerHeight * 0.15;

const n = data['isoGroup'].length; // nrows in data; 'isgoGroup' could be any col

const randomRGB = () => {
  const rgbString = "rgb(" + parseInt(Math.random() * 255) + "," + parseInt(Math.random() * 255) + "," + parseInt(Math.random() * 255) + ")"
  return rgbString
};

function makeColorArray(k) {
  const colorArray = Array.from({length: k}, () => randomRGB());
  return colorArray
}

/*Color groups----------------------------------------------------------------*/

// for making integer labels for character-variable groups, used in glyph group colors
function makeGroupLabels(groupCol) {
  const valGroups = Array.from(new Set(data[groupCol]));
  const groupDict = {};
  valGroups.forEach((item, i) => {
    groupDict[item] = i
  });

  return data[groupCol].map(d => groupDict[d])
}

data['radarColor'] = makeGroupLabels('radarGroup');
data['colorGroupColorWord'] = makeGroupLabels('colorWord');
data['colorGroupThickWord'] = makeGroupLabels('thicknessWord');
data['colorGroupTextureWord'] = makeGroupLabels('textureWord');
data['colorGroupGlossWord'] = makeGroupLabels('glossWord');
data['colorGroupMan'] = makeGroupLabels('man');

//console.log(Object.keys(data));
//console.log(data);

/*
function valueCounts(col) {
  const occurrences = data[col].reduce(function (acc, curr) {
    return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc
  }, {});
  return occurrences
}
*/

/*groupMaps-------------------------------------------------------------------*/

/* These maps are dictionaries where the keys are groups and the values are
lists of global indices (i.e., positions in the `data` arrays)
*/

function makeMap(groupArray,glyphGroup) {
  const groupMap = {};
  groupArray.forEach((item, i) => {
    const globalIndexArray = [];
    data[glyphGroup].forEach((groupValue, j) => {
      if ( groupValue === item ) {
        globalIndexArray.push(j)
      }
    });
    groupMap[item] = globalIndexArray;
  });
  return groupMap
}

data['boxGroup'] = Array(n).fill('b');
const boxGroupArray = ['b'];
const boxMap = makeMap(boxGroupArray,'boxGroup');

const expressivenessGroupArray = Array.from(new Set(data['expressivenessGroup']));
const expressivenessMap = makeMap(expressivenessGroupArray,'expressivenessGroup');

const isoGroupArray = Array.from(new Set(data['isoGroup']));
const isoMap = makeMap(isoGroupArray,'isoGroup');
const zArray = isoGroupArray.map(d => d.split('_')[0]==='0' ? 0.05 : d.split('_')[0]==='1' ? 0.25 : d.split('_')[0]==='2' ? 0.5 : 0.75);

const radarGroupArray = Array.from(new Set(data['radarGroup']));
const radarMap = makeMap(radarGroupArray,'radarGroup');

/*Radar-----------------------------------------------------------------------*/

// Some dimensions have 3 obvious bins, some have 4
const axisSteps = (binNumber, numBins) => {
  if ( numBins === 3 ) {
    return binNumber === '0' ? 0.33/2 : binNumber === '1' ? 0.66/2 : 0.99/2
  } else if ( numBins === 4 ) {
    return binNumber === '0' ? 0.25/2 : binNumber === '1' ? 0.5/2 : binNumber === '2' ? 0.75/2 : 1.0/2
  }
}

function radarVertices(glyphGroup) {
  let [thick, rough, gloss, color] = glyphGroup.split('_');

  thick = axisSteps(thick, 4) * -1;
  rough = axisSteps(rough, 3) * -1;
  gloss = axisSteps(gloss, 3);
  color = axisSteps(color, 4);

  const glyphThickness = 0.1;

  const thicktop = [thick,0,glyphThickness];
  const thickbottom = [thick,0,0];
  const roughtop = [0,rough,glyphThickness];
  const roughbottom = [0,rough,0];
  const glosstop = [gloss,0,glyphThickness];
  const glossbottom = [gloss,0,0];
  const colortop = [0,color,glyphThickness];
  const colorbottom = [0,color,0];

  const bottom = [thickbottom, glossbottom, colorbottom, roughbottom, glossbottom, thickbottom];
  const top = [thicktop, glosstop, colortop, roughtop, glosstop, thicktop];
  const upperLeft = [colorbottom, thicktop, colortop, colorbottom, thickbottom, thicktop];
  const upperRight = [glossbottom, colortop, glosstop, glossbottom, colorbottom, colortop];
  const lowerLeft = [thickbottom, roughtop, thicktop, thickbottom, roughbottom, roughtop];
  const lowerRight = [roughbottom, glosstop, roughtop, roughbottom, glossbottom, glosstop];

  const rawVertices = [bottom, top, upperLeft, upperRight, lowerLeft, lowerRight];
  return new Float32Array(rawVertices.flat(2))

}

function radarNormals(glyphGroup) {
  let [thick, rough, gloss, color] = glyphGroup.split('_');

  thick = axisSteps(thick, 4) * -1;
  rough = axisSteps(rough, 3) * -1;
  gloss = axisSteps(gloss, 3);
  color = axisSteps(color, 4);

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

// Radar used in InfoPanel, drawn by d3 instead of webGL

function getUniverse(dataU,scaleTransform) {
  if ( scaleTransform ) {
    return [
      min(dataU['color']),
      max(dataU['color']),
      min(dataU['thickness']),
      max(dataU['thickness']),
      min(dataU['roughness']),
      max(dataU['roughness']),
      min(dataU['gloss']),
      max(dataU['gloss'])
    ]
  } else {
    return [
      min(rankTransform(dataU['color'])),
      max(rankTransform(dataU['color'])),
      min(rankTransform(dataU['thickness'])),
      max(rankTransform(dataU['thickness'])),
      min(rankTransform(dataU['roughness'])),
      max(rankTransform(dataU['roughness'])),
      min(rankTransform(dataU['gloss'])),
      max(rankTransform(dataU['gloss']))
    ]
  }
}

function uScale(uMin,uMax,val) {
  const uRange = uMax - uMin;
  return (val - uMin) / uRange
}

function rankTransform(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  return arr.map((x) => sorted.indexOf(x) + 1)
}

function polygonPoints(dataU, clickedItem, scaleTransform) {

    const universe = getUniverse(dataU,scaleTransform);
    let p1,p2,p3,p4;

    if ( scaleTransform ) {
      p1 = data['color'][clickedItem];
      p2 = data['thickness'][clickedItem];
      p3 = data['roughness'][clickedItem];
      p4 = data['gloss'][clickedItem];
    } else {
      p1 = rankTransform(data['color'])[clickedItem];
      p2 = rankTransform(data['thickness'])[clickedItem];
      p3 = rankTransform(data['roughness'])[clickedItem];
      p4 = rankTransform(data['gloss'])[clickedItem];
    }

    p1 = uScale(universe[0],universe[1],p1);
    p2 = uScale(universe[2],universe[3],p2);
    p3 = uScale(universe[4],universe[5],p3);
    p4 = 1 - uScale(universe[6],universe[7],p4);

    const zeroPoint = svgSide / 2;

    // top (color)
    const p1x = zeroPoint;
    const p1y = zeroPoint - zeroPoint * p1;
    // left (thickness)
    const p2x = zeroPoint - zeroPoint * p2 ;
    const p2y = zeroPoint;
    // bottom (roughness)
    const p3x = zeroPoint;
    const p3y = zeroPoint + zeroPoint * p3;
    // right (matte-ness)
    const p4x = zeroPoint + zeroPoint * p4;
    const p4y = zeroPoint;

    const s = p1x.toString()+','+p1y.toString()+' '+p2x.toString()+','+p2y.toString()+' '+p3x.toString()+','+p3y.toString()+' '+p4x.toString()+','+p4y.toString();

    return s
}

/*Models----------------------------------------------------------------------*/

const animatedCoords = Array.from({ length: n }, () => [0, 0, 0]);

function gridCoords(n,ncol) {

  const nrow = Math.ceil( n / ncol )
  const xgrid = Array(nrow).fill(Array.from(Array(ncol).keys())).flat().slice(0,n);
  const ygrid = Array.from(Array(nrow).keys()).map(d => Array(ncol).fill(d)).flat().slice(0,n);

  const coords = [];
  xgrid.forEach((item, i) => {
    coords[i] = [item - ncol / 2, ygrid[i] - nrow / 2, 0]
  });

  return coords;
}

function makeGrid(xcol,xcolAsc,slide) {
  let sortingArray = [];
  const ncolsSquare = Math.ceil(Math.sqrt(n));
  const ncolsIncrement = Math.ceil(ncolsSquare / 5);
  const ncols = slide === -2 ? ncolsSquare - ncolsIncrement * 2 : slide === -1 ? ncolsSquare - ncolsIncrement : slide === 0 ? ncolsSquare : slide === 1 ? ncolsSquare + ncolsIncrement : ncolsSquare + ncolsIncrement * 2;
  const gridArray = gridCoords(n,ncols);

  data[xcol].forEach((item, i) => {
    sortingArray[i] = { 'idx': i, 'val': item }
  });
  sortingArray = orderBy(sortingArray,['val'],[xcolAsc ? 'asc' : 'desc']);
  sortingArray.forEach((item, i) => {
    sortingArray[i]['pos'] = gridArray[i]
  });

  return orderBy(sortingArray,['idx'],['asc']).map(d => d.pos);
}

function getStandardDeviation(arr) {
  arr = compact(arr);
  const n = arr.length;
  const mean = arr.reduce((a, b) => a + b) / n;
  return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
}

function makeHist(xcol,xcolAsc,ycol,ycolAsc,slide) {

  let scratchArray = [];

  data[xcol].forEach((item, i) => {
    scratchArray[i] = { 'idx': i, 'val': parseFloat(item), 'ycol': parseFloat(data[ycol][i]) }
  });

  const histBinsMid = 200;
  const histBinsIncrement = 50;
  const histBins = slide === -2 ? histBinsMid - histBinsIncrement * 2 : slide === -1 ? histBinsMid - histBinsIncrement : slide === 0 ? histBinsMid : slide === 1 ? histBinsMid + histBinsIncrement : histBinsMid + histBinsIncrement * 2;

  const std = getStandardDeviation(scratchArray.map(d => d.val));
  const arrmax = max(scratchArray.map(d => d.val)); // lodash max ignores null
  const binner = bin().thresholds(histBins).value(d => d.val ? d.val : arrmax + std);
  const binnedData = binner(scratchArray);

  if ( xcolAsc === false ) {
    binnedData.reverse();
  }

  scratchArray = [];
  binnedData.forEach((bin, binidx) => {
    if (bin.length > 0) {
      bin = orderBy(bin,['ycol'],[ycolAsc ? 'asc' : 'desc'])
      bin.forEach((item, itemidx) => {
        const x = binidx - binnedData.length / 2; // we need negative x and y positions too
        const y = itemidx === 0 ? 0 : itemidx % 2 === 0 ? -1 * itemidx/2 : Math.ceil(itemidx/2);
        scratchArray.push({'pos':[x, y, 0],'idx':item.idx});
      });
    }
  });

  scratchArray = orderBy(scratchArray,['idx'],['asc']);
  return scratchArray.map(d => d.pos)
}

function featureScale(col) {
  col = col.map(d => parseFloat(d));
  const colmin = min(col);
  const colmax = max(col);
  const colrange = colmax - colmin;
  const std = getStandardDeviation(col);
  return col.map(d => d ? (d - colmin) / colrange : colmax + std) // if d is null, we add sigma to the max to send it to the right, off screen
}

function makeScatter(xcol,xcolAsc,ycol,ycolAsc,zcol,zcolAsc,slide) {
  let xArray = featureScale(data[xcol]);
  let yArray = featureScale(data[ycol]);
  let zArray = zcol === 'none' ? null : featureScale(data[zcol]);

  if ( xcolAsc === false ) {
    xArray = xArray.map(d => 1 - d);
  }

  if ( ycolAsc === false ) {
    yArray = yArray.map(d => 1 - d);
  }

  if ( zArray !== null && zcolAsc === false ) {
    zArray = zArray.map(d => 1 - d);
  }

  const scatterFactorMid = 250;
  const scatterFactorIncrement = 50;
  const scatterFactor = slide === -2 ? scatterFactorMid - scatterFactorIncrement * 2 : slide === -1 ? scatterFactorMid - scatterFactorIncrement : slide === 0 ? scatterFactorMid : slide === 1 ? scatterFactorMid + scatterFactorIncrement : scatterFactorMid + scatterFactorIncrement * 2;

  const scratchArray = [];
  xArray.forEach((item, i) => {
    const x = item * scatterFactor - scatterFactor / 2;
    const y = yArray[i] * scatterFactor - scatterFactor / 2;
    const z = zArray === null ? 0 : zArray[i] * scatterFactor - scatterFactor / 2;
    scratchArray.push([x,y,z])
  });

  return scratchArray

}

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

/*Colors----------------------------------------------------------------------*/

// Kodak, Agfa, Dupont, Ilford, Defender, Ansco, Darko, Forte, Luminos, Haloid, Oriental, Gevaert
// yellow, red, blue, white, green, lightblue, black, gold, palered, maroon, orange, purple
//const manColors = [0xfab617, 0xfd5344, 0x143b72, 0xffffff, 0x588f28, 0x6379dd, 0x111111, 0x7c6c49, 0xda947d, 0x6f282e, 0xc36335, 0x363348, 0x808080]

const highlightColor = 0xff00ff;
const colorSubstrate = new Color();
const continuousColorCols = ['thickness','gloss','roughness','expressiveness','year'];
let colorVals;

function valToColor(arr) {
  arr = arr.map(d => parseFloat(d));
  const arrmax = max(arr);
  const arrmin = min(arr);
  const arrrange = arrmax - arrmin;
  const arrnorm = arr.map(d => (d - arrmin) / arrrange);
  const arrhsl = arrnorm.map(d => d ? "hsl(0,0%," + parseInt(d*100).toString() + "%)" : 0xbd590f);

  return arrhsl
}

/*instancedMesh---------------------------------------------------------------*/

const meshList = {};
let targetCoords;

function Glyphs({ glyphMap, glyphGroup, glyph, model, xcol, xcolAsc, ycol, ycolAsc, zcol, zcolAsc, facetcol, facetcolAsc, group, multiClick, clickedItems, setClickedItems, z, vertices, normals, itemSize, s, slide, groupColors, raisedItem, setRaisedItem }) {

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
      targetCoords = makeGrid(xcol,xcolAsc,slide);
    } else if ( model === 'hist' ) {
      targetCoords = makeHist(xcol,xcolAsc,ycol,ycolAsc,slide);
    } else if ( model === 'scatter' ) {
      targetCoords = makeScatter(xcol,xcolAsc,ycol,ycolAsc,zcol,zcolAsc,slide);
    } else {
      const gepCoords = slide === -2 ? 'gep50' : slide === -1 ? 'gep75' : slide === 0 ? 'gep' : slide === 1 ? 'gep125' : 'gep150';
      targetCoords = cloneDeep(data[gepCoords]);
    }



    if ( facetcol !== 'none' ) {
      // update z dims for 3d facet
      const facetData = data[facetcol];
      const facetGroups = Array.from(new Set(facetData));
      const facetZs = {};

      facetGroups.forEach((item, i) => {
        if ( facetcolAsc ) {
          i = Math.abs( facetGroups.length - i );
        }
        facetZs[item] = i
      });

      facetData.forEach((item, i) => {
        targetCoords[i][2] = facetZs[item] * 2
      });
    }

    if ( raisedItem !== null ) {
      targetCoords[raisedItem][2] = 2
    }

  }, [model, xcol, xcolAsc, ycol, ycolAsc, zcol, zcolAsc, facetcol, facetcolAsc, slide, raisedItem])

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
  }, [model, xcol, xcolAsc, ycol, ycolAsc, zcol, zcolAsc, facetcol, facetcolAsc, slide, raisedItem]);

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
      colorVals = valToColor(baseData);
    } else {
      colorVals = data[group];
    }

    globalIndicesForThisMesh.forEach((item, i) => {
      if ( !clickedItems.includes(item) ) { // so we don't recolor the clicked point
        /*
        `colorVals[item]` returns either a color or a group index. If the former,
        then `groupColors[colorVals[item]]` fails, and we get `colorVals[item]`,
        which again is a color. If the latter, then we get a groupColor, and
        these are generated randomly.
        */
        const colorVal = groupColors[colorVals[item]] || colorVals[item];
        colorSubstrate.set(colorVal);
        meshRef.current.setColorAt(i, colorSubstrate);
      } else {
        colorSubstrate.set(highlightColor);
        meshRef.current.setColorAt(i, colorSubstrate);
      }
    });
    meshRef.current.instanceColor.needsUpdate = true;
    invalidate();
  }, [group, groupColors]);

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
            const colorVal = groupColors[colorVals[globalIndex]] || colorVals[globalIndex];
            // if the item we are considering in this loop iteration is not identical to the item we just clicked
            // basically, this case handles items that need to be set to whatever color they had before
            if ( globalInstanceId !== globalIndex ) {
              colorSubstrate.set(colorVal);
              mesh.setColorAt(j, colorSubstrate);
            } else if ( globalInstanceId === globalIndex ) { // loop iteration item IS ALSO the item we just clicked
              if ( !clickedItems.includes(globalInstanceId) ) { // if this item not already clicked, highlight it
                colorSubstrate.set(highlightColor);
                mesh.setColorAt(j, colorSubstrate);
                setClickedItems([globalInstanceId]);
              } else { // if already clicked, unclick
                colorSubstrate.set(colorVal);
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
            const colorVal = groupColors[colorVals[globalIndex]] || colorVals[globalIndex];
            // if the item we are considering in this loop iteration is not identical to the item we just clicked
            // basically, this case handles items that need to be set to whatever color they had before
            if ( globalInstanceId !== globalIndex ) {
              // if the item we're considering in this loop iteration is not already clicked, set to its normal color
              if ( !clickedItems.includes(globalIndex) ) {
                colorSubstrate.set(colorVal);
                mesh.setColorAt(j, colorSubstrate);
              } else { // but if it is clicked, set to highlight color
                colorSubstrate.set(highlightColor);
                mesh.setColorAt(j, colorSubstrate);
              }
            } else if ( globalInstanceId === globalIndex ) { // loop iteration item IS ALSO the item we just clicked
              if ( !clickedItems.includes(globalInstanceId) ) { // if this item not already clicked, highlight it
                colorSubstrate.set(highlightColor);
                mesh.setColorAt(j, colorSubstrate);
                setClickedItems([...clickedItems, globalInstanceId]);
              } else { // if already clicked, unclick
                colorSubstrate.set(colorVal);
                mesh.setColorAt(j, colorSubstrate);
                setClickedItems(clickedItems.filter(d => d !== globalInstanceId));
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
      <instancedMesh ref={meshRef} args={[null, null, n]} onClick={handleClick} name={glyphGroup}>
        <boxBufferGeometry args={[0.75, 0.75, 0.75]}></boxBufferGeometry>
        <meshStandardMaterial attach="material" />
      </instancedMesh>
    )
  } else if ( glyph === 'exp' ) {
    return (
      <instancedMesh ref={meshRef} args={[null, null, glyphMap[glyphGroup].length]} onClick={handleClick} name={glyphGroup}>
        <boxBufferGeometry args={[s, s, s]}></boxBufferGeometry>
        <meshStandardMaterial attach="material"/>
      </instancedMesh>
    )
  } else if ( glyph === 'iso' ) {
    return (
      <instancedMesh ref={meshRef} args={[null, null, glyphMap[glyphGroup].length]} onClick={handleClick} name={glyphGroup}>
        <boxBufferGeometry args={[0.75, 0.75, z]}></boxBufferGeometry>
        <meshStandardMaterial attach="material"/>
      </instancedMesh>
    )
  } else if ( glyph === 'radar' ) {
    return (
      <instancedMesh ref={meshRef} args={[null, null, glyphMap[glyphGroup].length]} onClick={handleClick} name={glyphGroup}>
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

const glyphToMap = {
  'box':boxMap,
  'exp':expressivenessMap,
  'iso':isoMap,
  'radar':radarMap
}

function PanelItem({ clickedItem, clickedItems, setClickedItems, multiClick, glyph, groupColors, briefMode, raisedItem, setRaisedItem, gridMode, smallFont, backgroundColor }) {
  //const [visBar, setVisBar] = useState(false);
  //const [scaleTransform, setScaleTransform] = useState(true);

  const svgRef = useRef();

  let blankInfo;
  const writeInfoArray = globalInstanceId => {
    let textureWord = data['textureWord'][globalInstanceId];
    let glossWord = data['glossWord'][globalInstanceId];
    let colorWord = data['colorWord'][globalInstanceId];
    let thicknessWord = data['thicknessWord'][globalInstanceId];

    textureWord = textureWord === '_' ? '' : textureWord;
    glossWord = glossWord === '_' ? '' : glossWord;
    colorWord = colorWord === '_' ? '' : colorWord;
    thicknessWord = thicknessWord === '_' ? '' : thicknessWord;

    let infoList = [textureWord, glossWord, colorWord, thicknessWord];

    // to preserve infoPanel height in the absence of any boxWords
    if ( infoList.filter(d => d !== '').length === 0 ) {
      infoList = ['Placeholder'];
      blankInfo = true;
    } else {
      blankInfo = false;
    }
    return [infoList.filter(d => d !== '').join(' • ')];
  }

  /*
  This is crucial because it gives us the correct meshes to iterate through here.
  An added bonus is that it will update anytime we update the display glyph!
  */
  const glyphMap = glyphToMap[glyph];

  const handleRemove = e => {

    e.stopPropagation();

    if ( raisedItem !== null && clickedItem === raisedItem ) {
      setRaisedItem(null);
    }

    if ( !multiClick ) {

      Object.keys(glyphMap).forEach((item, i) => {
        const mesh = meshList[item];
        glyphMap[item].forEach((globalIndex, j) => {
          const colorVal = groupColors[colorVals[globalIndex]] || colorVals[globalIndex];
          colorSubstrate.set(colorVal);
          mesh.setColorAt(j, colorSubstrate);
        });
        mesh.instanceColor.needsUpdate = true;
      });

      setClickedItems([]);

    } else {

      Object.keys(glyphMap).forEach((item, i) => {
        const mesh = meshList[item];
        glyphMap[item].forEach((globalIndex, j) => {
          const colorVal = groupColors[colorVals[globalIndex]] || colorVals[globalIndex];
          // if the item we are considering in this loop iteration is not identical to the item we just clicked
          // basically, this case handles items that need to be set to whatever color they had before
          if ( clickedItem !== globalIndex ) {
            // if the item we're considering in this loop iteration is not already clicked, set to its normal color
            if ( !clickedItems.includes(globalIndex) ) {
              colorSubstrate.set(colorVal);
              mesh.setColorAt(j, colorSubstrate);
            } else { // but if it is clicked, set to highlight color
              colorSubstrate.set(highlightColor);
              mesh.setColorAt(j, colorSubstrate);
            }
          } else if ( clickedItem === globalIndex ) { // loop iteration item IS ALSO the item we just clicked
              colorSubstrate.set(colorVal);
              mesh.setColorAt(j, colorSubstrate);
          }
        });
        mesh.instanceColor.needsUpdate = true;
      });

      setClickedItems(clickedItems.filter(d => d!==clickedItem));
    }
  }

  const handlePanelItemClick = e => {
    e.stopPropagation();

    if ( clickedItem !== raisedItem ) {
      setRaisedItem(clickedItem);
    } else {
      setRaisedItem(null);
    }
  }

/*
  useEffect(() => {
    if ( visBar ) {

      const dataU = data;

      select(svgRef.current)
        .selectAll('line.yaxis')
        .data([0])
        .enter()
        .append('line')
        .attr('class', 'yaxis')
        .attr('id', 'yaxis')
        .attr('x1', svgSide / 2 )
        .attr('y1', 0 )
        .attr('x2', svgSide / 2 )
        .attr('y2', svgSide )
        .attr('stroke', '#494949')

      select(svgRef.current)
        .selectAll('line.xaxis')
        .data([0])
        .enter()
        .append('line')
        .attr('class', 'xaxis')
        .attr('id', 'xaxis')
        .attr('x1', 0 )
        .attr('y1', svgSide / 2 )
        .attr('x2', svgSide )
        .attr('y2', svgSide / 2 )
        .attr('stroke', '#494949')

      select(svgRef.current)
        .selectAll('polygon.radar')
        .data([0])
        .enter()
        .append('polygon')
        .attr('class', 'radar')
        .attr('id', 'radar')
        .attr('points', polygonPoints(dataU,clickedItem,scaleTransform))
        .attr('stroke', '#494949')
        .attr('fill', '#989898')
        .attr('fill-opacity', '0.5')

      select(svgRef.current)
        .selectAll('polygon.radar')
        .transition().duration(500)
          .attr('points', polygonPoints(dataU,clickedItem,scaleTransform))

    }
  }, [visBar, clickedItem, scaleTransform])
*/

  return (
    <div className={gridMode ? 'panelItem gridMode' : 'panelItem listMode'} title={clickedItem} onClick={handlePanelItemClick} style={backgroundColor ? {backgroundColor: data['colorString'][clickedItem]} : {backgroundColor: 'white'}}>
      <button title='remove from selection' className='selectionRemove material-icons' onClick={handleRemove} >cancel</button>
      {!briefMode && <div className={smallFont ? 'catalogSmall' : 'catalog'}>
        <p>{'#'+data['catalog'][clickedItem]}</p>
      </div>}
      <div className='titleBar'>
        <p className={smallFont ? 'titleBarSmall man' : 'man'}>{data['man'][clickedItem]}</p>
        <p className={smallFont ? 'titleBarSmall bran' : 'bran'}>{data['bran'][clickedItem]}</p>
        <p className={smallFont ? 'titleBarSmall year' : 'year'}>{data['year'][clickedItem]}</p>
      </div>
      {!briefMode && <div className='infoBar'>
          {writeInfoArray(clickedItem).map((d,i) => <p className={smallFont ? 'boxWordSmall' : 'boxWord'} style={blankInfo ? {color:'transparent'} : !backgroundColor ? {color:'#989898'} : {color:'white'}} key={i}>{d}</p>)}
      </div>}
    </div>
  )
}

/*Camera position-------------------------------------------------------------*/

/*
const useStore = create(set => ({
  position: [0, 0, 75],
  setPosition: position => set({ position })
}))

function MyCameraReactsToStateChanges({ orbitRef }) {
  const [x, y, z] = useStore(state => state.position);
  useFrame(state => {
    state.camera.position.lerp({ x, y, z }, 0.1);
    state.camera.lookAt(x, y, z);
    orbitRef.current.update();
  });
  return null
}
*/

/*App-------------------------------------------------------------------------*/

export default function App() {
  const [model, setModel] = useState('grid');
  const [filter, setFilter] = useState(false);
  const [toggleMR, setToggleMR] = useState(false);
  const [toggleAS, setToggleAS] = useState(false);
  const [toggleHC, setToggleHC] = useState(false);
  const [toggleLAB, setToggleLAB] = useState(false);
  const [toggleExpand, setToggleExpand] = useState(false);
  const [xcol, setXcol] = useState('colorGroupBinder');
  const [ycol, setYcol] = useState('colorGroupBinder');
  const [zcol, setZcol] = useState('none');
  const [facet, setFacet] = useState('3d');
  const [facetcol, setFacetCol] = useState('none');
  const [facetcolAsc, setFacetcolAsc] = useState(true);
  const [xcolAsc, setXcolAsc] = useState(true);
  const [ycolAsc, setYcolAsc] = useState(true);
  const [zcolAsc, setZcolAsc] = useState(true);
  const [group, setGroup] = useState('colorGroupBinder');
  const [clickedItems, setClickedItems] = useState([]);
  const [multiClick, setMultiClick] = useState(false);
  const [gridMode, setGridMode] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const [briefMode, setBriefMode] = useState(false);
  const [smallFont, setSmallFont] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(false);
  const [glyph, setGlyph] = useState('box');
  const [slide, setSlide] = useState(0);
  const [groupColors, shuffleGroupColors] = useState(makeColorArray(50));
  const [raisedItem, setRaisedItem] = useState(null);
  const itemSize = 3;

  // key code constants
  const ALT_KEY = 18;
  const CTRL_KEY = 17;
  const CMD_KEY = 91;

  const exprStringToFloat = exprString => {
    exprString = exprString.substring(1);
    const s = Number(exprString) / 10;
    return s
  };

  const orbitRef = useRef();
  //const setPosition = useStore(state => state.setPosition);

  const glyphMap = glyphToMap[glyph];
  const clearSelection = () => {
    Object.keys(glyphMap).forEach((item, i) => {
      const mesh = meshList[item];
      glyphMap[item].forEach((globalIndex, j) => {
        const colorVal = groupColors[colorVals[globalIndex]] || colorVals[globalIndex];
        colorSubstrate.set(colorVal);
        mesh.setColorAt(j, colorSubstrate);
      });
      mesh.instanceColor.needsUpdate = true;
    });
  }

  return (
    <div id='app'>
      <div className='controls' id='multiClick'>
        {gridMode && <button title='switch to list mode' className={'material-icons active'} onClick={() => setGridMode(false)} >list</button>}
        {!gridMode && <button title='switch to grid mode' className={'material-icons'} onClick={() => setGridMode(true)} >grid_view</button>}
        <button title='add paper color to background' className={backgroundColor ? 'material-icons active' : 'material-icons'} onClick={() => setBackgroundColor(!backgroundColor)} >format_color_fill</button>
        {smallFont && <button title='switch to normal font' className={'material-icons active'} onClick={() => setSmallFont(false)} >format_size</button>}
        {!smallFont && <button title='switch to small font' className={'material-icons'} onClick={() => setSmallFont(true)} >text_fields</button>}
        {briefMode && <button title='switch to verbose mode' className={'material-icons active'} onClick={() => setBriefMode(false)} >notes</button>}
        {!briefMode && <button title='switch to brief mode' className={'material-icons'} onClick={() => setBriefMode(true)} >short_text</button>}
        {lightMode && <button title='switch to dark mode' className={'material-icons active'} onClick={() => setLightMode(false)} >dark_mode</button>}
        {!lightMode && <button title='switch to light mode' className={'material-icons'} onClick={() => setLightMode(true)} >light_mode</button>}
        <button title='multi-select mode' className={multiClick ? 'material-icons active' : 'material-icons'} onClick={() => setMultiClick(!multiClick)} >done_all</button>
        <button title='clear selection' className='material-icons' onClick={() => {clearSelection(); setClickedItems([]); setRaisedItem(null)}} >delete_sweep</button>
      </div>
      <div id='infoPanel' className={lightMode && gridMode ? 'lightMode grid' : lightMode && !gridMode ? 'lightMode list' : !lightMode && gridMode ? 'darkMode grid' : 'darkMode list'}>
        {clickedItems.map((clickedItem,i) => <PanelItem
                                               clickedItem={clickedItem}
                                               clickedItems={clickedItems}
                                               setClickedItems={setClickedItems}
                                               multiClick={multiClick}
                                               glyph={glyph}
                                               groupColors={groupColors}
                                               briefMode={briefMode}
                                               raisedItem={raisedItem}
                                               setRaisedItem={setRaisedItem}
                                               gridMode={gridMode}
                                               smallFont={smallFont}
                                               backgroundColor={backgroundColor}
                                               key={i}
                                               />
                                             )}
      </div>
      <div id='viewpane'>
        <Canvas dpr={[1, 2]} camera={{ position: [0,0,75], far: 20000 }} frameloop="demand">
          <color attach="background" args={[0x494949]} />
          <ambientLight intensity={0.5}/>
          <pointLight position={[0, 0, 135]} intensity={0.5}/>
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
                     facetcol={facetcol}
                     facetcolAsc={facetcolAsc}
                     group={group}
                     multiClick={multiClick}
                     clickedItems={clickedItems}
                     setClickedItems={setClickedItems}
                     z={null}
                     vertices={null}
                     normals={null}
                     itemSize={null}
                     s={null}
                     slide={slide}
                     groupColors={groupColors}
                     raisedItem={raisedItem}
                     setRaisedItem={setRaisedItem}
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
                     facetcol={facetcol}
                     facetcolAsc={facetcolAsc}
                     group={group}
                     multiClick={multiClick}
                     clickedItems={clickedItems}
                     setClickedItems={setClickedItems}
                     z={null}
                     vertices={null}
                     normals={null}
                     itemSize={null}
                     s={exprStringToFloat(d)}
                     slide={slide}
                     groupColors={groupColors}
                     raisedItem={raisedItem}
                     setRaisedItem={setRaisedItem}
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
                     facetcol={facetcol}
                     facetcolAsc={facetcolAsc}
                     group={group}
                     multiClick={multiClick}
                     clickedItems={clickedItems}
                     setClickedItems={setClickedItems}
                     z={zArray[i]}
                     vertices={null}
                     normals={null}
                     itemSize={null}
                     s={null}
                     slide={slide}
                     groupColors={groupColors}
                     raisedItem={raisedItem}
                     setRaisedItem={setRaisedItem}
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
                     facetcol={facetcol}
                     facetcolAsc={facetcolAsc}
                     group={group}
                     multiClick={multiClick}
                     clickedItems={clickedItems}
                     setClickedItems={setClickedItems}
                     z={null}
                     vertices={radarVertices(d)}
                     normals={radarNormals(d)}
                     itemSize={itemSize}
                     s={null}
                     slide={slide}
                     groupColors={groupColors}
                     raisedItem={raisedItem}
                     setRaisedItem={setRaisedItem}
                     />
          })}
          <OrbitControls
            ref={orbitRef}
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
      <div className='controls' id='cameraReset'>
        <button title='reset camera' className={'material-icons'} onClick={() => orbitRef.current.reset()} >flip_camera_ios</button>
      </div>
      <div id='topControls'>
        <div className='controls' id='spreadControls'>
          <Slider
            color='primary'
            onChange={e => setSlide(e.target.value)}
            defaultValue={0}
            valueLabelDisplay="auto"
            step={1}
            marks
            min={-2}
            max={2}
          />
        </div>
        <div className='controls' id='glyphControls'>
          <button title='box glyph' onClick={() => setGlyph('box')} className={glyph === 'box' ? 'material-icons active' : 'material-icons' }>square</button>
          <button title='expressiveness glyph' onClick={() => setGlyph('exp')} className={glyph === 'exp' ? 'material-icons active' : 'material-icons' }>aspect_ratio</button>
          <button title='iso glyph' onClick={() => setGlyph('iso')} className={glyph === 'iso' ? 'material-icons active' : 'material-icons' }>line_weight</button>
          <button title='radar glyph' onClick={() => setGlyph('radar')} className={glyph === 'radar' ? 'material-icons active' : 'material-icons' }>radar</button>
        </div>
        <div className='controls' id='colorControls'>
          <button title='group color shuffle' onClick={() => shuffleGroupColors(makeColorArray(50))} className={'material-icons'}>shuffle</button>
        </div>
      </div>
      <div id='bottomControls'>
        <div className='controls' id='facetControls'>
          <button title='facet 2D' className={facet === '2d' ? 'material-icons active' : 'material-icons'} onClick={() => setFacet('2d')} >dashboard</button>
          <button title='facet 3D' className={facet === '3d' ? 'material-icons active' : 'material-icons'} onClick={() => setFacet('3d')} >layers</button>
        </div>
        <div className='controls' id='axisMenus'>
          {model==='grid' &&
            <select value={xcol} onChange={e => setXcol(e.target.value)} title='x-axis'>
              <option value='colorGroupBinder'>binder</option>
              <option value='year'>year</option>
              <option value='thickness'>thickness</option>
              <option value='gloss'>gloss</option>
              <option value='color'>color</option>
              <option value='roughness'>roughness</option>
              <option value='expressiveness'>expressiveness</option>
              <option value='colorGroupMan'>manufacturer</option>
              <option value='colorGroupTextureWord'>texture description</option>
              <option value='colorGroupColorWord'>base color description</option>
              <option value='colorGroupGlossWord'>gloss description</option>
              <option value='colorGroupThickWord'>weight description</option>
            </select>
          }
          {model!=='grid' &&
            <select value={xcol} onChange={e => setXcol(e.target.value)} title='x-axis'>
              <option value='colorGroupBinder'>binder</option>
              <option value='year'>year</option>
              <option value='thickness'>thickness</option>
              <option value='gloss'>gloss</option>
              <option value='color'>color</option>
              <option value='roughness'>roughness</option>
              <option value='expressiveness'>expressiveness</option>
            </select>
          }
          <button className={xcolAsc ? 'material-icons active' : 'material-icons'} title='sort ascending' onClick={() => setXcolAsc(!xcolAsc)} >swap_vert</button>
          <select value={ycol} onChange={e => setYcol(e.target.value)} title='y-axis'>
            <option value='colorGroupBinder'>binder</option>
            <option value='year'>year</option>
            <option value='thickness'>thickness</option>
            <option value='gloss'>gloss</option>
            <option value='color'>color</option>
            <option value='roughness'>roughness</option>
            <option value='expressiveness'>expressiveness</option>
          </select>
          <button className={ycolAsc ? 'material-icons active' : 'material-icons'} title='sort ascending' onClick={() => setYcolAsc(!ycolAsc)} >swap_vert</button>
          <select value={zcol} onChange={e => setZcol(e.target.value)} title='z-axis'>
            <option value='none'>no z-axis</option>
            <option value='colorGroupBinder'>binder</option>
            <option value='year'>year</option>
            <option value='thickness'>thickness</option>
            <option value='gloss'>gloss</option>
            <option value='color'>color</option>
            <option value='roughness'>roughness</option>
            <option value='expressiveness'>expressiveness</option>
          </select>
          <button className={zcolAsc ? 'material-icons active' : 'material-icons'} title='sort ascending' onClick={() => setZcolAsc(!zcolAsc)} >swap_vert</button>
          <select value={group} onChange={e => setGroup(e.target.value)} title='glyph color'>
            <option value='colorGroupBinder'>binder</option>
            <option value='colorGroupMan'>manufacturer</option>
            <option value='colorGroupTextureWord'>texture description</option>
            <option value='colorGroupColorWord'>base color description</option>
            <option value='colorGroupGlossWord'>gloss description</option>
            <option value='colorGroupThickWord'>weight description</option>
            <option value='colorString'>color</option>
            <option value='colorStringSat'>saturation</option>
            <option value='colorStringHue'>hue</option>
            <option value='thickness'>thickness</option>
            <option value='gloss'>gloss</option>
            <option value='roughness'>roughness</option>
            <option value='expressiveness'>expressiveness</option>
            <option value='year'>year</option>
            <option value='radarColor'>radar group</option>
          </select>
          <select value={facetcol} onChange={e => setFacetCol(e.target.value)} title='facet group'>
            <option value='none'>no facet axis</option>
            <option value='expressivenessGroup'>expressiveness</option>
            <option value='isoGroup'>color and thickness</option>
            <option value='radarGroup'>radar group</option>
            <option value='colorGroupBinder'>binder</option>
            <option value='colorGroupMan'>manufacturer</option>
            <option value='colorGroupTextureWord'>texture description</option>
            <option value='colorGroupColorWord'>base color description</option>
            <option value='colorGroupGlossWord'>gloss description</option>
            <option value='colorGroupThickWord'>weight description</option>
          </select>
          <button className={facetcolAsc ? 'material-icons active' : 'material-icons'} title='sort ascending' onClick={() => setFacetcolAsc(!facetcolAsc)} >swap_vert</button>
        </div>
      </div>
      <div className='controls' id='plottypeControls'>
        <button title='grid montage' className={model === 'grid' ? 'material-icons active' : 'material-icons'} onClick={() => setModel('grid')} >apps</button>
        <button title='histogram' className={model === 'hist' ? 'material-icons active' : 'material-icons'} onClick={() => setModel('hist')} >bar_chart</button>
        <button title='scatter plot' className={model === 'scatter' ? 'material-icons active' : 'material-icons'} onClick={() => setModel('scatter')} >grain</button>
        <button title='cluster plot' className={model === 'gep75' ? 'material-icons active' : 'material-icons'} onClick={() => setModel('gep75')} >bubble_chart</button>
      </div>
      <div className='controls' id='filterControls'>
        <button title='filter' className={filter ? 'material-icons active' : 'material-icons'} onClick={() => setFilter(!filter)} >filter_alt</button>
      </div>
      <div id='toggleControls' className={toggleExpand ? 'toggleExpand' : 'toggleCollapse'}>
        <div id='checkboxes'>
          <label><input type="checkbox" checked={toggleLAB} onChange={() => setToggleLAB(!toggleLAB)}/>Lola Alvarez-Bravo</label>
          <label><input type="checkbox" checked={toggleHC} onChange={() => setToggleHC(!toggleHC)}/>Harry Callahan</label>
          <label><input type="checkbox" checked={toggleAS} onChange={() => setToggleAS(!toggleAS)}/>August Sander</label>
          <label><input type="checkbox" checked={toggleMR} onChange={() => setToggleMR(!toggleMR)}/>Man Ray</label>
        </div>
        {!toggleExpand && <button title='toggle' className={( toggleMR || toggleAS || toggleHC || toggleLAB ) ? 'material-icons active' : 'material-icons'} style={{paddingRight: '3vh'}} onClick={() => setToggleExpand(true)} >check_box</button>}
        {toggleExpand && <button title='toggle' className={( toggleMR || toggleAS || toggleHC || toggleLAB ) ? 'material-icons active' : 'material-icons'} onClick={() => setToggleExpand(false)} >close</button>}
      </div>
    </div>
  )
}
