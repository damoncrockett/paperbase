import { valueCounts, uScale } from "./stats";
import { orderBy } from "lodash";
import { max, min } from 'lodash';

// Radar used in InfoPanel, drawn by d3 instead of webGL

function getUniverse( dataU ) {
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

const checkNaN = d => !isNaN(d);

export function polygonPoints( dataU, clickedItem, svgSide ) {

  let p1,p2,p3,p4;

  p1 = dataU['dmin'][clickedItem];
  p2 = dataU['thickness'][clickedItem];
  p3 = dataU['roughness'][clickedItem];
  p4 = dataU['gloss'][clickedItem];

  const universe = getUniverse( dataU );

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

// for making integer labels for character-variable groups, used in glyph group colors
export function makeGroupLabels( groupCol ) {
  
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

/*groupMaps-------------------------------------------------------------------*/

/* These maps are dictionaries where the keys are groups and the values are
lists of global indices (i.e., positions in the `data` arrays)
*/

export function makeMap( data, groupArray, glyphGroup ) {
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

/*Radar-----------------------------------------------------------------------*/

const axisSteps = ( binNumber, numBins ) => {
  if ( numBins === 3 ) {
    return binNumber === '0' ? 0.33/2 : binNumber === '1' ? 0.66/2 : 0.99/2
  } else if ( numBins === 4 ) {
    return binNumber === '0' ? 0.25/2 : binNumber === '1' ? 0.5/2 : binNumber === '2' ? 0.75/2 : 1.0/2
  } else if ( numBins === 5 ) {
    return binNumber === '0' ? 0.2/2 : binNumber === '1' ? 0.4/2 : binNumber === '2' ? 0.6/2 : binNumber === '3' ? 0.8/2 : 1.0/2
  } else if ( numBins === 6 ) {
    return binNumber === '0' ? 0.16/2 : binNumber === '1' ? 0.33/2 : binNumber === '2' ? 0.5/2 : binNumber === '3' ? 0.66/2 : binNumber === '4' ? 0.83/2 : 1.0/2
  } else if ( numBins === 7 ) {
    return binNumber === '0' ? 0.14/2 : binNumber === '1' ? 0.29/2 : binNumber === '2' ? 0.43/2 : binNumber === '3' ? 0.57/2 : binNumber === '4' ? 0.71/2 : binNumber === '5' ? 0.86/2 : 1.0/2
  } else if ( numBins === 8 ) {
    return binNumber === '0' ? 0.125/2 : binNumber === '1' ? 0.25/2 : binNumber === '2' ? 0.375/2 : binNumber === '3' ? 0.5/2 : binNumber === '4' ? 0.625/2 : binNumber === '5' ? 0.75/2 : binNumber === '6' ? 0.875/2 : 1.0/2
  } else if ( numBins === 9 ) {
    return binNumber === '0' ? 0.11/2 : binNumber === '1' ? 0.22/2 : binNumber === '2' ? 0.33/2 : binNumber === '3' ? 0.44/2 : binNumber === '4' ? 0.56/2 : binNumber === '5' ? 0.67/2 : binNumber === '6' ? 0.78/2 : binNumber === '7' ? 0.89/2 : 1.0/2
  } else if ( numBins === 10 ) {
    return binNumber === '0' ? 0.1/2 : binNumber === '1' ? 0.2/2 : binNumber === '2' ? 0.3/2 : binNumber === '3' ? 0.4/2 : binNumber === '4' ? 0.5/2 : binNumber === '5' ? 0.6/2 : binNumber === '6' ? 0.7/2 : binNumber === '7' ? 0.8/2 : binNumber === '9' ? 0.9/2 : 1.0/2
  }
}

export function radarVertices( glyphGroup ) {
  let [thick, rough, gloss, color] = glyphGroup.split('_');

  thick = axisSteps(thick, 4) * -1;
  rough = axisSteps(rough, 10) * -1;
  gloss = axisSteps(gloss, 6);
  color = axisSteps(color, 8);

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

export function radarNormals( glyphGroup ) {
  let [thick, rough, gloss, color] = glyphGroup.split('_');

  thick = axisSteps(thick, 4) * -1;
  rough = axisSteps(rough, 10) * -1;
  gloss = axisSteps(gloss, 6);
  color = axisSteps(color, 8);

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