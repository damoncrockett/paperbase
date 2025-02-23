import React, { useEffect, useRef, useState } from 'react';
import { returnDomain } from '../utils/img';
import Descriptors from './Vis/Descriptors';
import Yellow from './Vis/Yellow';
import UV from './Vis/UV';
import visData from '../assets/data/visData.json';
import Basetone from './Vis/Basetone';
import basetoneData from '../assets/data/basetoneData.json';
import Surfs from './Vis/Surfs';
import Diversity from './Vis/Diversity';

const landingStyle = {
  backgroundImage: `url(${returnDomain()}hero.webp)`,
};

const injectFontFaces = () => {
  const style = document.createElement('style');
  const fontDefinitions = [
    {
      fontFamily: 'GoogleSans',
      fontPath: returnDomain() + 'fonts/GoogleSans-Medium.ttf',
      fontWeight: 500,
      fontStyle: 'normal',
      format: 'truetype'
    },
    {
      fontFamily: 'YaleNew',
      fontPath: returnDomain() + 'fonts/YaleNew-Roman.otf',
      fontStyle: 'normal',
      format: 'opentype'
    }
  ];

  const fontFaceRules = fontDefinitions.map(font => `
    @font-face {
      font-family: '${font.fontFamily}';
      src: url(${font.fontPath}) format('${font.format}');
      ${font.fontWeight ? `font-weight: ${font.fontWeight};` : ''}
      font-style: ${font.fontStyle};
    }
  `).join('\n');

  style.textContent = fontFaceRules;
  document.head.appendChild(style);
};

export default function Landing({ setPage }) {

  const [connections, setConnections] = useState([]);
  const [layoutReady, setLayoutReady] = useState(false);
  const methodsContentRef = useRef(null);
  const nextSectionRef = useRef(null);

  const [copySuccess, setCopySuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleCopyClick = () => {
    const citationText = "Crockett, D., P. Messier, and K. Mintie. (2024). Paperbase. Lens Media Lab, Yale University. https://paperbase.xyz";
    navigator.clipboard.writeText(citationText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  useEffect(() => {
    injectFontFaces();
  }, []);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = `${returnDomain()}hero.webp`;
    document.head.appendChild(link);
  
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  

  const scrollToNextSection = () => {
    if (nextSectionRef.current) {
      nextSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const methodRows = [
    { content: [null, { icon: 'apps', text: 'COMPLETE COLLECTION', addClass: 'completeCollection' }, null], annotation: `Paul began collecting gelatin silver photographic papers in 1999, and by 2016, the collection had mostly stabilized. The present count is <b>7245</b>, but we've started collecting again...` },
    { content: [null, { icon: 'filter_alt', text: 'FILTER', addClass: 'collectionFilter' }, null], annotation: `Paperbase is focused on the material properties of black and white gelatin silver papers, so we filter out any color papers, papers using different photo processes, and empty paper packages. <span style="color: var(--yaleorange); font-weight: 700;">We lose ~350 collection items during this step.</span>` },
    { content: [null, { icon: 'view_cozy', text: 'COLLECTION SUBSET', addClass: 'collectionSubset' }, null], annotation: `After filtering, what remains is <b>6898</b> collection items, ready to be measured.` },
    { content: [{ icon: 'inventory_2', text: 'PACKAGES', addClass: 'collectionSubset' }, null, { icon: 'book', text: 'SAMPLE BOOKS', addClass: 'collectionSubset' }], annotation: `The collection contains two distinct sample types: samples that come from packages of photographic paper, and samples published in manufacturer sample books. Samples from packages are base papers only, fixed but not developed, while sample book photographs contain developed images.` },
    { content: [{ icon: 'collections', text: 'MULTI-ANGLE PHOTOGRAPHY', addClass: 'collectionGrow' }, null, { icon: 'image', text: 'PHOTOGRAPH' }], annotation: `Sample book photographs are recorded with a single image. Packaged samples are not imaged, but their packages are, on all sides. <span style="color: var(--yaleblue); font-weight: 700;">This adds ~4000 images to the dataset.</span>` },
    { content: [{ icon: 'description', text: 'PROCESSING INSTRUCTIONS', addClass: 'collectionGrow' }, null, null], annotation: `We scan any processing instructions included in paper packages. <span style="color: var(--yaleblue); font-weight: 700;">This adds 674 PDFs to the dataset.</span>` },
    { content: [{ icon: 'fingerprint', text: 'BACKPRINT', addClass: 'collectionGrow' }, null, null], annotation: `We image and catalog any backprints appearing on packaged paper samples. <span style="color: var(--yaleblue); font-weight: 700;">There are 788 backprints in our dataset.</span>` },
    { content: [{ icon: 'texture', text: 'TEXTURE' }, null, { icon: 'texture', text: 'EDGE TEXTURE', addClass: 'collectionFilter' }], annotation: `We capture surface texture via raking light micrography. Because image-free areas are rare in developed photos, sample book texture images are usually taken on the white edges of the photograph. <span style="color: var(--yaleorange); font-weight: 700;">Roughly 700 samples have no such edge and could not be imaged.</span>` },
    { content: [{ icon: 'vertical_align_center', text: 'MICROMETER' }, null, { icon: 'vertical_align_bottom', text: 'DEPTH GAUGE', addClass: 'collectionFilter' }], annotation: `Packaged samples are measured for thickness using a micrometer. Because sample book photographs are mounted, they are measured with a depth gauge where possible. <span style="color: var(--yaleorange); font-weight: 700;">Nearly 1700 sample book photographs were flush-mounted and could not be measured.</span>` },
    { content: [{ icon: 'check_box_outline_blank', text: 'BASE COLOR' }, null, { icon: 'account_box', text: 'BASE AND IMAGE COLOR', addClass: 'collectionGrow' }], annotation: `Color measurements are made using a spectrophotometer and converted to CIELAB color space. We measure both the image and base colors of sample book photographs. <span style="color: var(--yaleblue); font-weight: 700;">This adds ~4100 color measurements to the dataset.</span>` },
    { content: [null, { icon: 'flash_on', text: 'GLOSS' }, null], annotation: `Gloss is measured using a glossmeter, with incident light at a 60° angle.` },
    { content: [null, { icon: 'radar', text: 'RADAR CHART', addClass: 'radarChart' }, null], annotation: `Our material model of a photographic paper sample contains 4 univariate measures that populate the axes of a radar chart: thickness, gloss, roughness, and warmth. Texture images are processed via bandpass filtering, and roughness is the standard deviation of the resulting pixel brightnesses. Warmth is the <b>b*</b> dimension of the CIELAB color space.` },
    { content: [null, { icon: 'view_in_ar', text: 'WEBGL', addClass: 'webgl' }, null], annotation: `The Paperbase application uses WebGL to create an interactive 3D visualization of the collection data.` },
  ];

  const methodRowsNarrow = [
    { content: [{ icon: 'apps', text: 'COMPLETE COLLECTION', addClass: 'completeCollection' }, null], annotation: `Paul began collecting gelatin silver photographic papers in 1999, and by 2016, the collection had mostly stabilized. The present count is <b>7245</b>, but we've started collecting again...` },
    { content: [{ icon: 'filter_alt', text: 'FILTER', addClass: 'collectionFilter' }, null], annotation: `Paperbase is focused on the material properties of black and white gelatin silver papers, so we filter out any color papers, papers using different photo processes, and empty paper packages. <span style="color: var(--yaleorange); font-weight: 700;">We lose ~350 collection items during this step.</span>` },
    { content: [{ icon: 'view_cozy', text: 'COLLECTION SUBSET', addClass: 'collectionSubset' }, null], annotation: `After filtering, what remains is <b>6898</b> collection items, ready to be measured.` },
    { content: [{ icon: 'inventory_2', text: 'PACKAGES', addClass: 'collectionSubset' }, { icon: 'book', text: 'SAMPLE BOOKS', addClass: 'collectionSubset' }], annotation: `The collection contains two distinct sample types: samples that come from packages of photographic paper, and samples published in manufacturer sample books. Samples from packages are base papers only, fixed but not developed, while sample book photographs contain developed images.` },
    { content: [{ icon: 'collections', text: 'MULTI-ANGLE PHOTOGRAPHY', addClass: 'collectionGrow' }, { icon: 'image', text: 'PHOTOGRAPH' }], annotation: `Sample book photographs are recorded with a single image. Packaged samples are not imaged, but their packages are, on all sides. <span style="color: var(--yaleblue); font-weight: 700;">This adds ~4000 images to the dataset.</span>` },
    { content: [{ icon: 'description', text: 'PROCESSING INSTRUCTIONS', addClass: 'collectionGrow' }, null], annotation: `We scan any processing instructions included in paper packages. <span style="color: var(--yaleblue); font-weight: 700;">This adds 674 PDFs to the dataset.</span>` },
    { content: [{ icon: 'fingerprint', text: 'BACKPRINT', addClass: 'collectionGrow' }, null], annotation: `We image and catalog any backprints appearing on packaged paper samples. <span style="color: var(--yaleblue); font-weight: 700;">There are 788 backprints in our dataset.</span>` },
    { content: [{ icon: 'texture', text: 'TEXTURE' }, { icon: 'texture', text: 'EDGE TEXTURE', addClass: 'collectionFilter' }], annotation: `We capture surface texture via raking light micrography. Because image-free areas are rare in developed photos, sample book texture images are usually taken on the white edges of the photograph. <span style="color: var(--yaleorange); font-weight: 700;">Roughly 700 samples have no such edge and could not be imaged.</span>` },
    { content: [{ icon: 'vertical_align_center', text: 'MICROMETER' }, { icon: 'vertical_align_bottom', text: 'DEPTH GAUGE', addClass: 'collectionFilter' }], annotation: `Packaged samples are measured for thickness using a micrometer. Because sample book photographs are mounted, they are measured with a depth gauge where possible. <span style="color: var(--yaleorange); font-weight: 700;">Nearly 1700 sample book photographs were flush-mounted and could not be measured.</span>` },
    { content: [{ icon: 'check_box_outline_blank', text: 'BASE COLOR' }, { icon: 'account_box', text: 'BASE AND IMAGE COLOR', addClass: 'collectionGrow' }], annotation: `Color measurements are made using a spectrophotometer and converted to CIELAB color space. We measure both the image and base colors of sample book photographs. <span style="color: var(--yaleblue); font-weight: 700;">This adds ~4100 color measurements to the dataset.</span>` },
    { content: [{ icon: 'flash_on', text: 'GLOSS' }, null], annotation: `Gloss is measured using a glossmeter, with incident light at a 60° angle.` },
    { content: [{ icon: 'radar', text: 'RADAR CHART', addClass: 'radarChart' }, null], annotation: `Our material model of a photographic paper sample contains 4 univariate measures that populate the axes of a radar chart: thickness, gloss, roughness, and warmth. Texture images are processed via bandpass filtering, and roughness is the standard deviation of the resulting pixel brightnesses. Warmth is the <b>b*</b> dimension of the CIELAB color space.` },
    { content: [{ icon: 'view_in_ar', text: 'WEBGL', addClass: 'webgl' }, null], annotation: `The Paperbase application uses WebGL to create an interactive 3D visualization of the collection data.` },
  ];

  // One-time layout detection
  useEffect(() => {
    if (!methodsContentRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        setLayoutReady(true);
        // Disconnect after layout is detected
        resizeObserver.disconnect();
      });
    });

    resizeObserver.observe(methodsContentRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);

  // Connection-drawing effect
  useEffect(() => {
    if (!layoutReady || !methodsContentRef.current) return;

    const content = methodsContentRef.current;
    const rows = content.querySelectorAll('.methodRow');
    const contentRect = content.getBoundingClientRect();
    const newConnections = [];
  
    // Handle PHOTOGRAPH to EDGE TEXTURE connection
    let photographBlock = null;
    let edgeTextureBlock = null;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i].textContent.includes('PHOTOGRAPH')) {
        photographBlock = rows[i].querySelector('.methodBlock:nth-child(3)');
      }
      if (rows[i].textContent.includes('EDGE TEXTURE')) {
        edgeTextureBlock = rows[i].querySelector('.methodBlock:nth-child(3)');
      }
      if (photographBlock && edgeTextureBlock) break;
    }

    if (photographBlock && edgeTextureBlock) {
      const photographRect = photographBlock.getBoundingClientRect();
      const edgeTextureRect = edgeTextureBlock.getBoundingClientRect();
      const startX = photographRect.left + photographRect.width / 2 - contentRect.left;
      const startY = photographRect.bottom - contentRect.top;
      const endX = edgeTextureRect.left + edgeTextureRect.width / 2 - contentRect.left;
      const endY = edgeTextureRect.top - contentRect.top;
      newConnections.push(`M${startX},${startY} L${endX},${endY}`);
    }
  
    // Handle other connections
    for (let col = 0; col < 3; col++) {
      let lastFilledBlock = null;
      let lastFilledRow = 0;
  
      for (let row = 0; row < rows.length; row++) {
        const block = rows[row].querySelector(`.methodBlock:nth-child(${col + 1}):not(.empty)`);
        
        if (block) {
          const blockRect = block.getBoundingClientRect();
          
          if (lastFilledBlock) {
            const lastRect = lastFilledBlock.getBoundingClientRect();
            const startX = lastRect.left + lastRect.width / 2 - contentRect.left;
            const startY = lastRect.bottom - contentRect.top;
            const endX = blockRect.left + blockRect.width / 2 - contentRect.left;
            const endY = blockRect.top - contentRect.top;
  
            if (row - lastFilledRow === 1) {
              newConnections.push(`M${startX},${startY} L${endX},${endY}`);
            }
          }
  
          lastFilledBlock = block;
          lastFilledRow = row;
        }
      }
    }

    function generateRoundedCornerPath(startX, startY, endX, endY, radius, direction) {
      let path = `M${startX},${startY} `;
  
      const horizontalDir = endX > startX ? 1 : -1;
      const verticalDir = endY > startY ? 1 : -1;
  
      if (direction === 'horizontal-first') {
        // Move horizontally first, then down
        const cornerX = endX;
        const cornerY = startY;
  
        const horizontalEndX = cornerX - horizontalDir * radius;
        const verticalStartY = cornerY + verticalDir * radius;
  
        path += `H${horizontalEndX} `;
        path += `A${radius},${radius} 0 0 ${horizontalDir === verticalDir ? 1 : 0} ${cornerX},${verticalStartY} `;
        path += `V${endY}`;
      } else if (direction === 'vertical-first') {
        // Move vertically first, then sideways (correct arc handling)
        const cornerX = startX;
        const cornerY = endY;
  
        const verticalEndY = cornerY - verticalDir * radius;
        const horizontalStartX = cornerX + horizontalDir * radius;
  
        // Correct the sweep flag to avoid the "scoop" effect
        path += `V${verticalEndY} `;
        path += `A${radius},${radius} 0 0 ${horizontalDir === verticalDir ? 0 : 1} ${horizontalStartX},${cornerY} `;
        path += `H${endX}`;
      }
  
      return path;
    }
  
    // Connection from SUBSET to PACKAGES (sideways first, then down)
    const subsetBlock = rows[2].querySelector('.methodBlock:nth-child(2)');
    const packagesBlock = rows[3].querySelector('.methodBlock:nth-child(1)');

    if (subsetBlock && packagesBlock) {
      const subsetRect = subsetBlock.getBoundingClientRect();
      const packagesRect = packagesBlock.getBoundingClientRect();

      const startX = subsetRect.left - contentRect.left;
      const startY = subsetRect.top + subsetRect.height / 2 - contentRect.top;

      const endX = packagesRect.left + packagesRect.width / 2 - contentRect.left;  // Center top of PACKAGES
      const endY = packagesRect.top - contentRect.top;

      const path = generateRoundedCornerPath(startX, startY, endX, endY, 10, 'horizontal-first');

      newConnections.push(path);
    }

    // Connection from SUBSET to SAMPLE BOOKS (sideways first, then down)
    const sampleBooksBlock = rows[3].querySelector('.methodBlock:nth-child(3)');

    if (subsetBlock && sampleBooksBlock) {
      const subsetRect = subsetBlock.getBoundingClientRect();
      const sampleBooksRect = sampleBooksBlock.getBoundingClientRect();

      const startX = subsetRect.right - contentRect.left;
      const startY = subsetRect.top + subsetRect.height / 2 - contentRect.top;

      const endX = sampleBooksRect.left + sampleBooksRect.width / 2 - contentRect.left;  // Center top of SAMPLE BOOKS
      const endY = sampleBooksRect.top - contentRect.top;

      const path = generateRoundedCornerPath(startX, startY, endX, endY, 10, 'horizontal-first');

      newConnections.push(path);
    }

    // Connection from BASE COLOR to left side of GLOSS (down first, then sideways)
    const baseColorBlock = rows[9].querySelector('.methodBlock:nth-child(1)');
    const glossBlock = rows[10].querySelector('.methodBlock:nth-child(2)');

    if (baseColorBlock && glossBlock) {
      const baseColorRect = baseColorBlock.getBoundingClientRect();
      const glossRect = glossBlock.getBoundingClientRect();

      const startX = baseColorRect.left + baseColorRect.width / 2 - contentRect.left;  // Center bottom of BASE COLOR
      const startY = baseColorRect.bottom - contentRect.top;

      const endX = glossRect.left - contentRect.left;  // Left side of GLOSS
      const endY = glossRect.top + glossRect.height / 2 - contentRect.top;  // Center of GLOSS's left side

      const path = generateRoundedCornerPath(startX, startY, endX, endY, 10, 'vertical-first');

      newConnections.push(path);
    }

    // Connection from BASE AND IMAGE COLOR to right side of GLOSS (down first, then sideways)
    const baseAndImageColorBlock = rows[9].querySelector('.methodBlock:nth-child(3)');
    if (baseAndImageColorBlock && glossBlock) {
      const baseAndImageColorRect = baseAndImageColorBlock.getBoundingClientRect();
      const glossRect = glossBlock.getBoundingClientRect();

      const startX = baseAndImageColorRect.left + baseAndImageColorRect.width / 2 - contentRect.left;  // Center bottom of BASE AND IMAGE COLOR
      const startY = baseAndImageColorRect.bottom - contentRect.top;

      const endX = glossRect.right - contentRect.left;  // Right side of GLOSS
      const endY = glossRect.top + glossRect.height / 2 - contentRect.top;  // Center of GLOSS's right side

      const path = generateRoundedCornerPath(startX, startY, endX, endY, 10, 'vertical-first');

      newConnections.push(path);
    }

    setConnections(newConnections);
  }, [layoutReady]);

  const tooNarrowMsg = "Please use a larger screen to view the collection.";
  const tooNarrow = window.matchMedia("(max-width: 1375px)").matches;

  return (
    <div id='landing' style={landingStyle}>
      <div id='landingBlurb'>
        <p id='blurbTitle'>Paperbase.</p>
        <p id='blurbText'>Paperbase is an interactive visual platform for exploring and analyzing the world's largest collection of photographic paper. Designed and built by the <a href='https://lml.yale.edu/' target='_blank'>Lens Media Lab</a> at Yale University.</p>
        {!tooNarrow && <button onClick={() => setPage('app')}>Explore the collection</button>}
        {tooNarrow && <p id='tooNarrowMsg'>{tooNarrowMsg}</p>}
      </div>
      <div className="scroll-indicator" onClick={scrollToNextSection}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
          <polyline points="6 15 12 21 18 15" />
        </svg>
      </div>
      <div className='landingContent'>
        <div id='s1' className='landingContentSection' ref={nextSectionRef}>
          <div className='landingContentSectionTitle'>
            <h2>THE COLLECTION</h2>
            <p className='subtitle'>Our reference collection of gelatin silver photographic papers.</p>
          </div>
          <div className='landingContentItems'>
            <div className='landingContentItem'>
              <p>Throughout the twentieth century, photography was fundamentally a paper-based medium, and photographic papers have played a crucial role in shaping the medium's history and practice. However, little research has been done on how the material, technical, and visual properties of these papers impacted the work of photographers. This lack of scholarly attention stems partly from the difficulty of accessing and analyzing the physical characteristics of historical photographic papers.</p>
            </div>
            <div className='landingContentItem'>
              <p>To address this gap, the Lens Media Lab at Yale University's Institute for the Preservation of Cultural Heritage has undertaken an extensive project to document and characterize its collection of over 7,200 dated and identified gelatin silver papers manufactured between 1890 and 2010. <span style={{fontWeight: '200'}}>This is believed to be the largest reference collection of photographic paper samples in the world.</span> From this collection, the lab has constructed a rich and comprehensive dataset that combines traditional catalog information with extensive material analyses. <span style={{fontWeight: '700'}}>This dataset is now public.</span></p>
            </div>
            <div id='firstInNumbersRow' className='landingContentItem inNumbersSection'>
              <div className='inNumbersGrid'>
                <div className='inNumbersItem'>
                  <p className='inNumbersValue'>95,368</p>
                  <p className='inNumbersLabel'>measurement trials</p>
                </div>
                <div className='inNumbersItem sampleCount'>
                  <p className='inNumbersValue sampleCount'>6,898</p>
                  <p className='inNumbersLabel sampleCount'>measured samples</p>
                </div>
                <div className='inNumbersItem'>
                  <p className='inNumbersValue'>6,456</p>
                  <p className='inNumbersLabel'>package images</p>
                </div>
                <div className='inNumbersItem'>
                  <p className='inNumbersValue'>4,266</p>
                  <p className='inNumbersLabel'>products</p>
                </div>
                <div className='inNumbersItem'>
                  <p className='inNumbersValue'>4,506</p>
                  <p className='inNumbersLabel'>sample book images</p>
                </div>
                <div className='inNumbersItem sampleCount'>
                  <p className='inNumbersValue sampleCount'>2,391</p>
                  <p className='inNumbersLabel sampleCount'>packages</p>
                </div>
                <div className='inNumbersItem'>
                  <p className='inNumbersValue'>788</p>
                  <p className='inNumbersLabel'>backprints</p>
                </div>
                <div className='inNumbersItem'>
                  <p className='inNumbersValue'>388</p>
                  <p className='inNumbersLabel'>brands</p>
                </div>
                <div className='inNumbersItem sampleCount'>
                  <p className='inNumbersValue sampleCount'>231</p>
                  <p className='inNumbersLabel sampleCount'>sample books</p>
                </div>
                <div className='inNumbersItem'>
                  <p className='inNumbersValue'>209</p>
                  <p className='inNumbersLabel'>surface descriptors</p>
                </div>
                <div className='inNumbersItem'>
                  <p className='inNumbersValue'>120</p>
                  <p className='inNumbersLabel'>years</p>
                </div>
                <div className='inNumbersItem'>
                  <p className='inNumbersValue'>100</p>
                  <p className='inNumbersLabel'>manufacturers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id='s2' className='landingContentSection methodsSection'>
          <div className='methodsSectionInner'>
            <div className='landingContentSectionTitle'>
              <h2>THE DATASET</h2>
              <p className='subtitle'>How the collection is photographed, measured, processed, and modeled.</p>
            </div>
            <div className='methodsContent' ref={methodsContentRef}>
              {(window.matchMedia("(max-width: 800px)").matches ? methodRowsNarrow : methodRows).map((row, rowIndex) => (
                <div key={rowIndex} className={`methodRow ${rowIndex < 3 || [5,6,10,11,12].includes(rowIndex) ? 'earlyRow' : 'lateRow'}`}>
                  {row.content.map((block, blockIndex) => (
                    block ? (
                      <div key={blockIndex} className={`methodBlock ${block.addClass ? block.addClass : ''}`}>
                        {block.icon && <span className="material-icons">{block.icon}</span>}
                        <p>{block.text}</p>
                      </div>
                    ) : <div key={blockIndex} className="methodBlock empty"></div>
                  ))}
                  <div className='methodAnnotation'>
                    <p dangerouslySetInnerHTML={{ __html: row.annotation }} />
                  </div>
                </div>
              ))}
              <svg className="methodConnections" width="100%" height="100%">
                {connections.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke="var(--yalemidgray)" strokeWidth="1" />
                ))}
              </svg>
            </div>
          </div>
        </div>
        <div id='s3' className='landingContentSection dataInsightsSection'>
          <div id='insights' className='landingContentSectionTitle'>
            <h2>DATA INSIGHTS</h2>
          </div>
          <div className='landingContentItems'>
            <div className='dataInsightUnit'>
              <h3>White Keeps Getting Whiter</h3>
              <p>For nearly all color descriptors in our data, including "White", shown below, the whiteness of the paper has increased over time. It's unclear whether this is due to the aging of older papers, or whether this was a conscious stylistic choice.</p>
              <Yellow data={visData.yellowData} />
            </div>
            <div className='dataInsightUnit'>
              <h3>Manufacturer Descriptions</h3>
              <p>There is some standardization across manufacturers of the language used to describe the physical properties of photographic papers. This visualization shows the distribution of the most common descriptors across our collection.</p>
              <Descriptors categories={visData.descriptorsData.categories} />
            </div>
            <div className='dataInsightUnit'>
              <h3>Highlights and Shadows</h3>
              <p>We expected base warmth and image warmth to be strongly correlated, but the correlation is actually quite weak: ρ = 0.17. Here, we show this relationship using a scatterplot with icons containing both the base(background) and image (foreground) colors.</p>
              <Basetone data={basetoneData} />
            </div>
            <div className='dataInsightUnit'>
              <h3>The Sudden Appearance of Fluorescence</h3>
              <p>Beginning around 1950, photographic paper manufacturers started using optical brightening agents (OBAs) to make paper whiter. These additives also make the paper fluoresce under ultraviolet light. The proportion of papers containing OBAs increased rapidly after 1980, as measured by the intensity of the fluorescence.</p>
              <UV data={visData.uvData} />
            </div>
            <div className='dataInsightUnit'>
              <h3>Paper Surfaces</h3>
              <p>The same paper surfaces can reappear frequently in our data. For many combinations of manufacturer, brand, and surface, we have many dozens of examples in our collection. Here is every surface in the collection with at least 50 examples. All but one are Kodak!</p>
              <Surfs />
            </div>
            <div className='dataInsightUnit'>
              <h3>Material Diversity</h3>
              <p>Manufacturer descriptions of paper surfaces are not physically uniform. Here, we illustrate this point by looking at the distribution of measured thicknesses for the weight descriptors "Single Weight" and "Double Weight". The two distributions overlap more than you'd expect! We see this across all descriptor types.</p>
              <Diversity />
            </div>
          </div>
        </div>
        <div id='s4' className='landingContentSection appTutorialsSection'>
          <div className='landingContentSectionTitle'>
            <h2>VIDEO TUTORIALS</h2>
            <p className='subtitle'>Video walkthroughs of advanced use cases and feature combinations.</p>
          </div>
          <div className='landingContentItems'>
            <div className='tutorialItem'>
              <div className='videoContainer'>
                <iframe 
                  src="https://www.youtube.com/embed/piMVo9iV-DU?si=sR_zi4Z11HPNeg7e" 
                  title="The Texture Map" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen>
                </iframe>
              </div>
              <div className='tutorialBlurb'>
                <h3>The Texture Map</h3>
                <p className='tutorialDescription'>The texture map arranges collection items into a 3D landscape where nearby items have similar surface textures. In this tutorial, we show you how to use the texture map to better understand manufacturer texture descriptions.</p>
                <p className='tutorialAdditional'><b>+</b> categorical color mapping, box selection, surface micrographs, filtering using both texture descriptors and the roughness slider, 3D plot rotation, panel text settings</p>
              </div>
            </div>
            <div className='tutorialItem'>
              <div className='videoContainer'>
                <iframe 
                  src="https://www.youtube.com/embed/ycz1nlf1Mks?si=sjkJ6eOLHxxQ_I1p" 
                  title="Historical Research" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen>
                </iframe>
              </div>
              <div className='tutorialBlurb'>
                <h3>Historical Research</h3>
                <p className='tutorialDescription'>Paperbase hosts a variety of high-resolution image assets which can be used for deep historical research on photographic papers. In this tutorial, we show you how to use the detail screen to simulate direct contact with our collection materials.</p>
                <p className='tutorialAdditional'><b>+</b> data download, links to LUX records, backprints, removing panel items</p>
              </div>
            </div>
            <div className='tutorialItem'>
              <div className='videoContainer'>
                <iframe 
                  src="https://www.youtube.com/embed/cd0YKz3Xbmw?si=MFIp4ytnLPsxoECg" 
                  title="Visualizing Continuous Variables" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen>
                </iframe>
              </div>
              <div className='tutorialBlurb'>
                <h3>Visualizing Continuous Variables</h3>
                <p className='tutorialDescription'>Paperbase offers a number of ways to visualize continuous variables like thickness, gloss, warmth, and roughness. In this tutorial, we show you how to map these variables to layouts and colors, and we discuss the relative merits of each mapping.</p>
                <p className='tutorialAdditional'><b>+</b> vertical sorting in histograms, representations of missing data, animated layout transitions, 3D plot rotation</p>
              </div>
            </div>
            <div className='tutorialItem'>
              <div className='videoContainer'>
                <iframe 
                  src="https://www.youtube.com/embed/6epRM60L-Cc?si=orIDf_mh6BcCUxNm" 
                  title="Filter Panel as Data Visualization" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen>
                </iframe>
              </div>
              <div className='tutorialBlurb'>
                <h3>Filter Panel as Data Visualization</h3>
                <p className='tutorialDescription'>Paperbase's filter panel is both a set of controls for the 3D visualization canvas and a data visualization in its own right, because its buttons and sliders carry information about the relative frequencies of variable values in the filtered data. In this tutorial, we demonstrate the considerable power of the filter panel and how it can be used for research.</p>
                <p className='tutorialAdditional'><b>+</b> spread slider, filter group expand button, filter counter, year histogram, viewing base colors in the selection panel, surface codes, surface micrographs, sample book browsing</p>
              </div>
            </div>
            <div className='tutorialItem'>
              <div className='videoContainer'>
                <iframe 
                  src="https://www.youtube.com/embed/HTXScEOwze8?si=IJ6cTGYquT_DzuhC" 
                  title="The Cluster Plot" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen>
                </iframe>
              </div>
              <div className='tutorialBlurb'>
                <h3>The Cluster Plot</h3>
                <p className='tutorialDescription'>The cluster plot is a hybrid of discrete and continuous representations of our collection's material properties—i.e., thickness, gloss, warmth, and roughness. Collection items are grouped by material similarity, and these groups are then plotted together on a continuous plane, again by material similarity. The cluster plot is an alternative to viewing the collection in a 3D Cartesian space, which may make certain relationships easier to see. In this tutorial, we discuss the cluster plot in depth and compare it with the 3D scatterplot.</p>
                <p className='tutorialAdditional'><b>+</b> radar charts, radar groups, group color shuffle, spread slider, alternative 3D glyphs, selection highlight tracking</p>
              </div>
            </div>
          </div>
        </div>
        <div id='s5' className='landingContentSection researchSection'>
          <div className='landingContentSectionTitle'>
            <h2>THEORY & RESEARCH</h2>
            <p className='subtitle'>Published work that laid the foundation for Paperbase.</p>
          </div>
          <div className='landingContentItems'>
            <div className='researchPaperUnit'>
              <h3>Closer Looking: Computer Vision in Material Studies of Art</h3>
              <p className='author'>Katherine Mintie, Paul Messier, and Damon Crockett</p>
              <p className='journal'>Art Bulletin 106 (2), 29-32, 2024.</p>
              <p className='abstract'>This paper proposes that computational methods coupled with domain-specific expertise offer a powerful tool for recognizing material differences and similarities across large corpora. Computational methods can be broadly defined as research in which various data are collected, modelled, and analyzed by computers to support scholarly inquiry. In arguing for the applicability of computational methods to materials-based art historical research, this paper will address key questions such as how to determine when this approach is appropriate, the central role of subject matter expertise in data selection and visualization, and the potential of these methods to inform scholarship going forward.</p>
              <a href="https://www.tandfonline.com/doi/full/10.1080/00043079.2024.2296276" target='_blank' className='readLink'>
                <span className="material-icons">article</span>
                Read the essay
              </a>
            </div>
            <div className='researchPaperUnit'>
              <h3>An Objective Revaluation of Photograms by László Moholy-Nagy</h3>
              <p className='author'>Sylvie Pénichon, Krista Lough, and Paul Messier</p>
              <p className='journal'>Leonardo 53 (3), 292-295, 2017.</p>
              <p className='abstract'>Throughout his career, László Moholy-Nagy (1895–1946) produced many photograms, a selection of which was examined in European and American collections. Sheet dimensions and thickness, base color, surface gloss and texture were recorded. The analysis of the data and the results of this investigation are presented in this article. The article also explores the effectiveness of paper characterization and how it can contribute to and enhance historical research when applied to a particular body of work by one artist.</p>
              <a href="https://www.researchgate.net/profile/Sylvie-Penichon/publication/315987819_An_Objective_Revaluation_of_Photograms_by_Laszlo_Moholy-Nagy/links/5a7dca77aca272341af0d16d/An-Objective-Revaluation-of-Photograms-by-Laszlo-Moholy-Nagy.pdf" target='_blank' className='readLink'>
                <span className="material-icons">article</span>
                Read the paper
              </a>
            </div>
            <div className='researchPaperUnit'>
              <h3>Reading the Paper: Expressive Dimensions of Photographic Prints</h3>
              <p className='author'>Paul Messier and Jennifer McGlinchey Sexton</p>
              <p className='journal'>in <i>Photography Inc.: Your Image Is Our Business</i>, Lannoo, 2015.</p>
              <p className='abstract'>Paper, everywhere and ordinary, is typically 'the poor relation' to applied media. Markings are different whether in charcoal, ink, graphite, or silver. Media on paper conveys meaning: words or pictures, literature or art. The same is certainly true in photography where the image is the message; the image is everything. Or is it?</p>
              <a href="https://www.researchgate.net/publication/301891399_Reading_the_Paper" target='_blank' className='readLink'>
                <span className="material-icons">article</span>
                Read the paper
              </a>
            </div>
            <div className='researchPaperUnit'>
              <h3>Correlation between gloss reflectance and surface texture in photographic paper</h3>
              <p className='author'>Kevin Vessot, Paul Messier, Joyce M Hyde, Christopher A Brown</p>
              <p className='journal'>Scanning 37 (3), 204-217, 2015.</p>
              <p className='abstract'>Surface textures of a large collection of photographic papers dating from 1896 to the present were measured using a laser scanning confocal microscope (LSCM) with four different objective lenses. Roughness characterization parameters were calculated from the texture measurements and were compared with gloss measurements.</p>
              <a href="https://www.researchgate.net/profile/Paul-Messier-2/publication/258436850_Correlation_between_gloss_reflectance_and_surface_texture_in_photographic_paper/links/5f2abb08299bf13404a3e08b/Correlation-between-gloss-reflectance-and-surface-texture-in-photographic-paper.pdf" target='_blank' className='readLink'>
                <span className="material-icons">article</span>
                Read the paper
              </a>
            </div>
            <div className='researchPaperUnit'>
              <h3>Photographic Paper XYZ: De Facto Standard Sizes for Silver Gelatin Paper</h3>
              <p className='author'>Jennifer McGlinchey Sexton, Paul Messier</p>
              <p className='journal'>Journal of the American Institute for Conservation 53 (4), 219-235, 2014.</p>
              <p className='abstract'>Historical references of silver gelatin photographic paper sheet size and thickness were collected to determine standardized dimensions in use during the 20th century. A total of 32 sizes and three thicknesses were determined to be de facto standards.</p>
              <a href="https://www.researchgate.net/profile/Paul-Messier-2/publication/286692113_Photographic_paper_XYZ_De_facto_standard_sizes_for_silver_gelatin_paper/links/5f29c0b992851cd302dbfa3b/Photographic-paper-XYZ-De-facto-standard-sizes-for-silver-gelatin-paper.pdf" target='_blank' className='readLink'>
                <span className="material-icons">article</span>
                Read the paper
              </a>
            </div>
            <div className='researchPaperUnit'>
              <h3>Pursuing automated classification of historic photographic papers from raking light images</h3>
              <p className='author'>C Richard Johnson, Paul Messier, William A Sethares, Andrew G Klein, Christopher Brown, Anh Hoang Do, Philip Klausmeyer, Patrice Abry, Stephane Jaffard, Herwig Wendt, Stephane Roux, Nelly Pustelnik, Nanne Van Noord, Laurens Van Der Maaten, Eric Postma, James Coddington, Lee Ann Daffner, Hanako Murata, Henry Wilhelm, Sally Wood, Mark Messier</p>
              <p className='journal'>Journal of the American Institute for Conservation 53 (3), 159-170, 2014.</p>
              <p className='abstract'>This work provides evidence that automatic, computer-based classification of texture documented with raking light is feasible by demonstrating an encouraging degree of success sorting a set of 120 images made from samples of historic silver gelatin paper.</p>
              <a href="https://hal.science/hal-03464914/document" target='_blank' className='readLink'>
                <span className="material-icons">article</span>
                Read the paper
              </a>
            </div>
            <div className='researchPaperUnit'>
              <h3>Image Isn't Everything: Revealing Affinities across Collections through the Language of the Photographic Print</h3>
              <p className='author'>Paul Messier</p>
              <p className='journal'>in <i>Object:Photo. Modern Photographs: The Thomas Walther Collection 1909-1949</i>, Museum of Modern Art, 332-339, 2014.</p>
              <p className='abstract'>A photograph is more than an image. Paper, the physical material of the photographer, plays a vital role in the appearance of a photographic print and in conveying the photographer's intention for it. Texture, gloss, highlight color, and sheet thickness — the defining characteristics of photographic paper — each contribute significantly to the visual impact of a print. Paper manufacturers have long manipulated these key characteristics, singly and in combination, to differentiate their products and to satisfy a broad spectrum of market demands.</p>
              <a href="https://scholar.google.com/scholar?oi=bibs&cluster=12319685399683587963&btnI=1&hl=en" target='_blank' className='readLink'>
                <span className="material-icons">article</span>
                Read the paper
              </a>
            </div>
          </div>
        </div>
        <div id='s6' className='landingContentSection presentationsAndPressSection'>
          <div className='presentationsAndPressContent'>
            <div className='publicTalksSection'>
              <h2 id='publicTalksTitle' className='sectionTitle'>PUBLIC TALKS</h2>
              <div className='videoGrid'>
                <div className='videoItem'>
                  <div className='videoContainer'>
                    <iframe 
                      width="560" 
                      height="315" 
                      src="https://www.youtube.com/embed/iK6FkDVBT4g?si=86hUYBoxbMAP0Z3u" 
                      title="Lens Media Lab Background, Collection, Research" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen>
                    </iframe>
                  </div>
                  <p className='videoTitle'>Lens Media Lab Background, Collection, Research</p>
                  <p className='videoPresenter'>Paul Messier</p>
                </div>
                <div className='videoItem'>
                  <div className='videoContainer'>
                    <iframe 
                      width="560" 
                      height="315" 
                      src="https://www.youtube.com/embed/IjW6EIEzW-k?si=bJvxfZ3TJdzZGJ9i" 
                      title="Exploring the Material History of Black and White Paper with Paperbase" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen>
                    </iframe>
                  </div>
                  <p className='videoTitle'>Exploring the Material History of Black and White Paper with Paperbase</p>
                  <p className='videoPresenter'>Damon Crockett</p>
                </div>
                <div className='videoItem'>
                  <div className='videoContainer'>
                    <iframe 
                      width="560" 
                      height="315" 
                      src="https://www.youtube.com/embed/ionDa9Tna8E?si=2jQHfwIgbTGFAZtY" 
                      title="Paperbase as a Tool for Photo Historical Research" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen>
                    </iframe>
                  </div>
                  <p className='videoTitle'>Paperbase as a Tool for Photo Historical Research</p>
                  <p className='videoPresenter'>Katherine Mintie</p>
                </div>
                <div className='videoItem'>
                  <div className='videoContainer'>
                    <iframe 
                      width="560" 
                      height="315" 
                      src="https://www.youtube.com/embed/CDKS7Qvr1sM?si=ECmx1BdLHrODi--0" 
                      title="The LML Method" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen>
                    </iframe>
                  </div>
                  <p className='videoTitle'>The LML Method</p>
                  <p className='videoPresenter'>Damon Crockett</p>
                </div>
              </div>
            </div>
            <div className='pressSection'>
              <h2 className='sectionTitle'>PRESS</h2>
              <div className='pressGrid'>
                <div className='pressItem'>
                  <a href="https://news.yale.edu/2024/08/28/analyzing-photographic-process-darkroom-data" target='_blank' rel="noopener noreferrer">
                    <div className='pressSource'>Yale News</div>
                    <div className='pressTitle'>Analyzing the photographic process from darkroom to data</div>
                  </a>
                </div>
                <div className='pressItem'>
                  <a href="https://theclassicphotomag.com/paperbase-visualizing-material-black-and-white-paper/" target='_blank' rel="noopener noreferrer">
                    <div className='pressSource'>The Classic Magazine</div>
                    <div className='pressTitle'>Paperbase: Visualizing the Material History of Black and White Paper</div>
                  </a>
                </div>
                <div className='pressItem'>
                  <a href={returnDomain() + "PaperbasePressKit.zip"} download>
                    <div className='pressTitle' style={{ color: '#63aaff' }}><span className="material-icons" style={{ color: '#63aaff', fontSize: '2rem', verticalAlign: 'middle', marginRight: '0.5rem' }}>download</span>Download our press kit</div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id='s7' className='landingContentSection companionAppsSection'>
          <div id='companionTitle' className='landingContentSectionTitle'>
            <h2>COMPANION APPLICATIONS</h2>
            <p className='subtitle'>Additional ways to access and explore our collection.</p>
          </div>
          <div className='landingContentItems'>
            <a href="https://lux.collections.yale.edu/view/group/6e15bc74-fc7c-425f-9ae0-0123c1adf405" target='_blank' rel="noopener noreferrer">
              <div className='appUnit'>
                <img src={returnDomain() + "lux.jpg"} alt="LUX" className='appImage' />
                <h3 className='appTitle'>LUX: Yale Collections Discovery</h3>
                <p className='appBlurb'>Explore our collection embedded in the larger network of all of Yale's collections.</p>
              </div>
            </a>
            <a href="https://backprinting.com/" target='_blank' rel="noopener noreferrer">
              <div className='appUnit'>
                <img src={returnDomain() + "backprint.jpg"} alt="Backprinting" className='appImage' />
                <h3 className='appTitle'>Backprinting</h3>
                <p className='appBlurb'>Explore the lab's extensive collection of imaged and cataloged backprints.</p>
              </div>
            </a>
            <a href="http://ipch.app.s3-website-us-east-1.amazonaws.com/yente/index.html" target='_blank' rel="noopener noreferrer">
              <div className='appUnit'>
                <img src={returnDomain() + "yente.jpg"} alt="Yente" className='appImage' />
                <h3 className='appTitle'>Yente: The Texture Matchmaker</h3>
                <p className='appBlurb'>Search through our collection's surface textures, and find nearest matches.</p>
              </div>
            </a>
            <a href="http://ipch.app.s3-website-us-east-1.amazonaws.com/arnot/index.html" target='_blank' rel="noopener noreferrer">
              <div className='appUnit'>
                <img src={returnDomain() + "arnot.jpg"} alt="Arnot" className='appImage' />
                <h3 className='appTitle'>Arnot: Drill Down</h3>
                <p className='appBlurb'>Search our raw collection data by catalog number.</p>
              </div>
            </a>
          </div>
        </div>
        <div id='s8' className='landingContentSection teamSection'>
          <div className='landingContentSectionTitle'>
            <h2>OUR TEAM</h2>
            <p className='subtitle'>Every lab member, present or former, who helped make Paperbase happen.</p>
          </div>
          <div className='landingContentItems'>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'crockett2.jpg'} alt="Damon Crockett" />
              </div>
              <div className='member-name'>DAMON CROCKETT</div>
              <div className='project-role'>data science, app and site design</div>
              <div className='job-title'>Lead AI Engineer, Lens Media Lab, Yale University</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'messier.jpg'} alt="Paul Messier" />
              </div>
              <div className='member-name'>PAUL MESSIER</div>
              <div className='project-role'>collection, concept, data model</div>
              <div className='job-title'>Director, Lens Media Lab, Yale University</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'mintie.jpg'} alt="Katherine Mintie" />
              </div>
              <div className='member-name'>KATHERINE MINTIE</div>
              <div className='project-role'>measurement, writing, testing</div>
              <div className='job-title'>Head of Collections, Center for Creative Photography, University of Arizona</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'disciacca2.jpg'} alt="Jack DiSciacca" />
              </div>
              <div className='member-name'>JACK DISCIACCA</div>
              <div className='project-role'>measurement, signal processing</div>
              <div className='job-title'>Scientist, Coherent</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'nikolaus.jpg'} alt="Sydney Nikolaus" />
              </div>
              <div className='member-name'>SYDNEY NIKOLAUS</div>
              <div className='project-role'>photography, measurement, cataloging</div>
              <div className='job-title'>Research Associate, Lens Media Lab, Yale University; Paintings Conservator in Private Practice</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'alam.jpg'} alt="Joitree Alam" />
              </div>
              <div className='member-name'>JOITREE ALAM</div>
              <div className='project-role'>dating, measurement</div>
              <div className='job-title'>Ph.D. Student, Art History, Northwestern University</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'yue.jpg'} alt="Cynthia Yue" />
              </div>
              <div className='member-name'>CYNTHIA YUE</div>
              <div className='project-role'>measurement</div>
              <div className='job-title'>Data Analyst, Lens Media Lab, Yale University</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'hark.jpg'} alt="Memory Hark" />
              </div>
              <div className='member-name'>MEMORY HARK</div>
              <div className='project-role'>photography, cataloging</div>
              <div className='job-title'>Former Research Associate, Lens Media Lab, Yale University</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'evans.jpg'} alt="Khari Evans" />
              </div>
              <div className='member-name'>KHARI EVANS</div>
              <div className='project-role'>measurement</div>
              <div className='job-title'>Former Research Associate, Lens Media Lab, Yale University</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'canales.jpg'} alt="Austin Canales" />
              </div>
              <div className='member-name'>AUSTIN CANALES</div>
              <div className='project-role'>measurement</div>
              <div className='job-title'>Special Education Teacher, NYC Department of Education</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'lackey.jpg'} alt="Leah Lackey" />
              </div>
              <div className='member-name'>LEAH LACKEY</div>
              <div className='project-role'>measurement</div>
              <div className='job-title'>Ph.D. Student, Robotics, Cornell University</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'evansm.jpg'} alt="Madison Evans" />
              </div>
              <div className='member-name'>MADISON EVANS</div>
              <div className='project-role'>measurement</div>
              <div className='job-title'>Library Associate, Solano County Library</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'antoine.jpg'} alt="Genevieve Antoine" />
              </div>
              <div className='member-name'>GENEVIEVE ANTOINE</div>
              <div className='project-role'>measurement</div>
              <div className='job-title'>Data and Program Coordinator, The Alliance of HBCU Museums and Galleries</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'schlick.jpg'} alt="Sarah Schlick" />
              </div>
              <div className='member-name'>SARAH SCHLICK</div>
              <div className='project-role'>cataloging</div>
              <div className='job-title'>Assistant Editor, Gallery Books, Simon & Schuster</div>
            </div>
          </div>
          <div className='citationSection'>
            <h3>How to Cite</h3>
            <p>For scholarly work referencing this resource, please use the following citation:</p>
            <div className='citationContainer'>
              <div className='citationText'>
                Crockett, D., P. Messier, and K. Mintie. (2024). Paperbase. Lens Media Lab, Yale University. https://paperbase.xyz
              </div>
              <button className='copyButton' onClick={handleCopyClick}>
                <span className="material-icons">{copySuccess ? 'done' : 'content_copy'}</span>
              </button>
            </div>
          </div>
        </div>
        <div id='s9' className='landingContentSection footerSection'>
          <div className='footerContent'>
            <div className='footerSubsection'>
              <h3>Contact</h3>
              <p className='contactInfo'>info@paperbase.xyz</p>
            </div>
            <div className='footerSubsection'>
              <h3>Follow Us</h3>
              <div className='socialIcons'>
                <a href="https://x.com/LensMediaLab" target="_blank" rel="noopener noreferrer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                  </svg>
                </a>
                <a href="https://www.instagram.com/lensmedialab/" target="_blank" rel="noopener noreferrer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a href="https://www.youtube.com/@LensMediaLab" target="_blank" rel="noopener noreferrer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div className='footerSubsection supportSection'>
              <h3>Support</h3>
              <div className='supportLogos'>
                <div id='jp' className='logoContainer'>
                  <a href="https://www.jpfamilyfund.org/" target="_blank" rel="noopener noreferrer">
                    <img src={returnDomain() + "jpff_white.png"} alt="John Pritzker Family Fund" />
                  </a>
                </div>
                <div className='logoContainer'>
                  <a id='ami' href="https://ami.withgoogle.com/" target="_blank" rel="noopener noreferrer">
                    <svg width="90" height="60" viewBox="0 0 90 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_463_500)">
                        <path d="M75.2507 30H67.6855V60H75.2507V30z" fill="currentColor"/>
                        <path d="M31.9639 30V60h7.9158V47.88l6.1323 12h5.04l5.8618-12V60h7.9158V30H56.9138L48.6472 48.05 39.8797 30H31.9639z" fill="currentColor"/>
                        <path d="M20.0401.0 31.9639 30H23.6774L15.9619 10.25 8.66734 30H0L12.4249.0h7.6152zM67.6854 18.1v7.6H90V18.1H67.6854z" fill="currentColor"/>
                      </g>
                      <defs>
                        <clipPath id="clip0_463_500">
                          <rect width="90" height="60" fill="#fff"/>
                        </clipPath>
                      </defs>
                    </svg>
                    <span className='logoText' style={{ fontFamily: 'GoogleSans, sans-serif' }}>Artists + Machine Intelligence</span>
                  </a>
                </div>
                <div className='logoContainer'>
                  <a id='yale' href="https://www.yale.edu/" target="_blank" rel="noopener noreferrer">
                    <span className='yaleLogoText' style={{ fontFamily: 'YaleNew, serif' }}>Yale</span>
                  </a>
                </div>
              </div>
            </div>
            <div id='footer-blurb' className='footerSubsection'>
              <p>This project is made possible through the generous support of our partners and sponsors. Their contributions enable us to continue our research, maintain our extensive collection, and provide this platform as a resource for scholars and enthusiasts worldwide.</p>
            </div>
          </div>
        </div>
        <div className='mobileLogosSection'>
          <div className='mobileLogosRow jpRow'>
            <div id='jp' className='logoContainer'>
              <a href="https://www.jpfamilyfund.org/" target="_blank" rel="noopener noreferrer">
                <img src={returnDomain() + "jpff_white.png"} alt="John Pritzker Family Fund" />
              </a>
            </div>
          </div>
          <div className='mobileLogosRow otherLogosRow'>
            <div className='logoContainer'>
                <a id='ami' href="https://ami.withgoogle.com/" target="_blank" rel="noopener noreferrer">
                  <svg width="90" height="60" viewBox="0 0 90 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_463_500)">
                      <path d="M75.2507 30H67.6855V60H75.2507V30z" fill="currentColor"/>
                      <path d="M31.9639 30V60h7.9158V47.88l6.1323 12h5.04l5.8618-12V60h7.9158V30H56.9138L48.6472 48.05 39.8797 30H31.9639z" fill="currentColor"/>
                      <path d="M20.0401.0 31.9639 30H23.6774L15.9619 10.25 8.66734 30H0L12.4249.0h7.6152zM67.6854 18.1v7.6H90V18.1H67.6854z" fill="currentColor"/>
                    </g>
                    <defs>
                      <clipPath id="clip0_463_500">
                        <rect width="90" height="60" fill="#fff"/>
                      </clipPath>
                    </defs>
                  </svg>
                  <span className='logoText' style={{ fontFamily: 'GoogleSans, sans-serif' }}>Artists + Machine Intelligence</span>
                </a>
              </div>
              <div className='logoContainer'>
                <a id='yale' href="https://www.yale.edu/" target="_blank" rel="noopener noreferrer">
                  <span className='yaleLogoText' style={{ fontFamily: 'YaleNew, serif' }}>Yale</span>
                </a>
              </div>
          </div>
        </div>
        <div className='footerBottom'>
            <p>&copy; {new Date().getFullYear()} Lens Media Lab. All rights reserved.</p>
            <p><a id='termslink' href={returnDomain() + "terms.html"} target='_blank'>Terms of Use</a></p>
        </div>
      </div>  
    </div>
  )
}