import { valueCounts } from "./stats";
import { orderBy } from "lodash";

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

// Some dimensions have 3 obvious bins, some have 4
const axisSteps = ( binNumber, numBins ) => {
  if ( numBins === 3 ) {
    return binNumber === '0' ? 0.33/2 : binNumber === '1' ? 0.66/2 : 0.99/2
  } else if ( numBins === 4 ) {
    return binNumber === '0' ? 0.25/2 : binNumber === '1' ? 0.5/2 : binNumber === '2' ? 0.75/2 : 1.0/2
  }
}

export function radarVertices( glyphGroup ) {
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

export function radarNormals( glyphGroup ) {
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