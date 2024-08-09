import { orderBy, max } from "lodash";
import { bin } from "d3-array";
import { featureScale, getStandardDeviation } from "./stats";

function gridCoords( n, ncol ) {

    const nrow = Math.ceil( n / ncol )
    const xgrid = Array(nrow).fill(Array.from(Array(ncol).keys())).flat().slice(0,n);
    const ygrid = Array.from(Array(nrow).keys()).map(d => Array(ncol).fill(d)).flat().slice(0,n);
  
    const coords = [];
    xgrid.forEach((item, i) => {
      coords[i] = [item - ncol / 2, -ygrid[i] + nrow / 2, 0]
    });
  
    return coords;
}
  
export function makeGrid( data, n, xcol, xcolAsc, spreadSlide ) {
    
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
  
export function makeHist( data, xcol, xcolAsc, ycol, ycolAsc, spreadSlide, columnsPerBin ) {
  
    let scratchArray = [];
  
    data[xcol].forEach((item, i) => {
      //scratchArray[i] = { 'idx': i, 'val': parseFloat(item), 'ycol': parseFloat(data[ycol][i]) }
      scratchArray[i] = { 'idx': i, 'val': item, 'ycol': data[ycol][i] }
    });
  
    const histBinsMid = 400;
    const histBinsIncrement = 100;
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
  
export function makeScatter( data, xcol, xcolAsc, ycol, ycolAsc, zcol, zcolAsc, spreadSlide ) {
    
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