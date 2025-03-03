import { Color } from 'three';
import { rankTransform } from '../utils/stats';
import { max, min } from 'lodash';
import { missingDminHexIdxs } from './data';
import chroma from "chroma-js";

/* 
Colors, between 50 and 85 lightness, chosen for name uniqueness, using Colorgorical.
Had to eliminate two colors [#f228a0,#f24219] because they were too close to our highlight magenta.
 */

export const categoricalColors = [
    "#78b4c6", "#c66a5a", "#52dea9", "#b5a3cf", "#a1d832", "#f59ae7", "#698e4e", 
    "#f4bb8f", "#00d618", "#2282f5", "#f24219", "#9a63ff", "#fe8f06", "#9d7f50", "#f4d403"
];
  
let categoricalColorArray;

export function makeColorArray() {
  categoricalColorArray = [...categoricalColors].sort(() => Math.random() - 0.5);

  const lastColor = categoricalColorArray[categoricalColorArray.length - 1];
  const lastColorArray = Array.from({ length: 600 }, () => lastColor);
  categoricalColorArray = [...categoricalColorArray, ...lastColorArray];

  return categoricalColorArray;
}

const highlightColor = 0xff00ff;
const missingColor = new Color();
missingColor.set(0x4a4a4a);
missingColor.offsetHSL(0, 0, -0.2);

const missingColorFluorescence = new Color();
missingColorFluorescence.set(0xbd5319);
const missingOffsetL = -0.35;
const missingOffsetH = 0;
const missingOffsetS = 0;
missingColorFluorescence.offsetHSL(missingOffsetH, missingOffsetS, missingOffsetL);

const missingColorTone = 0xffffff;
const colorSubstrate = new Color();
const continuousColorCols = ['thickness','gloss','roughness','expressiveness','year','auc'];
const groupColorCols = [
    'colorGroupColl','colorGroupMan','colorGroupBran','colorGroupThickWord',
    'colorGroupGlossWord','colorGroupColorWord','colorGroupTextureWord','radarColor',
    'colorGroupProcessing','colorGroupBackp','colorGroupSurf','colorGroupResin',
    'colorGroupToner','colorGroupPostcard','colorGroupCirca','colorGroupSbid'
];

export {
    highlightColor,
    missingColorTone,
    colorSubstrate,
    continuousColorCols,
    groupColorCols,
};
                   
export function valToColor(arr, fluorescence = false) {
  
  //arr = arr.map(d => parseFloat(d)); // empty strings and underscores are converted to NaN
  arr = arr.map(d => d);
  const arrRanked = rankTransform(arr); // returns `arr` with ranks, and keeps NaNs as they are
  
  // these functions, from lodash, ignore NaNs
  const arrmax = max(arrRanked);
  const arrmin = min(arrRanked);
  const arrrange = arrmax - arrmin;
  
  const arrnorm = arrRanked.map(d => (d - arrmin) / arrrange);

  let arrcolor;
  if ( !fluorescence ) {
    arrcolor = arrnorm.map(d => isNaN(d) ? missingColor : chroma.scale('viridis')(d).hex());
  } else {
    const hue = 215;
    const saturation = 90;
    const maxLightness = 60;
    arrcolor = arrnorm.map(d => isNaN(d) ? missingColorFluorescence : `hsl(${hue},${saturation}%,${parseInt(d * maxLightness).toString()}%)`);  
  }

  return arrcolor

}

export function adjustLightness(color, targetDarkness, weight, sOffset) {
    
    const hsl = {};
    color.getHSL(hsl);
  
    const newLightness = (1 - weight) * hsl.l + weight * targetDarkness;
  
    const lOffset = newLightness - hsl.l;
  
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
        if ( !filterIdxList.includes(globalIndex) ) {
          if ( group !== 'auc' ) {
            adjustLightness(colorSubstrate, 0.05, 0.99, -0.2);
          } else {
            colorSubstrate.set(0x4a4a4a);
            colorSubstrate.offsetHSL(0, 0, grayOffsetL);
          }
          
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
