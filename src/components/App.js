import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Object3D, Color, MOUSE, DoubleSide } from 'three';
import { useSpring } from '@react-spring/three';
import { Switch, Slider } from '@mui/material';
import { bin } from 'd3-array';
import { orderBy, compact, max, min, cloneDeep, intersection } from 'lodash';
import { data } from './data';

const missingDminHexIdxs = [];
const missingDminHexes = [];
data['dminHex'].forEach((d,i) => {
  if ( d === '' ) {
    missingDminHexIdxs.push(i);
    missingDminHexes.push(d);
  }
});

/*Misc functions--------------------------------------------------------------*/

function returnDomain() {
  const production = process.env.NODE_ENV === 'production';
  return production ? '' : 'http://localhost:8000/'
}

const n = data['idx'].length; // nrows in data; 'idx' could be any column

// parse and round measurement values in `data`
data['year'] = data['year'].map(d => parseInt(d));
data['thickness'] = data['thickness'].map(d => parseFloat(parseFloat(d).toFixed(3)));
data['gloss'] = data['gloss'].map(d => parseFloat(parseFloat(d).toFixed(3)));
data['roughness'] = data['roughness'].map(d => parseFloat(parseFloat(d).toFixed(3)));
data['dmin'] = data['dmin'].map(d => parseFloat(parseFloat(d).toFixed(3)));
data['dmax'] = data['dmax'].map(d => parseFloat(parseFloat(d).toFixed(3)));

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

console.log(thicknessMin,thicknessMax);

/*
const randomRGB = () => {
  const rgbString = "rgb(" + parseInt(Math.random() * 255) + "," + parseInt(Math.random() * 255) + "," + parseInt(Math.random() * 255) + ")"
  return rgbString
};
*/

// colors, between 50 and 85 lightness, chosen for name uniqueness, using Colorgorical
// had to eliminate two colors [#f228a0,#f24219] because they were too close to our highlight magenta
let categoricalColors = [
  "#78b4c6", "#c66a5a", "#52dea9", "#b5a3cf", "#a1d832", "#f59ae7", "#698e4e", 
  "#f4bb8f", "#00d618", "#2282f5", "#f24219", "#9a63ff", "#fe8f06", "#9d7f50", "#f4d403"];

let categoricalColorArray;
function makeColorArray() {
  categoricalColorArray = categoricalColors.sort(function () {
    return Math.random() - 0.5;
  });

  const lastColor = categoricalColorArray[categoricalColorArray.length - 1];
  const lastColorArray = Array.from({length: 600}, () => lastColor); // there are 600 distinct 'bran' values, so we are adding 600 here to be safe
  categoricalColorArray = [...categoricalColorArray, ...lastColorArray];

  return categoricalColorArray
}

const initialGroupColors = makeColorArray();

/*
function makeColorArray(k) {
  const colorArray = Array.from({length: k}, () => randomRGB());
  return colorArray
}
*/

/*Color groups----------------------------------------------------------------*/

// for making integer labels for character-variable groups, used in glyph group colors
function makeGroupLabels(groupCol) {
  const groupColFiltered = groupCol.filter(d => d !== '_');
  const valCounts = valueCounts(groupColFiltered);
  let valCountsList = [];
  Object.keys(valCounts).forEach(key => {
    const scratchObject = {};
    scratchObject['groupValue'] = key;
    scratchObject['frequency'] = valCounts[key];
    valCountsList.push(scratchObject);
  });

  valCountsList = orderBy(valCountsList,'frequency', 'desc');
  const mapGroupValueToInteger = {};
  valCountsList.forEach((d,i) => {
    mapGroupValueToInteger[d['groupValue']] = i;
  });
  mapGroupValueToInteger['_'] = 9999;
  
  return groupCol.map(d => mapGroupValueToInteger[d])
}

data['radarColor'] = makeGroupLabels(data['radarGroup']);
data['colorGroupColorWord'] = makeGroupLabels(data['colorWord']);
data['colorGroupThickWord'] = makeGroupLabels(data['thicknessWord']);
data['colorGroupTextureWord'] = makeGroupLabels(data['textureWord']);
data['colorGroupGlossWord'] = makeGroupLabels(data['glossWord']);
data['colorGroupMan'] = makeGroupLabels(data['man']);
data['colorGroupBran'] = makeGroupLabels(data['bran']);
data['colorGroupColl'] = makeGroupLabels(data['coll']);

/*Metadata value counts-------------------------------------------------------*/

function valueCounts(col, normalized = true) {
  const occurrences = col.reduce(function (acc, curr) {
    return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc
  }, {});
  
  if (normalized) {

    if (Object.keys(occurrences).length === 1) {
      Object.keys(occurrences).forEach(key => {
        occurrences[key] = 1;
      });
    } else {
      const countMin = min(Object.values(occurrences));
      const countMax = max(Object.values(occurrences));
      if (countMin === countMax) {
        Object.keys(occurrences).forEach(key => {
          occurrences[key] = 0.5; // all middle gray
        });
      } else {
        Object.keys(occurrences).forEach(key => {
          occurrences[key] = (occurrences[key] - countMin) / (countMax - countMin);
        });
      }
    }
  }
  
  return occurrences
}

const thicknessValCounts = valueCounts(data['thicknessWord']);
const colorValCounts = valueCounts(data['colorWord']);
const textureValCounts = valueCounts(data['textureWord']);
const glossValCounts = valueCounts(data['glossWord']);
const manValCounts = valueCounts(data['man']);
const branValCounts = valueCounts(data['bran']);
const radarGroupValCounts = valueCounts(data['radarGroup']);

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
const zArray = isoGroupArray.map(d => d === "" ? 0 : d.split('_')[0]==='0' ? 0.05 : d.split('_')[0]==='1' ? 0.25 : d.split('_')[0]==='2' ? 0.5 : 0.75);

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

  if ( glyphGroup === "" ) {
    thick = 0;
    rough = 0;
    gloss = 0;
    color = 0;
  }

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

function getUniverse(dataU) {
  return [
      min(dataU['dmin']),
      max(dataU['dmin']),
      min(dataU['thickness']),
      max(dataU['thickness']),
      min(dataU['roughness']),
      max(dataU['roughness']),
      min(dataU['gloss']),
      max(dataU['gloss'])
    ]
}

function uScale(uMin,uMax,val) {
  const uRange = uMax - uMin;
  return (val - uMin) / uRange
}

function rankTransform(arr) {
  
  const nanReplace = arr.map(x => isNaN(x) ? 9999 : x); // 9999 is a value that will never be used
  const sorted = [...nanReplace].sort((a, b) => a - b); // since NaNs (as 9999s) end up at the *end* and not the beginning, they don't affect the rank indices we collect in the next line
  return nanReplace.map(x => x === 9999 ? NaN : sorted.indexOf(x)) // switch 9999 back to NaN after sorting
 
}

const dataU = {
  dmin: rankTransform(data['dmin']),
  thickness: rankTransform(data['thickness']),
  roughness: rankTransform(data['roughness']),
  gloss: rankTransform(data['gloss'])
};

const universe = getUniverse(dataU);

const checkNaN = d => !isNaN(d);

function polygonPoints(dataU, clickedItem, svgSide) {

    let p1,p2,p3,p4;

    p1 = dataU['dmin'][clickedItem];
    p2 = dataU['thickness'][clickedItem];
    p3 = dataU['roughness'][clickedItem];
    p4 = dataU['gloss'][clickedItem];

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

    const polygonPointList = [];
    if ( [p1x,p1y].every(checkNaN) ) {
      polygonPointList.push(p1x.toString()+','+p1y.toString());
    }

    if ( [p2x,p2y].every(checkNaN) ) {
      polygonPointList.push(p2x.toString()+','+p2y.toString());
    }

    if ( [p3x,p3y].every(checkNaN) ) {
      polygonPointList.push(p3x.toString()+','+p3y.toString());
    }

    if ( [p4x,p4y].every(checkNaN) ) {
      polygonPointList.push(p4x.toString()+','+p4y.toString());
    }

    const s = polygonPointList.join(' ');

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

function makeGrid(xcol,xcolAsc,spreadSlide) {
  let sortingArray = [];
  const ncolsSquare = Math.ceil(Math.sqrt(n));
  const ncolsIncrement = Math.ceil(ncolsSquare / 5);
  const ncols = spreadSlide === -2 ? ncolsSquare - ncolsIncrement * 2 : spreadSlide === -1 ? ncolsSquare - ncolsIncrement : spreadSlide === 0 ? ncolsSquare : spreadSlide === 1 ? ncolsSquare + ncolsIncrement : ncolsSquare + ncolsIncrement * 2;
  const gridArray = gridCoords(n,ncols);

  data[xcol].forEach((item, i) => {
   //sortingArray[i] = { 'idx': i, 'val': parseFloat(item) }
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

function makeHist(xcol,xcolAsc,ycol,ycolAsc,spreadSlide,columnsPerBin) {

  let scratchArray = [];

  data[xcol].forEach((item, i) => {
    //scratchArray[i] = { 'idx': i, 'val': parseFloat(item), 'ycol': parseFloat(data[ycol][i]) }
    scratchArray[i] = { 'idx': i, 'val': item, 'ycol': data[ycol][i] }
  });

  const histBinsMid = 200;
  const histBinsIncrement = 50;
  const histBins = spreadSlide === -2 ? histBinsMid - histBinsIncrement * 2 : spreadSlide === -1 ? histBinsMid - histBinsIncrement : spreadSlide === 0 ? histBinsMid : spreadSlide === 1 ? histBinsMid + histBinsIncrement : histBinsMid + histBinsIncrement * 2;

  const std = getStandardDeviation(scratchArray.map(d => d.val));
  const arrmax = max(scratchArray.map(d => d.val)); // lodash max ignores null/NaN values
  const binner = bin().thresholds(histBins).value(d => isNaN(d.val) ? arrmax + std : d.val); // if val is null, put it one standard deviation above the max
  const binnedData = binner(scratchArray);

  if ( xcolAsc === false ) {
    binnedData.reverse();
  }

  scratchArray = [];
  binnedData.forEach((bin, binidx) => {
    if (bin.length > 0) { // ignores x0 and x1, the bin edges (which are included for every bin)
      bin = orderBy(bin,['ycol'],[ycolAsc ? 'asc' : 'desc'])
      bin.forEach((item, itemidx) => {
        let x, y;
        if ( columnsPerBin === 1 ) { // 1 is a special case because there is no empty space between bins
          x = binidx;
          x = x - (binnedData.length - 1) / 2; // x adjustment because we center the histogram at (0,0)
          y = itemidx === 0 ? 0 : itemidx % 2 === 0 ? -1 * itemidx/2 : Math.ceil(itemidx/2); // we plot both above and below the x axis, so we alternate between positive and negative values
        } else { // all other cases require a space between bins
          const zeroPoint = binidx * ( columnsPerBin + 1 );
          const col = itemidx % columnsPerBin; // simple alternation between 0 and 1
          
          y = itemidx < 2 ? 0 : Math.round(itemidx / (columnsPerBin * 2)); // produces 0,0,1,1,1,1,2,2,2,2,... when columnsPerBin = 2
          const ySign = Math.floor(itemidx / (columnsPerBin * 2)) === y ? 1 : -1; // the smaller two (out of 4) end up y-1 after flooring, the larger ones y
          y = ySign * y;
          
          x = zeroPoint + col;
          x = x - (binnedData.length - 1) * ( columnsPerBin + 1 ) / 2; // x adjustment because we center the histogram at (0,0)
        }
        scratchArray.push({'pos':[x, y, 0],'idx':item.idx});
      });
    }
  });
  scratchArray = orderBy(scratchArray,['idx'],['asc']);
  return scratchArray.map(d => d.pos)
}

function featureScale(col) {
  const colmin = min(col);
  const colmax = max(col);
  const colrange = colmax - colmin;
  const adjCol = col.map(d => isNaN(d) ? 2 : (d - colmin) / colrange) // if d is NaN, we send it outside the normed max (which is 1)

  return adjCol;
}

function makeScatter(xcol,xcolAsc,ycol,ycolAsc,zcol,zcolAsc,spreadSlide) {
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
  const scatterFactor = spreadSlide === -2 ? scatterFactorMid - scatterFactorIncrement * 2 : spreadSlide === -1 ? scatterFactorMid - scatterFactorIncrement : spreadSlide === 0 ? scatterFactorMid : spreadSlide === 1 ? scatterFactorMid + scatterFactorIncrement : scatterFactorMid + scatterFactorIncrement * 2;

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
const missingColor = 0xcc4700;
const missingColorTone = 0xffffff;
const colorSubstrate = new Color();
const continuousColorCols = ['thickness','gloss','roughness','expressiveness','year'];
const groupColorCols = ['colorGroupColl','colorGroupMan','colorGroupBran','colorGroupThickWord','colorGroupGlossWord',
                        'colorGroupColorWord','colorGroupTextureWord','radarColor'];
let colorVals; //this gets used in many places

function valToColor(arr) {
  
  //arr = arr.map(d => parseFloat(d)); // empty strings and underscores are converted to NaN
  arr = arr.map(d => d);
  const arrRanked = rankTransform(arr); // returns `arr` with ranks, and keeps NaNs as they are
  
  // these functions, from lodash, ignore NaNs
  const arrmax = max(arrRanked);
  const arrmin = min(arrRanked);
  const arrrange = arrmax - arrmin;
  
  const arrnorm = arrRanked.map(d => (d - arrmin) / arrrange);
  const arrhsl = arrnorm.map(d => isNaN(d) ? missingColor : "hsl(0,0%," + parseInt(d*100).toString() + "%)");

  return arrhsl
}

/*instancedMesh---------------------------------------------------------------*/

const meshList = {};
let targetCoords;

function applyFilterColors( globalIndex, colorSubstrate, filter, group, filterIdxList ) {

  const baseColorOffsetS = 0.2;
  const baseColorOffsetL = -0.2;
  const toneOffsetS = 0.1;
  const toneOffsetL = -0.1;
  const grayOffsetL = -0.2;

  if ( filter ) {
    if ( group === 'dminHex' ) {
      if ( filterIdxList.includes(globalIndex) ) {
        colorSubstrate.offsetHSL(0, baseColorOffsetS, baseColorOffsetL);
      } else {
        if ( missingDminHexIdxs.includes(globalIndex) ) {
          colorSubstrate.offsetHSL(0, 0, grayOffsetL); // gray
        } else {
          colorSubstrate.set(0x4a4a4a);
          colorSubstrate.offsetHSL(0, 0, grayOffsetL);
          //colorSubstrate.offsetHSL(0, -0.2, -0.8); // cool darkening effect that doesn't work when the color is already dark
        }
      } 
    } else if ( group === 'dmaxHex' ) {
      if ( filterIdxList.includes(globalIndex) ) {
        colorSubstrate.offsetHSL(0, toneOffsetS, toneOffsetL);
      } else {
        colorSubstrate.set(0x4a4a4a);
        colorSubstrate.offsetHSL(0, 0, grayOffsetL);
      }
    } else if ( groupColorCols.includes(group) ) {
      if ( filterIdxList.includes(globalIndex) ) {
        colorSubstrate.offsetHSL(0, 0, -0.2);
      } else {
        colorSubstrate.set(0x4a4a4a);
        colorSubstrate.offsetHSL(0, 0, grayOffsetL);
      }
    } else if ( continuousColorCols.includes(group) ) {
      if ( filterIdxList.includes(globalIndex) ) {
        colorSubstrate.set(0x63aaff);
        colorSubstrate.offsetHSL(0, 0.2, -0.2);
      }
    } 
  } else {
    if ( group === 'dminHex' ) {
      if ( missingDminHexIdxs.includes(globalIndex) ) {
        colorSubstrate.offsetHSL(0, 0, grayOffsetL); // gray
      } else {
        colorSubstrate.offsetHSL(0, baseColorOffsetS, baseColorOffsetL);
      }
    } else if ( group === 'dmaxHex' ) {
      colorSubstrate.offsetHSL(0, toneOffsetS, toneOffsetL);
    } else if ( groupColorCols.includes(group) ) {
      colorSubstrate.offsetHSL(0, 0, -0.2);
    }
  }
}

function getColorVal( groupColors, colorVals, item ) {

  let colorVal = colorVals[item];
  if ( colorVal === 9999 ) {
    return 0x000000;
  } else {
    return groupColors[colorVals[item]] || colorVals[item];
  }
}

function Glyphs({ 
  glyphMap, glyphGroup, glyph, model, xcol, xcolAsc, ycol, ycolAsc, zcol, zcolAsc, 
  facetcol, facetcolAsc, group, multiClick, clickedItems, setClickedItems, z, 
  vertices, normals, itemSize, s, spreadSlide, groupColors, raisedItem, setRaisedItem, 
  filter, filterIdxList, invalidateSignal 
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
      targetCoords = makeGrid(xcol,xcolAsc,spreadSlide);
    } else if ( model === 'hist' ) {
      const columnsPerBin = xcol === 'year' ? 3 : 1;
      targetCoords = makeHist(xcol,xcolAsc,ycol,ycolAsc,spreadSlide,columnsPerBin);
    } else if ( model === 'scatter' ) {
      targetCoords = makeScatter(xcol,xcolAsc,ycol,ycolAsc,zcol,zcolAsc,spreadSlide);
    } else if ( model === 'gep' ) {
      let gepCoords = spreadSlide === -2 ? 'gep100' : spreadSlide === -1 ? 'gep150' : spreadSlide === 0 ? 'gep200' : spreadSlide === 1 ? 'gep250' : 'gep300';
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

  }, [model, xcol, xcolAsc, ycol, ycolAsc, zcol, zcolAsc, facetcol, facetcolAsc, spreadSlide, raisedItem])

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
  }, [model, xcol, xcolAsc, ycol, ycolAsc, zcol, zcolAsc, facetcol, facetcolAsc, spreadSlide, raisedItem]);

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
                setClickedItems([...clickedItems, globalInstanceId]);
              } else { // if already clicked, unclick
                colorSubstrate.set(colorVal);
                applyFilterColors(globalIndex, colorSubstrate, filter, group, filterIdxList);
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

function getDetailImageString(texture,i) {
  const coll = data['coll'][i];
  const collString = coll.includes('lml') ? '' : coll+'_';
  const idx = data['idx'][i];
  const detailFolder = texture ? collString + 'texture' : coll==='lml' ? 'packages_2048' : collString + 'prints'; // modify once sample book images are available
  const detailImgString = returnDomain() + detailFolder + '/' + idx + '.jpg';

  return detailImgString;
}

function getHoverInfo(clickedItem) {
  const radarGroup = data['radarGroup'][clickedItem];
  const thickness = data['thickness'][clickedItem];
  const color = data['dmin'][clickedItem];
  const dminHex = data['dminHex'][clickedItem];
  const gloss = data['gloss'][clickedItem];
  const roughness = data['roughness'][clickedItem];

  return clickedItem + ' [' + radarGroup + ']' + '  mm:' + thickness + '  b*:' + color + '  rgb:' + dminHex + '  GU:' + gloss + '  std:' + roughness
}

function PanelItem({
  clickedItem,
  clickedItems,
  setClickedItems,
  multiClick,
  glyph,
  groupColors,
  briefMode,
  textMode,
  raisedItem,
  setRaisedItem,
  gridMode,
  infoPanelFontSize,
  backgroundColor,
  texture,
  packageImage,
  svgRadar,
  smallItem,
  detailScreen,
  setDetailScreen,
  detailImageStringState,
  setDetailImageStringState,
  setDetailImageIndex,
  filter,
  group,
  filterIdxList,
  invalidateSignal,
  setInvalidateSignal,
}) {

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
          const colorVal = getColorVal(groupColors,colorVals,globalIndex);
          colorSubstrate.set(colorVal);
          applyFilterColors(globalIndex, colorSubstrate, filter, group, filterIdxList);
          mesh.setColorAt(j, colorSubstrate);
        });
        mesh.instanceColor.needsUpdate = true;
      });

      setClickedItems([]);

    } else {

      Object.keys(glyphMap).forEach((item, i) => {
        const mesh = meshList[item];
        glyphMap[item].forEach((globalIndex, j) => {
          const colorVal = getColorVal(groupColors,colorVals,globalIndex);
          // if the item we are considering in this loop iteration is not identical to the item we just clicked
          // basically, this case handles items that need to be set to whatever color they had before
          if ( clickedItem !== globalIndex ) {
            // if the item we're considering in this loop iteration is not already clicked, set to its normal color
            if ( !clickedItems.includes(globalIndex) ) {
              colorSubstrate.set(colorVal);
              applyFilterColors(globalIndex, colorSubstrate, filter, group, filterIdxList);
              mesh.setColorAt(j, colorSubstrate);
            } else { // but if it is clicked, set to highlight color
              colorSubstrate.set(highlightColor);
              mesh.setColorAt(j, colorSubstrate);
            }
          } else if ( clickedItem === globalIndex ) { // loop iteration item IS ALSO the item we just clicked
              colorSubstrate.set(colorVal);
              applyFilterColors(globalIndex, colorSubstrate, filter, group, filterIdxList);
              mesh.setColorAt(j, colorSubstrate);
          }
        });
        mesh.instanceColor.needsUpdate = true;
      });
      setClickedItems(clickedItems.filter(d => d!==clickedItem));
    }
    setInvalidateSignal(!invalidateSignal);
  }

  const handlePanelItemClick = e => {
    e.stopPropagation();

    if ( clickedItem !== raisedItem ) {
      setRaisedItem(clickedItem);
    } else {
      setRaisedItem(null);
    }
  }

  const coll = data['coll'][clickedItem];
  const collString = coll.includes('lml') ? '' : coll+'_';
  const idx = data['idx'][clickedItem];
  const textureThumbSize = smallItem ? 256 : 512;
  const imgThumbSize = coll.includes('lml') ? smallItem ? 512 : 1024 : smallItem ? 256 : 512;
  const printFolder = coll.includes('lml') ? 'packages' : collString + 'prints_crop';

  const imgStringTexture = returnDomain() + collString + 'texture_' + textureThumbSize + '/' + idx + '.jpg';
  const imgString = returnDomain() + printFolder + '_' + imgThumbSize + '/' + idx + '.jpg';
  const detailImgString = getDetailImageString(texture,clickedItem);

  const svgSide = smallItem ? window.innerWidth * 0.042 : window.innerWidth * 0.09;
  const sSixth = svgSide / 6;
  const sThird = svgSide / 3;
  const sHalf = svgSide / 2;
  const sTwoThird = svgSide * 2/3;
  const sFiveSixth = svgSide * 5/6;

  const stroke = "#595959";

  return (
    <div className={gridMode && smallItem ? 'panelItem gridModeSmall' : gridMode && !smallItem ? 'panelItem gridMode' : 'panelItem listMode'} title={getHoverInfo(clickedItem)} onClick={handlePanelItemClick} style={backgroundColor ? {backgroundColor: data['dminHex'][clickedItem]} : texture ? { backgroundImage: `url(${imgStringTexture})`, backgroundPosition: 'center' } : packageImage ? { backgroundImage: `url(${imgString})`, backgroundPosition: 'center' } : svgRadar ? {backgroundColor: 'var(--yalemidgray)'} : {backgroundColor: 'var(--yalewhite)'}}>
      {svgRadar && <svg xmlns="http://www.w3.org/2000/svg" width={svgSide} height={svgSide} >

          <line x1={sHalf} y1={0} x2={sHalf} y2={svgSide} stroke={stroke} />
          <line x1={0} y1={sHalf} x2={svgSide} y2={sHalf} stroke={stroke} />

          <line x1={sHalf} y1={0} x2={svgSide} y2={sHalf} stroke={stroke} />
          <line x1={svgSide} y1={sHalf} x2={sHalf} y2={svgSide} stroke={stroke} />
          <line x1={sHalf} y1={svgSide} x2={0} y2={sHalf} stroke={stroke} />
          <line x1={0} y1={sHalf} x2={sHalf} y2={0} stroke={stroke} />

          <line x1={sHalf} y1={sSixth} x2={sFiveSixth} y2={sHalf} stroke={stroke} />
          <line x1={sFiveSixth} y1={sHalf} x2={sHalf} y2={sFiveSixth} stroke={stroke} />
          <line x1={sHalf} y1={sFiveSixth} x2={sSixth} y2={sHalf} stroke={stroke} />
          <line x1={sSixth} y1={sHalf} x2={sHalf} y2={sSixth} stroke={stroke} />

          <line x1={sHalf} y1={sThird} x2={sTwoThird} y2={sHalf} stroke={stroke} />
          <line x1={sTwoThird} y1={sHalf} x2={sHalf} y2={sTwoThird} stroke={stroke} />
          <line x1={sHalf} y1={sTwoThird} x2={sThird} y2={sHalf} stroke={stroke} />
          <line x1={sThird} y1={sHalf} x2={sHalf} y2={sThird} stroke={stroke} />

          <polygon points={polygonPoints(dataU,clickedItem,svgSide)} stroke={"none"} fill={"#63aaff"} fillOpacity={0.5} />

        </svg>}
      <button title='remove from selection' className='selectionRemove material-icons' onClick={handleRemove} >cancel</button>
      <button title='open detail panel' className='openDetailScreen material-icons' onClick={(e) => {e.stopPropagation(); setDetailScreen(true); setDetailImageStringState(detailImgString); setDetailImageIndex(clickedItem);}} >open_in_full</button>
      {textMode && <div className={svgRadar ? 'allText fixedOverlay' : 'allText'} >
        {!briefMode && <div className={infoPanelFontSize===1 ? 'catalogSmall' : infoPanelFontSize===2 ? 'catalogMid' : 'catalog'}>
          <p>{data['catalog'][clickedItem]==='_' ? '#' : '#' + data['catalog'][clickedItem]}</p>
        </div>}
        <div className='titleBar'>
          <p className={infoPanelFontSize===1 && ( svgRadar || packageImage ) ? 'titleBarSmall man lightman' : infoPanelFontSize===1 && !svgRadar && !packageImage ? 'titleBarSmall man' : infoPanelFontSize===2 && ( svgRadar || packageImage ) ? 'titleBarMid man lightman' : infoPanelFontSize===2 && !svgRadar && !packageImage ? 'titleBarMid man' : ( svgRadar || packageImage ) ? 'man lightman' : 'man'}>{data['man'][clickedItem]}</p>
          <p className={infoPanelFontSize===1 ? 'titleBarSmall bran' : infoPanelFontSize===2 ? 'titleBarMid bran' : 'bran'}>{data['bran'][clickedItem]==='_' ? '' : data['bran'][clickedItem]}</p>
          <p className={infoPanelFontSize===1 ? 'titleBarSmall year' : infoPanelFontSize===2 ? 'titleBarMid year' : 'year'}>{isNaN(data['year'][clickedItem]) ? '' : data['year'][clickedItem]}</p>
        </div>
        {!briefMode && <div className='infoBar'>
            {writeInfoArray(clickedItem).map((d,i) => <p className={infoPanelFontSize===1 ? 'boxWordSmall' : infoPanelFontSize===2 ? 'boxWordMid' : 'boxWord'} style={blankInfo ? {color:'transparent'} : !backgroundColor && !texture ? {color:'#969696'} : {color:'var(--yalemidlightgray)'}} key={i}>{d}</p>)}
        </div>}
      </div>}
    </div>
  )
}

/*App-------------------------------------------------------------------------*/

let sliderKey = 0; // a hack to reset all sliders with `removeAllFilters`

console.log(data);

export default function App() {
  const [toggleMR, setToggleMR] = useState(true);
  const [toggleLMN, setToggleLMN] = useState(false);
  const [toggleAS, setToggleAS] = useState(false);
  const [toggleHC, setToggleHC] = useState(false);
  const [toggleLAB, setToggleLAB] = useState(true);
  const [toggleRM, setToggleRM] = useState(false);

  const [model, setModel] = useState('grid');
  const [xcol, setXcol] = useState('dmin');
  const [ycol, setYcol] = useState('thickness');
  const [zcol, setZcol] = useState('none');
  const [facet, setFacet] = useState('3d');
  const [facetcol, setFacetCol] = useState('none');
  const [facetcolAsc, setFacetcolAsc] = useState(true);
  const [xcolAsc, setXcolAsc] = useState(true);
  const [ycolAsc, setYcolAsc] = useState(true);
  const [zcolAsc, setZcolAsc] = useState(true);
  const [group, setGroup] = useState('dminHex');
  
  const [clickedItems, setClickedItems] = useState([]);
  const [multiClick, setMultiClick] = useState(false);
  const [gridMode, setGridMode] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const [briefMode, setBriefMode] = useState(false);
  const [textMode, setTextMode] = useState(true);
  const [infoPanelFontSize, setInfoPanelFontSize] = useState(3);
  const [smallItem, setSmallItem] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(false);
  const [texture, setTexture] = useState(false);
  const [svgRadar, setSvgRadar] = useState(false);
  const [packageImage, setPackageImage] = useState(false);
  const [glyph, setGlyph] = useState('box');
  const [spreadSlide, setSpreadSlide] = useState(0);
  const [groupColors, setGroupColors] = useState(initialGroupColors);
  const [raisedItem, setRaisedItem] = useState(null);
  const itemSize = 3;

  const [filter, setFilter] = useState(false);
  const [filterList, setFilterList] = useState({'coll':[],'photoProcess':[],'year':[],'man':[],'bran':[],'thickness':[],'thicknessWord':[],'dmin':[],'colorWord':[],'roughness':[],'textureWord':[],'gloss':[],'glossWord':[],'radarGroup':[]});
  const [filterIdxList, setFilterIdxList] = useState([]);
  const [filterModal, setFilterModal] = useState('closed');
  const [filterLightMode, setFilterLightMode] = useState(false);
  const [manExpand, setManExpand] = useState(false);
  const [branExpand, setBranExpand] = useState(false);
  const [yearSlide, setYearSlide] = useState([yearMin,yearMax]);
  const [thicknessSlide, setThicknessSlide] = useState([thicknessMin,thicknessMax]);
  const [colorSlide, setColorSlide] = useState([colorMin,colorMax]);
  const [toneSlide, setToneSlide] = useState([toneMin,toneMax]);
  const [roughnessSlide, setRoughnessSlide] = useState([roughnessMin,roughnessMax]);
  const [glossSlide, setGlossSlide] = useState([glossMin,glossMax]);
  const [yearSlideMarks, setYearSlideMarks] = useState(null);
  const [thicknessSlideMarks, setThicknessSlideMarks] = useState(null);
  const [colorSlideMarks, setColorSlideMarks] = useState(null);
  const [toneSlideMarks, setToneSlideMarks] = useState(null);
  const [roughnessSlideMarks, setRoughnessSlideMarks] = useState(null);
  const [glossSlideMarks, setGlossSlideMarks] = useState(null);
  const [filteredThicknessFrequencies, setFilteredThicknessFrequencies] = useState(thicknessValCounts);
  const [filteredColorFrequencies, setFilteredColorFrequencies] = useState(colorValCounts);
  const [filteredTextureFrequencies, setFilteredTextureFrequencies] = useState(textureValCounts);
  const [filteredGlossFrequencies, setFilteredGlossFrequencies] = useState(glossValCounts);
  const [filteredManFrequencies, setFilteredManFrequencies] = useState(manValCounts);
  const [filteredBranFrequencies, setFilteredBranFrequencies] = useState(branValCounts);
  const [filteredRadarGroupFrequencies, setFilteredRadarGroupFrequencies] = useState(radarGroupValCounts);

  const [detailScreen,setDetailScreen] = useState(false);
  const [detailImageStringState,setDetailImageStringState] = useState('');
  const [detailImageIndex, setDetailImageIndex] = useState('');
  const [invalidateSignal, setInvalidateSignal] = useState(false);

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

  useLayoutEffect(() => {

    const workingIdxList = filterIdxList.length === 0 && filter ? [] : filterIdxList.length === 0 && !filter ? data['idx'].map((_,i) => i) : filterIdxList;

    const filteredThicknessValCounts = valueCounts(data['thicknessWord'].filter((_,i) => workingIdxList.includes(i)));
    const filteredColorValCounts = valueCounts(data['colorWord'].filter((_,i) => workingIdxList.includes(i)));
    const filteredTextureValCounts = valueCounts(data['textureWord'].filter((_,i) => workingIdxList.includes(i)));
    const filteredGlossValCounts = valueCounts(data['glossWord'].filter((_,i) => workingIdxList.includes(i)));
    const filteredManValCounts = valueCounts(data['man'].filter((_,i) => workingIdxList.includes(i)));
    const filteredBranValCounts = valueCounts(data['bran'].filter((_,i) => workingIdxList.includes(i)));
    const filteredRadarGroupValCounts = valueCounts(data['radarGroup'].filter((_,i) => workingIdxList.includes(i)));

    setFilteredThicknessFrequencies(filteredThicknessValCounts);
    setFilteredColorFrequencies(filteredColorValCounts);    
    setFilteredTextureFrequencies(filteredTextureValCounts);
    setFilteredGlossFrequencies(filteredGlossValCounts);
    setFilteredManFrequencies(filteredManValCounts);
    setFilteredBranFrequencies(filteredBranValCounts);
    setFilteredRadarGroupFrequencies(filteredRadarGroupValCounts);

    const filteredYears = data['year'].filter((_,i) => workingIdxList.includes(i));
    const filteredThicknesses = data['thickness'].filter((_,i) => workingIdxList.includes(i));
    const filteredColors = data['dmin'].filter((_,i) => workingIdxList.includes(i));
    const filteredTones = data['dmax'].filter((_,i) => workingIdxList.includes(i));
    const filteredRoughnesses = data['roughness'].filter((_,i) => workingIdxList.includes(i));
    const filteredGlosses = data['gloss'].filter((_,i) => workingIdxList.includes(i));

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
    
  },[filterIdxList]);
  
  const handleDetailScreenNav = e => {

    e.stopPropagation();
    const label = e.target.innerText;
    const clickedItemsPositionIndex = clickedItems.findIndex(d => d === detailImageIndex);

    let newClickedItemsPositionIndex;
    if ( label === 'navigate_before' ) {
      newClickedItemsPositionIndex = clickedItemsPositionIndex - 1;
    } else if ( label === 'navigate_next' ) {
      newClickedItemsPositionIndex = clickedItemsPositionIndex + 1;
    }

    if ( newClickedItemsPositionIndex >= 0 && newClickedItemsPositionIndex <= clickedItems.length - 1 ) {
      const newDetailImageIndex = clickedItems[newClickedItemsPositionIndex];
      setDetailImageIndex(newDetailImageIndex);

      const newDetailImageString = getDetailImageString(texture,newDetailImageIndex);
      setDetailImageStringState(newDetailImageString);
    }
  }

  const sliderMap = {
    'year':[yearSlide,yearMin,yearMax],
    'thickness':[thicknessSlide,thicknessMin,thicknessMax],
    'dmin':[colorSlide,colorMin,colorMax],
    'dmax':[toneSlide,toneMin,toneMax],
    'roughness':[roughnessSlide,roughnessMin,roughnessMax],
    'gloss':[glossSlide,glossMin,glossMax]
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
      glossSlide[0] === glossMin && glossSlide[1] === glossMax ) {
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
      keepers = data['idx'].map((_,i) => i);
    }

    let newFilterIdxList = [];

    // this is getting OR for each filter category
    Object.keys(newFilterList).forEach((cat, i) => {
      let catList = []; // probably not necessary to initialize as a list but whatevs
      if ( newFilterList[cat].length === 0 ) {
        catList = data['coll'].map((_,i) => i).filter(d => keepers.includes(d));
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

    if ( addMode === 'queue' ) {
      setClickedItems([...clickedItems,...filterIdxList]);
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
      'coll':[],
      'photoProcess':[],
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
      'radarGroup':[]
    });
    
    setFilter(false);

    setYearSlide([yearMin,yearMax]);
    setThicknessSlide([thicknessMin,thicknessMax]);
    setColorSlide([colorMin,colorMax]);
    setToneSlide([toneMin,toneMax]);
    setRoughnessSlide([roughnessMin,roughnessMax]);
    setGlossSlide([glossMin,glossMax]);
    sliderKey+=1;

  };

  useEffect(() => {
    if ( detailScreen ) {
      function advanceNav(e) {
        const keyCode = e.keyCode;
        const clickedItemsPositionIndex = clickedItems.findIndex(d => d === detailImageIndex);
        let newClickedItemsPositionIndex;
        if ( keyCode === 37 ) {
          newClickedItemsPositionIndex = clickedItemsPositionIndex - 1;
        } else if ( keyCode === 39 ) {
          newClickedItemsPositionIndex = clickedItemsPositionIndex + 1;
        }

        if ( newClickedItemsPositionIndex >= 0 && newClickedItemsPositionIndex <= clickedItems.length - 1 ) {
          const newDetailImageIndex = clickedItems[newClickedItemsPositionIndex];
          setDetailImageIndex(newDetailImageIndex);

          const newDetailImageString = getDetailImageString(texture,newDetailImageIndex);
          setDetailImageStringState(newDetailImageString);
        }
      }

      document.addEventListener("keydown", advanceNav);

      return function cleanup() {
      document.removeEventListener("keydown", advanceNav);
    };
  }
},[detailScreen, detailImageIndex])

  return (
    <div id='app'>
      <div className='controls' id='multiClick'>
        {gridMode && <button title='switch to list mode' className={'material-icons active'} onClick={() => {setGridMode(false);smallItem && setSmallItem(false)}} >list</button>}
        {!gridMode && <button title='switch to grid mode' className={'material-icons'} onClick={() => setGridMode(true)} >grid_view</button>}
        {smallItem && <button title='switch to normal item size' className={'material-icons active'} onClick={() => setSmallItem(false)} >photo_size_select_actual</button>}
        {!smallItem && <button title='switch to small item size' className={'material-icons'} onClick={() => gridMode && setSmallItem(true)} >photo_size_select_large</button>}
        <button title='add paper color to background' className={backgroundColor ? 'material-icons active' : 'material-icons'} onClick={() => {setBackgroundColor(!backgroundColor); texture && setTexture(false); packageImage && setPackageImage(false); svgRadar && setSvgRadar(false)}} >format_color_fill</button>
        <button title='add paper texture to background' className={texture ? 'material-icons active' : 'material-icons'} onClick={() => {setTexture(!texture); backgroundColor && setBackgroundColor(false); packageImage && setPackageImage(false); svgRadar && setSvgRadar(false)}} >texture</button>
        <button title='add package image to background' className={packageImage ? 'material-icons active' : 'material-icons'} onClick={() => {setPackageImage(!packageImage); backgroundColor && setBackgroundColor(false); texture && setTexture(false); svgRadar && setSvgRadar(false)}} >image</button>
        <button title='add radar glyph to background' className={svgRadar ? 'material-icons active' : 'material-icons'} onClick={() => {setSvgRadar(!svgRadar); backgroundColor && setBackgroundColor(false); texture && setTexture(false); packageImage && setPackageImage(false)}} >radar</button>
        <button title='overlay text' className={textMode ? 'material-icons active' : 'material-icons'} onClick={() => setTextMode(!textMode)} >title</button>
        <button title='decrease font size' className='material-icons' onClick={() => infoPanelFontSize > 1 && setInfoPanelFontSize(infoPanelFontSize - 1)} >text_fields</button>
        <button title='increase font size' className='material-icons' onClick={() => infoPanelFontSize < 3 && setInfoPanelFontSize(infoPanelFontSize + 1)} >format_size</button>
        {briefMode && <button title='switch to verbose mode' className={'material-icons active'} onClick={() => setBriefMode(false)} >notes</button>}
        {!briefMode && <button title='switch to brief mode' className={'material-icons'} onClick={() => setBriefMode(true)} >short_text</button>}
        {lightMode && <button title='switch to dark mode' className={'material-icons active'} onClick={() => setLightMode(false)} >dark_mode</button>}
        {!lightMode && <button title='switch to light mode' className={'material-icons'} onClick={() => setLightMode(true)} >light_mode</button>}
        <button title='multi-select mode' className={multiClick ? 'material-icons active' : 'material-icons'} onClick={() => setMultiClick(!multiClick)} >done_all</button>
        <button title='clear selection' className='material-icons' onClick={() => {setInvalidateSignal(!invalidateSignal); setClickedItems([]); setRaisedItem(null)}} >delete_sweep</button>
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
                                               textMode={textMode}
                                               raisedItem={raisedItem}
                                               setRaisedItem={setRaisedItem}
                                               gridMode={gridMode}
                                               infoPanelFontSize={infoPanelFontSize}
                                               backgroundColor={backgroundColor}
                                               texture={texture}
                                               packageImage={packageImage}
                                               svgRadar={svgRadar}
                                               smallItem={smallItem}
                                               key={i}
                                               detailScreen={detailScreen}
                                               setDetailScreen={setDetailScreen}
                                               detailImageStringState={detailImageStringState}
                                               setDetailImageStringState={setDetailImageStringState}
                                               setDetailImageIndex={setDetailImageIndex}
                                               filter={filter}
                                               group={group}
                                               filterIdxList={filterIdxList}
                                               invalidateSignal={invalidateSignal}
                                               setInvalidateSignal={setInvalidateSignal}
                                               />
                                             )}
      </div>
      <div id='viewpane'>
        <Canvas dpr={[1, 2]} camera={{ position: [0,0,75], far: 4000 }} frameloop="demand">
          <color attach="background" args={[0x4a4a4a]} />
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
                     spreadSlide={spreadSlide}
                     groupColors={groupColors}
                     raisedItem={raisedItem}
                     setRaisedItem={setRaisedItem}
                     filter={filter}
                     filterIdxList={filterIdxList}
                     invalidateSignal={invalidateSignal}
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
                     spreadSlide={spreadSlide}
                     groupColors={groupColors}
                     raisedItem={raisedItem}
                     setRaisedItem={setRaisedItem}
                     filter={filter}
                     filterIdxList={filterIdxList}
                     invalidateSignal={invalidateSignal}
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
                     spreadSlide={spreadSlide}
                     groupColors={groupColors}
                     raisedItem={raisedItem}
                     setRaisedItem={setRaisedItem}
                     filter={filter}
                     filterIdxList={filterIdxList}
                     invalidateSignal={invalidateSignal}
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
                     spreadSlide={spreadSlide}
                     groupColors={groupColors}
                     raisedItem={raisedItem}
                     setRaisedItem={setRaisedItem}
                     filter={filter}
                     filterIdxList={filterIdxList}
                     invalidateSignal={invalidateSignal}
                     />
          })}
          <OrbitControls
            ref={orbitRef}
            maxDistance={4000}
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
      {detailScreen && <div id='detailScreen' >
        <img id='detailImage' src={detailImageStringState}></img>
        <button title='close modal' className='material-icons detailScreenRemove' onClick={(e) => {e.stopPropagation(); setDetailScreen(false)}}>cancel</button>
        <button title='previous panel item' id='previousPanelItem' className='material-icons' onClick={handleDetailScreenNav}>navigate_before</button>
        <button title='next panel item' id='nextPanelItem' className='material-icons' onClick={handleDetailScreenNav}>navigate_next</button>
        <div id='detailScreenInfoBar'><p>{'#'+data['catalog'][detailImageIndex] + " " + data['man'][detailImageIndex] + " " + data['bran'][detailImageIndex] + " " + data['year'][detailImageIndex]}</p></div>
      </div>}
      <div id='topControls'>
        <div className='controls' id='spreadControls'>
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
        <div className='controls' id='glyphControls'>
          <button title='box glyph' onClick={() => setGlyph('box')} className={glyph === 'box' ? 'material-icons active' : 'material-icons' }>square</button>
          <button title='expressiveness glyph' onClick={() => setGlyph('exp')} className={glyph === 'exp' ? 'material-icons active' : 'material-icons' }>aspect_ratio</button>
          <button title='iso glyph' onClick={() => setGlyph('iso')} className={glyph === 'iso' ? 'material-icons active' : 'material-icons' }>line_weight</button>
          <button title='radar glyph' onClick={() => setGlyph('radar')} className={glyph === 'radar' ? 'material-icons active' : 'material-icons' }>radar</button>
        </div>
      </div>
      <div id='bottomControls'>
        <div className='controls' id='axisMenus'>
          <select value={xcol} onChange={e => setXcol(e.target.value)} title='x-axis'>
            <option value='year'>year</option>
            <option value='thickness'>thickness</option>
            <option value='gloss'>gloss</option>
            <option value='dmin'>base color</option>
            <option value='dmax'>tone</option>
            <option value='roughness'>roughness</option>
            <option value='expressiveness'>expressiveness</option>
            <option value='colorGroupColl'>collection</option>
            <option value='colorGroupMan'>manufacturer</option>
            <option value='colorGroupBran'>brand</option>
            <option value='colorGroupTextureWord'>texture description</option>
            <option value='colorGroupColorWord'>base color description</option>
            <option value='colorGroupGlossWord'>gloss description</option>
            <option value='colorGroupThickWord'>weight description</option>
            <option value='radarColor'>radar group</option>
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
            <option value='colorGroupColl'>collection</option>
            <option value='colorGroupMan'>manufacturer</option>
            <option value='colorGroupBran'>brand</option>
            <option value='colorGroupTextureWord'>texture description</option>
            <option value='colorGroupColorWord'>base color description</option>
            <option value='colorGroupGlossWord'>gloss description</option>
            <option value='colorGroupThickWord'>weight description</option>
            <option value='radarColor'>radar group</option>
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
            <option value='year'>year</option>
            <option value='radarColor'>radar group</option>
          </select>
          <button title='group color shuffle' onClick={() => setGroupColors(makeColorArray())} className={'material-icons'}>shuffle</button>
          <select value={facetcol} onChange={e => setFacetCol(e.target.value)} title='facet group'>
            <option value='none'>no facet axis</option>
            <option value='expressivenessGroup'>expressiveness</option>
            <option value='isoGroup'>color and thickness</option>
            <option value='radarGroup'>radar group</option>
            <option value='colorGroupColl'>collection</option>
            <option value='colorGroupMan'>manufacturer</option>
            <option value='colorGroupTextureWord'>texture description</option>
            <option value='colorGroupColorWord'>base color description</option>
            <option value='colorGroupGlossWord'>gloss description</option>
            <option value='colorGroupThickWord'>weight description</option>
          </select>
          {facetcolAsc && <button className={'material-icons'} title='sort facet axis descending' onClick={() => setFacetcolAsc(false)} >arrow_downward</button>}
          {!facetcolAsc && <button className={'material-icons active'} title='sort facet axis ascending' onClick={() => setFacetcolAsc(true)} >arrow_upward</button>}
        </div>
      </div>
      <div className='controls' id='plottypeControls'>
        <button title='grid montage' className={model === 'grid' ? 'material-icons active' : 'material-icons'} onClick={() => setModel('grid')} >apps</button>
        <button title='histogram' className={model === 'hist' ? 'material-icons active' : 'material-icons'} onClick={() => setModel('hist')} >bar_chart</button>
        <button title='scatter plot' className={model === 'scatter' ? 'material-icons active' : 'material-icons'} onClick={() => setModel('scatter')} >grain</button>
        <button title='cluster plot' className={model === 'gep' ? 'material-icons active' : 'material-icons'} onClick={() => setModel('gep')} >bubble_chart</button>
      </div>
      <div className='controls' id='filterControls'>
        {filterModal!=='closed' && <button title='close filter window' className={filter ? 'material-icons active' : 'material-icons'} style={{backgroundColor: filter ? 'var(--yaledarkgray)' : 'var(--yalewhite)'}} onClick={() => {setFilterModal('closed');setManExpand(false);setBranExpand(false)}} >close</button>}
        {filterModal==='closed' && <button title='open filter window' className={filter ? 'material-icons active' : 'material-icons'} onClick={() => setFilterModal('open')} >filter_alt</button>}
        <button title='remove all filters' className='material-icons' onClick={removeAllFilters} >filter_alt_off</button>
      </div>
      {filterModal!=='closed' && <div id='filterModal' className={filterModal==='open' && filterLightMode ? 'open lightMode' : filterModal==='open' && !filterLightMode ? 'open darkMode' : filterModal==='expanded' && filterLightMode ? 'expanded lightMode' : 'expanded darkMode'}>
        {filterModal==='open' && <button title='replace selection with filter' className='material-icons replaceFilterWithSelection' style={{right:'28vw'}} onClick={handleFilterToSelection} >open_in_new</button>}
        {filterModal==='expanded' && <button title='replace selection with filter' className='material-icons replaceFilterWithSelection' style={{right:'56vw'}} onClick={handleFilterToSelection} >open_in_new</button>}
        {filterModal==='open' && <button title='add filter to selection' className='material-icons addFilterToSelection' style={{right:'28vw'}} onClick={handleFilterToSelection} >queue</button>}
        {filterModal==='expanded' && <button title='add filter to selection' className='material-icons addFilterToSelection' style={{right:'56vw'}} onClick={handleFilterToSelection} >queue</button>}
        {filterModal==='open' && <button title='expand filter window' className='material-icons expandButtons' style={{right:'28vw'}} onClick={() => setFilterModal('expanded')} >chevron_left</button>}
        {filterModal==='expanded' && <button title='contract filter window' className='material-icons expandButtons' style={{right:'56vw'}} onClick={() => setFilterModal('open')} >chevron_right</button>}
        {filterLightMode && filterModal==='open' && <button title='switch to dark mode' style={{right:'28vw'}} className={'material-icons active filterLightMode'} onClick={() => setFilterLightMode(false)} >dark_mode</button>}
        {!filterLightMode && filterModal==='open' && <button title='switch to light mode' style={{right:'28vw'}} className={'material-icons filterLightMode'} onClick={() => setFilterLightMode(true)} >light_mode</button>}
        {filterLightMode && filterModal==='expanded' && <button title='switch to dark mode' style={{right:'56vw'}} className={'material-icons active filterLightMode'} onClick={() => setFilterLightMode(false)} >dark_mode</button>}
        {!filterLightMode && filterModal==='expanded' && <button title='switch to light mode' style={{right:'56vw'}} className={'material-icons filterLightMode'} onClick={() => setFilterLightMode(true)} >light_mode</button>}
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className={filterLightMode ? 'filterCategoryHeading topline headingMat' : 'filterCategoryHeading topline'}>PRINT COLLECTION</p></div>
          {[{t:'Man Ray',v:'mr'}].map((d,i) => <div key={i} style={{display:'block'}}><Switch checked={toggleMR} onChange={()=>setToggleMR(!toggleMR)}/><button data-cat='coll' data-val={d.v} onClick={handleFilter} className={filterList['coll'].includes(d.v) ? 'filterButtonActive' : 'filterButton'} style={{backgroundColor:'var(--yalemidlightgray)',color:'var(--yalewhite)',display:'inline-block'}} >{d.t}</button></div>)}
          {[{t:'László Moholy-Nagy',v:'lmn'}].map((d,i) => <div key={i} style={{display:'block'}}><Switch checked={toggleLMN} onChange={()=>setToggleLMN(!toggleLMN)}/><button data-cat='coll' data-val={d.v} onClick={handleFilter} className={filterList['coll'].includes(d.v) ? 'filterButtonActive' : 'filterButton'} style={{backgroundColor:'var(--yalemidlightgray)',color:'var(--yalewhite)',display:'inline-block'}} >{d.t}</button></div>)}
          {[{t:'August Sander',v:'as'}].map((d,i) => <div key={i} style={{display:'block'}}><Switch checked={toggleAS} onChange={()=>setToggleAS(!toggleAS)}/><button data-cat='coll' data-val={d.v} onClick={handleFilter} className={filterList['coll'].includes(d.v) ? 'filterButtonActive' : 'filterButton'} style={{backgroundColor:'var(--yalemidlightgray)',color:'var(--yalewhite)',display:'inline-block'}} >{d.t}</button></div>)}
          {[{t:'Harry Callahan',v:'hc'}].map((d,i) => <div key={i} style={{display:'block'}}><Switch checked={toggleHC} onChange={()=>setToggleHC(!toggleHC)}/><button data-cat='coll' data-val={d.v} onClick={handleFilter} className={filterList['coll'].includes(d.v) ? 'filterButtonActive' : 'filterButton'} style={{backgroundColor:'var(--yalemidlightgray)',color:'var(--yalewhite)',display:'inline-block'}} >{d.t}</button></div>)}
          {[{t:'Lola Álvarez Bravo',v:'lab'}].map((d,i) => <div key={i} style={{display:'block'}}><Switch checked={toggleLAB} onChange={()=>setToggleLAB(!toggleLAB)}/><button data-cat='coll' data-val={d.v} onClick={handleFilter} className={filterList['coll'].includes(d.v) ? 'filterButtonActive' : 'filterButton'} style={{backgroundColor:'var(--yalemidlightgray)',color:'var(--yalewhite)',display:'inline-block'}} >{d.t}</button></div>)}
          {[{t:'Robert Mapplethorpe',v:'rm'}].map((d,i) => <div key={i} style={{display:'block'}}><Switch checked={toggleRM} onChange={()=>setToggleRM(!toggleRM)}/><button data-cat='coll' data-val={d.v} onClick={handleFilter} className={filterList['coll'].includes(d.v) ? 'filterButtonActive' : 'filterButton'} style={{backgroundColor:'var(--yalemidlightgray)',color:'var(--yalewhite)',display:'inline-block'}} >{d.t}</button></div>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className={filterLightMode ? 'filterCategoryHeading headingMat' : 'filterCategoryHeading'} >REFERENCE COLLECTION</p></div>
          {[{t:'LML Packages',v:'lml'},{t:'LML Sample Books',v:'lmlsb'}].map((d,i) => <div key={i} style={{display:'block'}}><button data-cat='coll' data-val={d.v} onClick={handleFilter} className={filterList['coll'].includes(d.v) ? 'filterButtonActive' : 'filterButton'} style={{backgroundColor:'var(--yalemidlightgray)',color:'var(--yalewhite)',display:'inline-block'}} >{d.t}</button></div>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className={filterLightMode ? 'filterCategoryHeading topline headingMat' : 'filterCategoryHeading topline'}>PROCESS TYPE</p></div>
          {[{t:'Photogram',v:"photogram"}].map((d,i) => <button key={i} data-cat='photoProcess' data-val={d.v} onClick={handleFilter} className={filterList['photoProcess'].includes(d.v) ? 'filterButtonActive' : 'filterButton'} style={{backgroundColor:'var(--yalemidlightgray)',color:'var(--yalewhite)',display:'inline-block'}} >{d.t}</button>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className={filterLightMode ? 'filterCategoryHeading headingMat' : 'filterCategoryHeading'} >YEAR</p></div>
          <div className='sliderContainer'><Slider key={sliderKey} color='primary' data-cat='year' onChangeCommitted={handleSliderFilter} onChange={e => setYearSlide(e.target.value)} defaultValue={[yearMin,yearMax]} valueLabelDisplay="on" min={yearMin} max={yearMax} marks={yearSlideMarks}/></div>
        </div>
        <div className='filterCategoryContainer'>
          <div id='manHead' className='filterCategoryHeadingContainer'><p className={filterLightMode ? 'filterCategoryHeading headingMat' : 'filterCategoryHeading'} >MANUFACTURER</p></div>
          {!manExpand && Object.keys(manValCounts).sort().slice(0,20).map((d,i) => <button key={i} data-cat='man' data-val={d} onClick={handleFilter} className={filterList['man'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredManFrequencies,d)} >{d}</button>)}
          {!manExpand && <button title='expand manufacturer options' className='material-icons active filterButton' onClick={() => setManExpand(true)} >more_horiz</button>}
          {manExpand && Object.keys(manValCounts).sort().map((d,i) => <button key={i} data-cat='man' data-val={d} onClick={handleFilter} className={filterList['man'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredManFrequencies,d)} >{d}</button>)}
          {manExpand && <button title='contract manufacturer options' className='material-icons active filterButton' onClick={() => {setManExpand(false);document.getElementById("manHead").scrollIntoView();}} >expand_less</button>}
        </div>
        <div className='filterCategoryContainer'>
          <div id='branHead' className='filterCategoryHeadingContainer'><p className={filterLightMode ? 'filterCategoryHeading headingMat' : 'filterCategoryHeading'} >BRAND</p></div>
          {!branExpand && Object.keys(branValCounts).sort().slice(0,20).map((d,i) => <button key={i} data-cat='bran' data-val={d} onClick={handleFilter} className={filterList['bran'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredBranFrequencies,d)} >{d}</button>)}
          {!branExpand && <button title='expand brand options' className='material-icons active filterButton' onClick={() => setBranExpand(true)} >more_horiz</button>}
          {branExpand && Object.keys(branValCounts).sort().map((d,i) => <button key={i} data-cat='bran' data-val={d} onClick={handleFilter} className={filterList['bran'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredBranFrequencies,d)} >{d}</button>)}
          {branExpand && <button title='contract brand options' className='material-icons active filterButton' onClick={() => {setBranExpand(false);document.getElementById("branHead").scrollIntoView();}} >expand_less</button>}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className={filterLightMode ? 'filterCategoryHeading headingMat' : 'filterCategoryHeading'} >THICKNESS</p></div>
          <div className='sliderContainer'><Slider key={sliderKey} color='primary' data-cat='thickness' onChangeCommitted={handleSliderFilter} onChange={e => setThicknessSlide(e.target.value)} defaultValue={[thicknessMin,thicknessMax]} valueLabelDisplay="on" min={thicknessMin} max={thicknessMax} step={0.001} marks={thicknessSlideMarks}/></div>
          {Object.keys(thicknessValCounts).sort().map((d,i) => <button key={i} data-cat='thicknessWord' data-val={d} onClick={handleFilter} className={filterList['thicknessWord'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredThicknessFrequencies,d)} >{d}</button>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className={filterLightMode ? 'filterCategoryHeading headingMat' : 'filterCategoryHeading'} >BASE COLOR</p></div>
          <div className='sliderContainer'><Slider key={sliderKey} color='primary' data-cat='dmin' onChangeCommitted={handleSliderFilter} onChange={e => setColorSlide(e.target.value)} defaultValue={[colorMin,colorMax]} valueLabelDisplay="on" min={colorMin} max={colorMax} step={0.01} marks={colorSlideMarks}/></div>
          {Object.keys(colorValCounts).sort().map((d,i) => <button key={i} data-cat='colorWord' data-val={d} onClick={handleFilter} className={filterList['colorWord'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredColorFrequencies,d)} >{d}</button>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className={filterLightMode ? 'filterCategoryHeading headingMat' : 'filterCategoryHeading'} >TONE COLOR</p></div>
          <div className='sliderContainer'><Slider key={sliderKey} color='primary' data-cat='dmax' onChangeCommitted={handleSliderFilter} onChange={e => setToneSlide(e.target.value)} defaultValue={[toneMin,toneMax]} valueLabelDisplay="on" min={toneMin} max={toneMax} step={0.01} marks={toneSlideMarks}/></div>
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className={filterLightMode ? 'filterCategoryHeading headingMat' : 'filterCategoryHeading'} >TEXTURE</p></div>
          <div className='sliderContainer'><Slider key={sliderKey} color='primary' data-cat='roughness' onChangeCommitted={handleSliderFilter} onChange={e => setRoughnessSlide(e.target.value)} defaultValue={[roughnessMin,roughnessMax]} valueLabelDisplay="on" min={roughnessMin} max={roughnessMax} marks={roughnessSlideMarks}/></div>
          {Object.keys(textureValCounts).sort().map((d,i) => <button key={i} data-cat='textureWord' data-val={d} onClick={handleFilter} className={filterList['textureWord'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredTextureFrequencies,d)} >{d}</button>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className={filterLightMode ? 'filterCategoryHeading headingMat' : 'filterCategoryHeading'} >GLOSS</p></div>
          <div className='sliderContainer'><Slider key={sliderKey} color='primary' data-cat='gloss' onChangeCommitted={handleSliderFilter} onChange={e => setGlossSlide(e.target.value)} defaultValue={[glossMin,glossMax]} valueLabelDisplay="on" min={glossMin} max={glossMax} marks={glossSlideMarks}/></div>
          {Object.keys(glossValCounts).sort().map((d,i) => <button key={i} data-cat='glossWord' data-val={d} onClick={handleFilter} className={filterList['glossWord'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredGlossFrequencies,d)} >{d}</button>)}
        </div>
        <div className='filterCategoryContainer'>
          <div className='filterCategoryHeadingContainer'><p className={filterLightMode ? 'filterCategoryHeading headingMat' : 'filterCategoryHeading'} >RADAR GROUP</p></div>
          {Object.keys(radarGroupValCounts).sort().map((d,i) => <button key={i} data-cat='radarGroup' data-val={d} onClick={handleFilter} className={filterList['radarGroup'].includes(d) ? 'filterButtonActive' : 'filterButton'} style={filterButtonStyle(filteredRadarGroupFrequencies,d)} >{d}</button>)}
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
