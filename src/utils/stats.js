import { max, min, compact } from 'lodash';

export function valueCounts(col, normalized = true) {
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

export function featureScale(col) {
    const colmin = min(col);
    const colmax = max(col);
    const colrange = colmax - colmin;
    const adjCol = col.map(d => isNaN(d) ? 2 : (d - colmin) / colrange) // if d is NaN, we send it outside the normed max (which is 1)
  
    return adjCol;
}

export function uScale(uMin,uMax,val) {
    const uRange = uMax - uMin;
    return (val - uMin) / uRange
}

export function rankTransform(arr) {
    const nanReplace = arr.map(x => isNaN(x) ? 9999 : x); // 9999 is a value that will never be used
    const sorted = [...nanReplace].sort((a, b) => a - b); // since NaNs (as 9999s) end up at the *end* and not the beginning, they don't affect the rank indices we collect in the next line
    
    return nanReplace.map(x => x === 9999 ? NaN : sorted.indexOf(x)) // switch 9999 back to NaN after sorting
}

export function getStandardDeviation(arr) {
    arr = compact(arr);
    const n = arr.length;
    const mean = arr.reduce((a, b) => a + b) / n;
    return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
}