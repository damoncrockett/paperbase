import React from 'react';

import { 
  glyphToMap, 
  getDetailImageString,
  dataU 
} from './App';

import { polygonPoints } from '../utils/glyph';

import { 
    highlightColor,
    colorSubstrate,
    applyFilterColors,
    getColorVal
} from '../utils/color';

import { returnDomain } from '../utils/img';    

export default function PanelItem({
    data,
    meshList,
    colorVals,
    clickedItem,
    clickedItems,
    setClickedItems,
    multiClick,
    glyph,
    groupColors,
    textLength,
    raisedItem,
    setRaisedItem,
    panelLayout,
    infoPanelFontSize,
    backgroundColor,
    texture,
    packageImage,
    backprintImage,
    svgRadar,
    smallItem,
    setDetailScreen,
    setDetailImageStringState,
    setDetailImageIndex,
    setPackageImageIndex,
    filter,
    group,
    filterIdxList,
    invalidateSignal,
    setInvalidateSignal,
  }) {

    function getHoverInfo(clickedItem) {
        const thickness = data['thickness'][clickedItem];
        const color = data['dmin'][clickedItem];
        const dminHex = data['dminHex'][clickedItem];
        const gloss = data['gloss'][clickedItem];
        const roughness = data['roughness'][clickedItem];
      
        return clickedItem + '  mm:' + thickness + '  b*:' + color + '  rgb:' + dminHex + '  GU:' + gloss + '  std:' + roughness
      }
  
    let blankInfo;
    const writeInfoArray = globalInstanceId => {
      let surf = data['surf'][globalInstanceId];
      let textureWord = data['textureWord'][globalInstanceId];
      let glossWord = data['glossWord'][globalInstanceId];
      let colorWord = data['colorWord'][globalInstanceId];
      let thicknessWord = data['thicknessWord'][globalInstanceId];
  
      surf = surf === '_' ? '' : surf;
      textureWord = textureWord === '_' ? '' : textureWord;
      glossWord = glossWord === '_' ? '' : glossWord;
      colorWord = colorWord === '_' ? '' : colorWord;
      thicknessWord = thicknessWord === '_' ? '' : thicknessWord;
  
      let infoList = [surf, textureWord, glossWord, colorWord, thicknessWord];
  
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
        setClickedItems(clickedItems => clickedItems.filter(d => d!==clickedItem));
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
  
    const sb = data['sb'][clickedItem];
    
    let catalog = data['catalog'][clickedItem];
    catalog = catalog.includes('1860') ? '1860' : catalog;
    
    const textureThumbSize = smallItem ? 256 : 512;
    const imgThumbSize = smallItem ? 512 : 1024;
    const imgFolder = sb === '1' || sb === '-1' ? 'samplebooks' : 'packages';
  
    const imgStringTexture = returnDomain() + 'texture_' + textureThumbSize + '/' + catalog + '.jpg';
    const imgStringBackprint = returnDomain() + 'backprints_detail_' + textureThumbSize + '/bp' + catalog + '.jpg';
    const imgString = returnDomain() + imgFolder + '_' + imgThumbSize + '/' + catalog + '.jpg';
    const detailImgString = getDetailImageString(texture,backprintImage,clickedItem);
  
    const svgSide = smallItem ? window.innerWidth * 0.042 : window.innerWidth * 0.09;
    const sSixth = svgSide / 6;
    const sThird = svgSide / 3;
    const sHalf = svgSide / 2;
    const sTwoThird = svgSide * 2/3;
    const sFiveSixth = svgSide * 5/6;
  
    const stroke = "#595959";
  
    return (
      <div 
        className={panelLayout==3 ? 'panelItem gridModeSmall' : panelLayout==2 ? 'panelItem gridMode' : 'panelItem listMode'} 
        title={getHoverInfo(clickedItem)} 
        onClick={handlePanelItemClick} 
        style={
          backgroundColor 
          ? { backgroundColor: data['dminHex'][clickedItem] } 
          : texture 
            ? { backgroundImage: `url(${imgStringTexture})`, backgroundPosition: 'center' } 
            : packageImage 
              ? { backgroundImage: `url(${imgString})`, backgroundPosition: 'center' } 
              : backprintImage
                ? { backgroundImage: `url(${imgStringBackprint})`, backgroundPosition: 'center' }
                : svgRadar 
                ? { backgroundColor: 'var(--yalemidgray)' }
                : { backgroundColor: 'var(--yalewhite)' }
              }
      >
        {svgRadar && <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width={svgSide} 
          height={svgSide}
        >
  
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
        <button 
          title='remove from selection' 
          className='selectionRemove material-icons' 
          onClick={handleRemove}
        >
          cancel
        </button>
        <button title='open detail panel' className='openDetailScreen material-icons' onClick={(e) => {e.stopPropagation(); setDetailScreen(true); setDetailImageStringState(detailImgString); setDetailImageIndex(clickedItem); setPackageImageIndex(0)}} >open_in_full</button>
        {textLength > 0 && <div className={svgRadar ? 'allText fixedOverlay' : 'allText'} >
          {textLength === 2 && <div className={infoPanelFontSize===1 ? 'catalogSmall' : infoPanelFontSize===2 ? 'catalogMid' : 'catalog'}>
            <p>{data['catalog'][clickedItem]==='_' ? '#' : '#' + data['catalog'][clickedItem]}</p>
          </div>}
          <div className='titleBar'>
            <p className={infoPanelFontSize===1 && ( svgRadar || packageImage ) ? 'titleBarSmall man lightman' : infoPanelFontSize===1 && !svgRadar && !packageImage ? 'titleBarSmall man' : infoPanelFontSize===2 && ( svgRadar || packageImage ) ? 'titleBarMid man lightman' : infoPanelFontSize===2 && !svgRadar && !packageImage ? 'titleBarMid man' : ( svgRadar || packageImage ) ? 'man lightman' : 'man'}>{data['man'][clickedItem]}</p>
            <p className={infoPanelFontSize===1 ? 'titleBarSmall bran' : infoPanelFontSize===2 ? 'titleBarMid bran' : 'bran'}>{data['bran'][clickedItem]==='_' ? '' : data['bran'][clickedItem]}</p>
            <p className={infoPanelFontSize===1 ? 'titleBarSmall year' : infoPanelFontSize===2 ? 'titleBarMid year' : 'year'}>{isNaN(data['year'][clickedItem]) ? '' : data['year'][clickedItem]}</p>
          </div>
          {textLength === 2 && <div className='infoBar'>
              {writeInfoArray(clickedItem).map((d,i) => <p className={infoPanelFontSize===1 ? 'boxWordSmall' : infoPanelFontSize===2 ? 'boxWordMid' : 'boxWord'} style={blankInfo ? {color:'transparent'} : !backgroundColor && !texture ? {color:'#969696'} : {color:'var(--yalemidlightgray)'}} key={i}>{d}</p>)}
          </div>}
        </div>}
      </div>
    )
  }