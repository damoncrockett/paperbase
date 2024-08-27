import { orderBy, min, max } from "lodash";
import { bin } from "d3-array";
import { featureScale, getStandardDeviation } from "./stats";
import { scaleLinear } from "d3-scale";

function gridCoords( n, ncol ) {

    const nrow = Math.ceil( n / ncol )
    const xgrid = Array(nrow).fill(Array.from(Array(ncol).keys())).flat().slice(0,n);
    const ygrid = Array.from(Array(nrow).keys()).map(d => Array(ncol).fill(d)).flat().slice(0,n);
  
    const coords = [];
    xgrid.forEach((item, i) => {
      //coords[i] = [item - ncol / 2, -ygrid[i] + nrow / 2, 0]
      coords[i] = [item, ygrid[i], 0]
    });
  
    return coords;
}
  
export function makeGrid( data, n, xcol, xcolAsc, spreadSlide ) {
    
    let sortingArray = [];
    const ncolsDefault = Math.ceil(Math.sqrt(n / 0.5625))
    const ncolsIncrement = Math.ceil(ncolsDefault / 5);
    const ncols = ncolsDefault + ncolsIncrement * spreadSlide;
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
  
    const histBinsMid = 175;
    const histBinsIncrement = 50;

    let histBins;
    if ( xcol !== 'year' ) {
      histBins = histBinsMid + histBinsIncrement * spreadSlide;
    } else {
      const uniqueYears = Array.from(new Set(data[xcol]));
      histBins = uniqueYears.length;
    }
    
    const std = getStandardDeviation(scratchArray.map(d => d.val));
    const arrmax = max(scratchArray.map(d => d.val)); // lodash max ignores null/NaN values
    const binner = bin().thresholds(histBins).value(d => isNaN(d.val) ? arrmax + std : d.val); // if val is null, put it one standard deviation above the max
    const binnedData = binner(scratchArray);
  
    if ( xcolAsc === false ) {
      binnedData.reverse();
    }
  
    const yAdjust = 25;
    scratchArray = [];
    binnedData.forEach((bin, binidx) => {
      if (bin.length > 0) { // ignores x0 and x1, the bin edges (which are included for every bin)
        bin = orderBy(bin,['ycol'],[ycolAsc ? 'asc' : 'desc'])
        bin.forEach((item, itemidx) => {
          let x, y;
          if ( columnsPerBin === 1 ) { // 1 is a special case because there is no empty space between bins
            x = binidx;
            //x = x - (binnedData.length - 1) / 2; // x adjustment because we center the histogram at (0,0)
            y = itemidx === 0 ? 0 : itemidx % 2 === 0 ? -1 * itemidx/2 : Math.ceil(itemidx/2); // we plot both above and below the x axis, so we alternate between positive and negative values
            if ( y >= 0 ) {
              y = y + 1; // we want the first positive value to be 1, not 0
            } else {
              y = y - 1; // we want the first negative value to be -1, not 0
            }
          } else { // all other cases require a space between bins
            const zeroPoint = binidx * ( columnsPerBin + 1 );
            const col = itemidx % columnsPerBin; // simple alternation between 0 and 1
            
            y = itemidx < 2 ? 0 : Math.round(itemidx / (columnsPerBin * 2)); // produces 0,0,1,1,1,1,2,2,2,2,... when columnsPerBin = 2
            const ySign = Math.floor(itemidx / (columnsPerBin * 2)) === y ? 1 : -1; // the smaller two (out of 4) end up y-1 after flooring, the larger ones y
            y = ySign * y;
            if ( y >= 0 ) {
              y = y + 1; // we want the first positive value to be 1, not 0
            } else {
              y = y - 1; // we want the first negative value to be -1, not 0
            }
            
            x = zeroPoint + col;
            //x = x - (binnedData.length - 1) * ( columnsPerBin + 1 ) / 2; // x adjustment because we center the histogram at (0,0)
          }
          // scratchArray.push({'pos':[x, y, 0],'idx':item.idx});
          scratchArray.push({'pos':[x, y + yAdjust, 0],'idx':item.idx});
        });
      }
    });

    let binTicks = [];
    binnedData.forEach((bin, binidx) => {
      let x;
      if ( columnsPerBin === 1 ) {
        x = binidx;
        //x = x - (binnedData.length - 1) / 2;
      } else {
        x = binidx * ( columnsPerBin + 1 ) + Math.floor(columnsPerBin / 2);
        //x = x - (binnedData.length - 1) * ( columnsPerBin + 1 ) / 2;
      }
      // binTicks.push({'pos':[x, 0, 0],'label':bin.x0});
      binTicks.push({'pos':[x, yAdjust, 0],'label':bin.x0});
    });

    if ( xcol !== 'year' ) {

      const skipSize = 10;
      binTicks = binTicks.filter((item, i) => i % skipSize === 0);

    }
    

    scratchArray = orderBy(scratchArray,['idx'],['asc']);
    scratchArray = scratchArray.map(d => d.pos);

    return { scratchArray, binTicks }
}
  
export function makeScatter(
  data, 
  xcol, 
  xcolAsc, 
  ycol, 
  ycolAsc, 
  zcol, 
  zcolAsc, 
  spreadSlide,
  scatterFactorMid,
  scatterFactorIncrement,
  axisTicks,
  axisTickFontSize
) {

  const xraw = data[xcol];
  const yraw = data[ycol];
  const zraw = zcol === 'none' ? null : data[zcol];
  
  let xArray = featureScale(xraw);
  let yArray = featureScale(yraw);
  let zArray = zcol === 'none' ? null : featureScale(zraw);

  // if (xcolAsc === false) {
  //   xArray = xArray.map(d => 1 - d);
  // }

  // if (ycolAsc === false) {
  //   yArray = yArray.map(d => 1 - d);
  // }

  // if (zArray !== null && zcolAsc === false) {
  //   zArray = zArray.map(d => 1 - d);
  // }

  const scatterFactor = scatterFactorMid + scatterFactorIncrement * spreadSlide;
  
  const minx = min(xraw);
  const maxx = max(xraw);
  const rangex = maxx - minx;

  const miny = min(yraw);
  const maxy = max(yraw);
  const rangey = maxy - miny;

  const xScale = scaleLinear().domain([minx, maxx]); 
  const xticks = xScale.ticks(axisTicks);

  const xTickArray = [];
  xticks.forEach((item, i) => {
    xTickArray.push(
      {
        'pos': [(item - minx) * scatterFactor / rangex, -1 * axisTickFontSize, axisTickFontSize],
        'label': item
      }
    )
  });

  const yScale = scaleLinear().domain([miny, maxy]);
  const yticks = yScale.ticks(axisTicks);

  const yTickArray = [];
  yticks.forEach((item, i) => {
    yTickArray.push(
      {
        'pos': [-1 * axisTickFontSize, (item - miny) * scatterFactor / rangey, axisTickFontSize],
        'label': item
      }
    )
  });

  let zTickArray = [];
  if (zArray !== null) {
    const minz = min(zraw);
    const maxz = max(zraw);
    const rangez = maxz - minz;

    const zScale = scaleLinear().domain([minz, maxz]);
    const zticks = zScale.ticks(axisTicks);

    zticks.forEach((item, i) => {
      zTickArray.push(
        {
          'pos': [-1 * axisTickFontSize, -1 * axisTickFontSize, (item - minz) * scatterFactor / rangez],
          'label': item
        }
      )
    });
  }

  const scratchArray = [];
  xArray.forEach((item, i) => {
    const x = item * scatterFactor;
    const y = yArray[i] * scatterFactor;
    const z = zArray === null ? 0 : zArray[i] * scatterFactor;
    scratchArray.push([x, y, z])
  });

  return { scratchArray, xTickArray, yTickArray, zTickArray }

}
