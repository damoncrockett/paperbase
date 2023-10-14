import { Color } from 'three';
import { rankTransform } from '../utils/stats';
import { max, min } from 'lodash';
import { missingDminHexIdxs } from '../components/App';

/* 
Colors, between 50 and 85 lightness, chosen for name uniqueness, using Colorgorical.
Had to eliminate two colors [#f228a0,#f24219] because they were too close to our highlight magenta.
 */

let categoricalColors = [
    "#78b4c6", "#c66a5a", "#52dea9", "#b5a3cf", "#a1d832", "#f59ae7", "#698e4e", 
    "#f4bb8f", "#00d618", "#2282f5", "#f24219", "#9a63ff", "#fe8f06", "#9d7f50", "#f4d403"
];
  
let categoricalColorArray;

export function makeColorArray() {
    categoricalColorArray = categoricalColors.sort(function () {
        return Math.random() - 0.5;
    });

    const lastColor = categoricalColorArray[categoricalColorArray.length - 1];
    const lastColorArray = Array.from({length: 600}, () => lastColor); // there are 600 distinct 'bran' values, so we are adding 600 here to be safe
    categoricalColorArray = [...categoricalColorArray, ...lastColorArray];

    return categoricalColorArray
}

const highlightColor = 0xff00ff;
const missingColor = 0xcc4700;
const missingColorTone = 0xffffff;
const colorSubstrate = new Color();
const continuousColorCols = ['thickness','gloss','roughness','expressiveness','year'];
const groupColorCols = [
    'colorGroupColl','colorGroupMan','colorGroupBran','colorGroupThickWord',
    'colorGroupGlossWord','colorGroupColorWord','colorGroupTextureWord','radarColor'
];

export {
    highlightColor,
    missingColorTone,
    colorSubstrate,
    continuousColorCols,
    groupColorCols,
};
                   
export function valToColor(arr) {
  
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

export function adjustLightness(color, targetDarkness, weight, sOffset) {
    
    const hsl = {};
    color.getHSL(hsl);
  
    // Linearly interpolate between current lightness and target darkness
    const newLightness = (1 - weight) * hsl.l + weight * targetDarkness;
  
    // Calculate the lightness offset
    const lOffset = newLightness - hsl.l;
  
    // Apply the offset to the color
    color.offsetHSL(0, sOffset, lOffset);
}

export function applyFilterColors( globalIndex, colorSubstrate, filter, group, filterIdxList ) {

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
            //colorSubstrate.set(0x4a4a4a);
            //colorSubstrate.offsetHSL(0, 0, grayOffsetL);
            adjustLightness(colorSubstrate, 0.05, 0.99, -0.2);
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
  
export function getColorVal( groupColors, colorVals, item ) {  
    
    let colorVal = colorVals[item];
    if ( colorVal === 9999 ) {
        return 0x000000;
    } else {
        return groupColors[colorVals[item]] || colorVals[item];
    }
}
