import React, { useEffect } from 'react';
import { returnDomain } from '../utils/img';
import { landingText } from '../utils/landing';

const landingStyle = {
  minHeight: '100vh',
  width: '100vw',
  backgroundImage: `url(${returnDomain()}hero2.jpg)`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  backgroundAttachment: 'fixed',
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

  useEffect(() => {
    injectFontFaces();
  }, []);

  return (
    <div id='landing' style={landingStyle}>
      <div id='landingBlurb'>
        <p id='blurbTitle'>Paperbase.</p>
        <p id='blurbText'>Paperbase is an interactive visual platform for exploring and analyzing the world's largest collection of photographic paper. Designed and built by the <a href='https://lml.yale.edu/' target='_blank'>Lens Media Lab</a> at Yale University.</p>
        <button onClick={() => setPage('app')}>Explore the collection</button>
      </div>
      <div className='landingContent'>
        <div id='s1' className='landingContentSection'>
          <div className='landingContentSectionTitle'>
            <h2>{landingText.s1.title}</h2>
            <p className='subtitle'>{landingText.s1.subtitle}</p>
          </div>
          <div className='landingContentItems'>
            {landingText.s1.text.map((text, i) => (
              <div className='landingContentItem' key={i}>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div id='s2' className='landingContentSection'>
          <div className='landingContentSectionTitle'>
            <h2>{landingText.s2.title}</h2>
            <p className='subtitle'>{landingText.s2.subtitle}</p>
          </div>
          <div className='landingContentItems'>
            {landingText.s2.text.map((text, i) => (
              <div className='landingContentItem' key={i}>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className='landingContentSection dataVizSection'>
          <div className='landingContentSectionTitle'>
            <h2>DATA INSIGHTS</h2>
            <p className='subtitle'>Visual representations of our collection's key characteristics.</p>
          </div>
          <div className='landingContentItems'>
            <div className='dataVizUnit'>
              <h3>Distribution of Paper Types</h3>
              <div className='svgContainer'>
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  {/* This is a placeholder SVG. Replace with your actual data visualization */}
                  <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="4" fill="blue" />
                </svg>
              </div>
              <p>This visualization shows the distribution of different paper types in our collection. Matte papers make up the largest portion, followed by glossy and semi-glossy papers. This distribution reflects the changing preferences in photographic printing over the past century.</p>
            </div>
            <div className='dataVizUnit'>
              <h3>Temporal Trends in Paper Production</h3>
              <div className='svgContainer'>
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  {/* This is a placeholder SVG. Replace with your actual data visualization */}
                  <rect x="10" y="10" width="80" height="80" stroke="white" strokeWidth="4" fill="green" />
                </svg>
              </div>
              <p>This timeline illustrates the evolution of paper production techniques from the late 19th century to the present day. Notable shifts include the transition from albumen to gelatin silver papers in the early 20th century, and the rise of RC (resin-coated) papers in the 1960s.</p>
            </div>      
          </div>
        </div>
        <div className='landingContentSection appTutorialsSection'>
          <div className='landingContentSectionTitle'>
            <h2>APP TUTORIALS</h2>
            <p className='subtitle'>Learn how to use our platform with these helpful video guides.</p>
          </div>
          <div className='landingContentItems'>
            <div className='tutorialItem'>
              <div className='videoContainer'>
                <iframe 
                  width="560" 
                  height="315" 
                  src="https://www.youtube.com/embed/VIDEO_ID_1" 
                  title="Tutorial 1" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen>
                </iframe>
              </div>
              <p className='tutorialDescription'>Learn the basics of navigating our platform and accessing key features.</p>
            </div>
            <div className='tutorialItem'>
              <div className='videoContainer'>
                <iframe 
                  width="560" 
                  height="315" 
                  src="https://www.youtube.com/embed/VIDEO_ID_2" 
                  title="Tutorial 2" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen>
                </iframe>
              </div>
              <p className='tutorialDescription'>Discover advanced search techniques to find specific items in our collection.</p>
            </div>
            <div className='tutorialItem'>
              <div className='videoContainer'>
                <iframe 
                  width="560" 
                  height="315" 
                  src="https://www.youtube.com/embed/VIDEO_ID_2" 
                  title="Tutorial 2" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen>
                </iframe>
              </div>
              <p className='tutorialDescription'>Discover advanced search techniques to find specific items in our collection.</p>
            </div>
            <div className='tutorialItem'>
              <div className='videoContainer'>
                <iframe 
                  width="560" 
                  height="315" 
                  src="https://www.youtube.com/embed/VIDEO_ID_2" 
                  title="Tutorial 2" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen>
                </iframe>
              </div>
              <p className='tutorialDescription'>Discover advanced search techniques to find specific items in our collection.</p>
            </div>
            <div className='tutorialItem'>
              <div className='videoContainer'>
                <iframe 
                  width="560" 
                  height="315" 
                  src="https://www.youtube.com/embed/VIDEO_ID_2" 
                  title="Tutorial 2" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen>
                </iframe>
              </div>
              <p className='tutorialDescription'>Discover advanced search techniques to find specific items in our collection.</p>
            </div>
          </div>
        </div>
        <div className='landingContentSection researchSection'>
          <div className='landingContentSectionTitle'>
            <h2>THEORY & RESEARCH</h2>
            <p className='subtitle'>Published papers about our collection and methods.</p>
          </div>
          <div className='landingContentItems'>
            <div className='researchPaperUnit'>
              <h3>Closer Looking: Computer Vision in Material Studies of Art</h3>
              <p className='author'>Katherine Mintie, Paul Messier, and Damon Crockett</p>
              <p className='journal'>Art Bulletin 106 (2), 29-32, 2024.</p>
              <p className='abstract'>Knowledge of the materiality of artworks is essential to understanding how they are made, their visual qualities, and their significance. To date, art historians and conservators have assessed key physical characteristics of works primarily by eye; however, this practice becomes challenging in projects such as catalogue raisonnés or studies of artist circles that require scholars to scale up their observations and compare numerous works across collections. This paper proposes that computational methods coupled with domain-specific expertise offer a powerful tool for recognizing material differences and similarities across large corpora. Computational methods can be broadly defined as research in which various data are collected, modelled, and analyzed by computers to support scholarly inquiry. While the application of “immaterial” data to the study of the material properties of artworks may strike some as counterintuitive, this article will suggest that computational methods can complement and deepen traditional art historical methods, such as close looking, in specific contexts. In arguing for the applicability of computational methods to materials-based art historical research, this paper will address key questions such as how to determine when this approach is appropriate, the central role of subject matter expertise in data selection and visualization, and the potential of these methods to inform scholarship going forward.</p>
              <a href="https://www.tandfonline.com/doi/full/10.1080/00043079.2024.2296276" target='_blank' className='readLink'>Read the essay</a>
            </div>
            <div className='researchPaperUnit'>
              <h3>An Objective Revaluation of Photograms by László Moholy-Nagy</h3>
              <p className='author'>Sylvie Pénichon, Krista Lough, and Paul Messier</p>
              <p className='journal'>Leonardo 53 (3), 292-295, 2017.</p>
              <p className='abstract'>Throughout his career, László Moholy-Nagy (1895–1946) produced many photograms, a selection of which was examined in European and American collections. Sheet dimensions and thickness, base color, surface gloss and texture were recorded. The analysis of the data and the results of this investigation are presented in this article. The article also explores the effectiveness of paper characterization and how it can contribute to and enhance historical research when applied to a particular body of work by one artist.</p>
              <a href="https://www.researchgate.net/profile/Sylvie-Penichon/publication/315987819_An_Objective_Revaluation_of_Photograms_by_Laszlo_Moholy-Nagy/links/5a7dca77aca272341af0d16d/An-Objective-Revaluation-of-Photograms-by-Laszlo-Moholy-Nagy.pdf" target='_blank' className='readLink'>Read the paper</a>
            </div>
            <div className='researchPaperUnit'>
              <h3>Reading the Paper: Expressive Dimensions of Photographic Prints</h3>
              <p className='author'>Paul Messier and Jennifer McGlinchey Sexton</p>
              <p className='journal'>in <i>Photography Inc.: Your Image Is Our Business</i>, Lannoo, 2015.</p>
              <p className='abstract'>Paper, everywhere and ordinary, is typically ‘the poor relation’ to applied media. Markings are different whether in charcoal, ink, graphite, or silver. Media on paper conveys meaning: words or pictures, literature or art. The same is certainly true in photography where the image is the message; the image is everything. Or is it?</p>
              <a href="https://www.researchgate.net/publication/301891399_Reading_the_Paper" target='_blank' className='readLink'>Read the paper</a>
            </div>
            <div className='researchPaperUnit'>
              <h3>Correlation between gloss reflectance and surface texture in photographic paper</h3>
              <p className='author'>Kevin Vessot, Paul Messier, Joyce M Hyde, Christopher A Brown</p>
              <p className='journal'>Scanning 37 (3), 204-217, 2015.</p>
              <p className='abstract'>Surface textures of a large collection of photographic papers dating from 1896 to the present were measured using a laser scanning confocal microscope (LSCM) with four different objective lenses. Roughness characterization parameters were calculated from the texture measurements and were compared with gloss measurements.</p>
              <a href="https://www.researchgate.net/profile/Paul-Messier-2/publication/258436850_Correlation_between_gloss_reflectance_and_surface_texture_in_photographic_paper/links/5f2abb08299bf13404a3e08b/Correlation-between-gloss-reflectance-and-surface-texture-in-photographic-paper.pdf" target='_blank' className='readLink'>Read the paper</a>
            </div>
            <div className='researchPaperUnit'>
              <h3>Photographic Paper XYZ: De Facto Standard Sizes for Silver Gelatin Paper</h3>
              <p className='author'>Jennifer McGlinchey Sexton, Paul Messier</p>
              <p className='journal'>Journal of the American Institute for Conservation 53 (4), 219-235, 2014.</p>
              <p className='abstract'>Historical references of silver gelatin photographic paper sheet size and thickness were collected to determine standardized dimensions in use during the 20th century. A total of 32 sizes and three thicknesses were determined to be de facto standards.</p>
              <a href="https://www.researchgate.net/profile/Paul-Messier-2/publication/286692113_Photographic_paper_XYZ_De_facto_standard_sizes_for_silver_gelatin_paper/links/5f29c0b992851cd302dbfa3b/Photographic-paper-XYZ-De-facto-standard-sizes-for-silver-gelatin-paper.pdf" target='_blank' className='readLink'>Read the paper</a>
            </div>
            <div className='researchPaperUnit'>
              <h3>Pursuing automated classification of historic photographic papers from raking light images</h3>
              <p className='author'>C Richard Johnson, Paul Messier, William A Sethares, Andrew G Klein, Christopher Brown, Anh Hoang Do, Philip Klausmeyer, Patrice Abry, Stephane Jaffard, Herwig Wendt, Stephane Roux, Nelly Pustelnik, Nanne Van Noord, Laurens Van Der Maaten, Eric Postma, James Coddington, Lee Ann Daffner, Hanako Murata, Henry Wilhelm, Sally Wood, Mark Messier</p>
              <p className='journal'>Journal of the American Institute for Conservation 53 (3), 159-170, 2014.</p>
              <p className='abstract'>Surface texture is a critical feature in the manufacture, marketing, and use of photographic paper. Raking light reveals texture through a stark rendering of highlights and shadows. Though close-up raking light images effectively document surface features of photographic paper, the sheer number and diversity of textures used for historic papers prohibits efficient visual classification. This work provides evidence that automatic, computer-based classification of texture documented with raking light is feasible by demonstrating an encouraging degree of success sorting a set of 120 images made from samples of historic silver gelatin paper. Using this dataset, four university teams applied different image-processing strategies for automatic feature extraction and degree of similarity quantification. All four approaches successfully detected strong affinities and outliers built into the dataset. The creation and deployment of the algorithms was carried out by the teams without prior knowledge of the distributions of similarities and outliers. These results indicate that automatic classification of silver gelatin photographic paper based on close-up texture images is feasible and should be pursued.</p>
              <a href="https://hal.science/hal-03464914/document" target='_blank' className='readLink'>Read the paper</a>
            </div>
            <div className='researchPaperUnit'>
              <h3>Image Isn’t Everything: Revealing Affinities across Collections through the Language of the Photographic Print</h3>
              <p className='author'>Paul Messier</p>
              <p className='journal'>in <i>Object:Photo. Modern Photographs: The Thomas Walther Collection 1909-1949</i>, Museum of Modern Art, 332-339, 2014.</p>
              <p className='abstract'>A photograph is more than an image. Paper, the physical material of the photographer, plays a vital role in the appearance of a photographic print and in conveying the photographer’s intention for it. Texture, gloss, highlight color, and sheet thickness — the defining characteristics of photographic paper — each contribute significantly to the visual impact of a print. Paper manufacturers have long manipulated these key characteristics, singly and in combination, to differentiate their products and to satisfy a broad spectrum of market demands.</p>
              <a href="https://scholar.google.com/scholar?oi=bibs&cluster=12319685399683587963&btnI=1&hl=en" target='_blank' className='readLink'>Read the paper</a>
            </div>
          </div>
        </div>
        <div className='landingContentSection presentationsAndPressSection'>
          <div className='presentationsAndPressContent'>
            <div className='presentationsColumn'>
              <h2 className='sectionTitle'>PRESENTATIONS</h2>
              <div className='presentationItem'>
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
              </div>
              <div className='presentationItem'>
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
              </div>
              <div className='presentationItem'>
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
              </div>
              <div className='presentationItem'>
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
              </div>
            </div>
            <div className='pressColumn'>
              <h2 className='sectionTitle'>PRESS</h2>
              <div className='pressItem'>
                <div className='pressSource'>Yale News</div>
                <div className='pressTitle'>Analyzing the photographic process from darkroom to data</div>
                <p className='pressExcerpt'>"At a recent symposium, Yale’s Lens Media Lab unveiled a visual platform for studying its unrivaled collection of photographic papers."</p>
              </div>
              <div className='pressItem'>
                <div className='pressSource'>The Classic Magazine</div>
                <div className='pressTitle'>Paperbase: A New Lens on Photographic History</div>
                <p className='pressExcerpt'>"This groundbreaking project is changing how we understand the material history of photography."</p>
              </div>
              <div className='pressItem'>
                <div className='pressSource'>Scientific American</div>
                <div className='pressTitle'>The Science Behind Paperbase</div>
                <p className='pressExcerpt'>"By combining cutting-edge technology with meticulous historical research, Paperbase is uncovering new facets of photographic history."</p>
              </div>
              <div className='pressItem'>
                <div className='pressSource'>Art in America</div>
                <div className='pressTitle'>Paperbase: A New Lens on Photographic History</div>
                <p className='pressExcerpt'>"This groundbreaking project is changing how we understand the material history of photography."</p>
              </div>
              <div className='pressItem'>
                <div className='pressSource'>The New York Times</div>
                <div className='pressTitle'>The Impresario of Photo Paper</div>
                <p className='pressExcerpt'>"Paul Messier, director of the Lens Media Lab, is leading the charge to digitize and analyze the world's largest collection of photographic paper."</p>
              </div>
              <div className='pressItem'>
                <div className='pressSource'>Wired</div>
                <div className='pressTitle'>Paperbase: A New Frontier in Photographic Research</div>
                <p className='pressExcerpt'>"This innovative platform is revolutionizing the way we study the history of photography."</p>
              </div>
              <div className='pressItem'>
                <div className='pressSource'>The Atlantic</div>
                <div className='pressTitle'>The Hidden Stories of Photographic Paper</div>
                <p className='pressExcerpt'>"Paperbase is uncovering the secrets of photographic paper, revealing new insights into the history of photography."</p>
              </div>
              <div className='pressItem'>
                <div className='pressSource'>Gigaom</div>
                <div className='pressTitle'>The Mad Scientists Revolutionizing Photographic Research</div>
                <p className='pressExcerpt'>"The team at the Lens Media Lab is pushing the boundaries of what's possible in the field of photographic history."</p>
              </div>
            </div>
          </div>
        </div>
        <div className='landingContentSection companionAppsSection'>
          <div className='landingContentSectionTitle'>
            <h2>COMPANION APPLICATIONS</h2>
            <p className='subtitle'>Explore these additional tools that complement our main platform.</p>
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
        <div className='landingContentSection teamSection'>
          <div className='landingContentSectionTitle'>
            <h2>OUR TEAM</h2>
            <p className='subtitle'>The dedicated individuals behind our research and platform.</p>
          </div>
          <div className='landingContentItems'>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'crockett2.jpg'} alt="Damon Crockett" />
              </div>
              <div className='member-name'>Damon Crockett</div>
              <div className='project-role'>data science, site design and development</div>
              <div className='job-title'>AI Engineer, Lens Media Lab, Yale University</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'messier.jpg'} alt="Paul Messier" />
              </div>
              <div className='member-name'>Paul Messier</div>
              <div className='project-role'>collection, concept, data model</div>
              <div className='job-title'>Director, Lens Media Lab, Yale University</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'mintie.jpg'} alt="Katherine Mintie" />
              </div>
              <div className='member-name'>Katherine Mintie</div>
              <div className='project-role'>measurement, writing, user research</div>
              <div className='job-title'>Head of Collections, Center for Creative Photography, University of Arizona</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'disciacca2.jpg'} alt="Jack DiSciacca" />
              </div>
              <div className='member-name'>Jack DiSciacca</div>
              <div className='project-role'>measurement, signal processing</div>
              <div className='job-title'>Scientist, Coherent</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'nikolaus.jpg'} alt="Sydney Nikolaus" />
              </div>
              <div className='member-name'>Sydney Nikolaus</div>
              <div className='project-role'>photography, measurement, cataloging</div>
              <div className='job-title'>Research Associate, Lens Media Lab, Yale University</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'yue.jpg'} alt="Cynthia Yue" />
              </div>
              <div className='member-name'>Cynthia Yue</div>
              <div className='project-role'>measurement</div>
              <div className='job-title'>Data Analyst, Lens Media Lab, Yale University</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'alam.jpg'} alt="Joitree Alam" />
              </div>
              <div className='member-name'>Joitree Alam</div>
              <div className='project-role'>measurement</div>
              <div className='job-title'>Ph.D. Student, Art History, Northwestern University</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'hark.jpg'} alt="Memory Hark" />
              </div>
              <div className='member-name'>Memory Hark</div>
              <div className='project-role'>photography, cataloging</div>
              <div className='job-title'>Former Research Associate, Lens Media Lab, Yale University</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'canales.jpg'} alt="Austin Canales" />
              </div>
              <div className='member-name'>Austin Canales</div>
              <div className='project-role'>measurement</div>
              <div className='job-title'>Special Education Teacher, NYC Department of Education</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'lackey.jpg'} alt="Leah Lackey" />
              </div>
              <div className='member-name'>Leah Lackey</div>
              <div className='project-role'>measurement</div>
              <div className='job-title'>Ph.D. Student, Robotics, Cornell University</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'evans.jpg'} alt="Khari Evans" />
              </div>
              <div className='member-name'>Khari Evans</div>
              <div className='project-role'>measurement</div>
              <div className='job-title'>Former Research Associate, Lens Media Lab, Yale University</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'evansm.jpg'} alt="Madison Evans" />
              </div>
              <div className='member-name'>Madison Evans</div>
              <div className='project-role'>measurement</div>
              <div className='job-title'>Library Associate, Solano County Library</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'antoine.jpg'} alt="Genevieve Antoine" />
              </div>
              <div className='member-name'>Genevieve Antoine</div>
              <div className='project-role'>measurement</div>
              <div className='job-title'>Data and Program Coordinator, The Alliance of HBCU Museums and Galleries</div>
            </div>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'schlick.jpg'} alt="Sarah Schlick" />
              </div>
              <div className='member-name'>Sarah Schlick</div>
              <div className='project-role'>cataloging</div>
              <div className='job-title'>Assistant Editor, Gallery Books, Simon & Schuster</div>
            </div>
          </div>
        </div>
        <div className='landingContentSection footerSection'>
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
            <div className='footerSubsection'>
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
                      <g clip-path="url(#clip0_463_500)">
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
            <div className='footerSubsection'>
              <p>This project is made possible through the generous support of our partners and sponsors. Their contributions enable us to continue our research, maintain our extensive collection, and provide this platform as a resource for scholars and enthusiasts worldwide.</p>
            </div>
            <div className='footerBottom'>
              <p>&copy; {new Date().getFullYear()} Lens Media Lab. All rights reserved.</p>
              <p><a id='termslink' href={returnDomain() + "terms.html"} target='_blank'>Terms of Use</a></p>
            </div>
          </div>
        </div>
      </div>  
    </div>
  )
}