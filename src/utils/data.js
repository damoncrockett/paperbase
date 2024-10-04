import rawData from '../assets/data/data.json';
import { makeGroupLabels } from './glyph';

export const missingDminHexIdxs = [];
rawData['dminHex'].forEach((d,i) => {
  if ( d === '' ) {
    missingDminHexIdxs.push(i);
  }
});

const processData = (data) => {
  
  data['year'] = data['year'].map(d => parseInt(d));
  data['thickness'] = data['thickness'].map(d => parseFloat(parseFloat(d).toFixed(3)));
  data['gloss'] = data['gloss'].map(d => parseFloat(parseFloat(d).toFixed(3)));
  data['roughness'] = data['roughness'].map(d => parseFloat(parseFloat(d).toFixed(3)));
  data['dmin'] = data['dmin'].map(d => parseFloat(parseFloat(d).toFixed(3)));
  data['dmax'] = data['dmax'].map(d => parseFloat(parseFloat(d).toFixed(3)));
  data['auc'] = data['auc'].map(d => parseFloat(parseFloat(d).toFixed(3)));
  data['expressiveness'] = data['expressiveness'].map(d => parseFloat(parseFloat(d).toFixed(3)));

  data['radarColor'] = makeGroupLabels(data['radarGroup']);
  data['colorGroupColorWord'] = makeGroupLabels(data['colorWord']);
  data['colorGroupThickWord'] = makeGroupLabels(data['thicknessWord']);
  data['colorGroupTextureWord'] = makeGroupLabels(data['textureWord']);
  data['colorGroupGlossWord'] = makeGroupLabels(data['glossWord']);
  data['colorGroupMan'] = makeGroupLabels(data['man']);
  data['colorGroupBran'] = makeGroupLabels(data['bran']);
  data['colorGroupColl'] = makeGroupLabels(data['sb']);
  data['colorGroupDims'] = makeGroupLabels(data['dims']);

  data['colorGroupProcessing'] = makeGroupLabels(data['processing']);
  data['colorGroupBackp'] = makeGroupLabels(data['backp']);
  data['colorGroupSurf'] = makeGroupLabels(data['surf']);
  data['colorGroupResin'] = makeGroupLabels(data['resin']);
  data['colorGroupToner'] = makeGroupLabels(data['toner']);
  data['colorGroupPostcard'] = makeGroupLabels(data['postcard']);
  data['colorGroupCirca'] = makeGroupLabels(data['circa']);
  data['colorGroupSbid'] = makeGroupLabels(data['sbid']);

  data['boxGroup'] = Array(data['catalog'].length).fill('b');
  
  return data;

};

const data = processData(rawData);

export default data;