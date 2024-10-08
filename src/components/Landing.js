import React from 'react';
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

export default function Landing({ setPage }) {

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
        <div className='landingContentSection appTutorialsSection'>
          <div className='landingContentSectionTitle'>
            <h2>App Tutorials</h2>
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
          </div>
        </div>
        <div className='landingContentSection dataVizSection'>
          <div className='landingContentSectionTitle'>
            <h2>Data Insights</h2>
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
        <div className='landingContentSection researchSection'>
          <div className='landingContentSectionTitle'>
            <h2>Theory and Research</h2>
            <p className='subtitle'>Published papers about our collection and methods.</p>
          </div>
          <div className='landingContentItems'>
            <div className='researchPaperUnit'>
              <h3>The Selfie: Making sense of the "Masturbation of Self-Image" and the "Virtual Mini-Me"</h3>
              <p className='author'>Alise Tifentale, The Graduate Center, CUNY</p>
              <p className='abstract'>This essay reviews some of the most recent debates on the selfie phenomenon and places it into a broader context of photographic self-portraiture, investigating how the Instagrammed selfie differs from its precursors. The Selfie phenomenon should be viewed in the light of history of photography as a sub-genre of self-portraiture and as a new subject of vernacular photography studies as well as treated as a side product of technological developments that have led to the easy availability of image-making devices and image-sharing platforms.</p>
              <a href="#" className='readLink'>Read the essay</a>
            </div>
            <div className='researchPaperUnit'>
              <h3>Another Research Paper Title</h3>
              <p className='author'>John Doe, University of Example</p>
              <p className='abstract'>This is a placeholder abstract for another research paper. It would contain a brief summary of the paper's contents, methodology, and findings. The abstract provides readers with a quick overview of the paper's subject matter and importance.</p>
              <a href="#" className='readLink'>Read the paper</a>
            </div>
            <div className='researchPaperUnit'>
              <h3>Another Research Paper Title</h3>
              <p className='author'>John Doe, University of Example</p>
              <p className='abstract'>This is a placeholder abstract for another research paper. It would contain a brief summary of the paper's contents, methodology, and findings. The abstract provides readers with a quick overview of the paper's subject matter and importance.</p>
              <a href="#" className='readLink'>Read the paper</a>
            </div>
            <div className='researchPaperUnit'>
              <h3>Another Research Paper Title</h3>
              <p className='author'>John Doe, University of Example</p>
              <p className='abstract'>This is a placeholder abstract for another research paper. It would contain a brief summary of the paper's contents, methodology, and findings. The abstract provides readers with a quick overview of the paper's subject matter and importance.</p>
              <a href="#" className='readLink'>Read the paper</a>
            </div>
            <div className='researchPaperUnit'>
              <h3>Another Research Paper Title</h3>
              <p className='author'>John Doe, University of Example</p>
              <p className='abstract'>This is a placeholder abstract for another research paper. It would contain a brief summary of the paper's contents, methodology, and findings. The abstract provides readers with a quick overview of the paper's subject matter and importance.</p>
              <a href="#" className='readLink'>Read the paper</a>
            </div>
          </div>
        </div>
        <div className='landingContentSection presentationsAndPressSection'>
          <div className='presentationsAndPressContent'>
            <div className='presentationsColumn'>
              <h2 className='sectionTitle'>Presentations</h2>
              <div className='presentationItem'>
                <div className='videoContainer'>
                  <iframe 
                    width="560" 
                    height="315" 
                    src="https://www.youtube.com/embed/VIDEO_ID_1" 
                    title="Presentation 1" 
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
                    src="https://www.youtube.com/embed/VIDEO_ID_2" 
                    title="Presentation 2" 
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
                    src="https://www.youtube.com/embed/VIDEO_ID_2" 
                    title="Presentation 2" 
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
                    src="https://www.youtube.com/embed/VIDEO_ID_2" 
                    title="Presentation 2" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen>
                  </iframe>
                </div>
              </div>
            </div>
            <div className='pressColumn'>
              <h2 className='sectionTitle'>Press</h2>
              <div className='pressItem'>
                <div className='pressSource'>cnn.com</div>
                <div className='pressTitle'>Who takes more selfies: Women or men?</div>
              </div>
              <div className='pressItem'>
                <div className='pressSource'>Washington Post</div>
                <div className='pressTitle'>The surprising sociology of selfies</div>
              </div>
              <div className='pressItem'>
                <div className='pressSource'>Gigaom</div>
                <div className='pressTitle'>Everything you ever wanted to know about the selfie, visualized</div>
              </div>
              <div className='pressItem'>
                <div className='pressSource'>National Geographic</div>
                <div className='pressTitle'>The Science of Selfies: A Five-City Comparison</div>
              </div>
              <div className='pressItem'>
                <div className='pressSource'>ZEIT Online</div>
                <div className='pressTitle'>Die glücklichsten Brillenträger leben in São Paulo</div>
              </div>
              <div className='pressItem'>
                <div className='pressSource'>LA Times</div>
                <div className='pressTitle'>The science of selfies is serious business -- and seriously revealing</div>
              </div>
            </div>
          </div>
        </div>
        <div className='landingContentSection teamSection'>
          <div className='landingContentSectionTitle'>
            <h2>Our Team</h2>
            <p className='subtitle'>The dedicated individuals behind our research and platform.</p>
          </div>
          <div className='landingContentItems'>
            <div className='teamMember'>
              <div className='headshot-container'>
                <img src={returnDomain() + 'crockett.jpg'} alt="Damon Crockett" />
              </div>
              <div className='member-name'>DAMON CROCKETT</div>
              <div className='project-role'>data science, site development</div>
              <div className='job-title'>AI Engineer, Lens Media Lab, Yale University</div>
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
              <div className='project-role'>measurement, writing, user research</div>
              <div className='job-title'>Head of Collections, Center for Creative Photography, University of Arizona</div>
            </div>
          </div>
        </div>
        <div className='landingContentSection footerSection'>
          <div className='footerContent'>
            <div className='footerSubsection'>
              <h3>Contact</h3>
              <p className='contactInfo'>email@example.com</p>
            </div>
            <div className='footerSubsection'>
              <h3>Follow Us</h3>
              <div className='socialIcons'>
                <a href="https://twitter.com/youraccount" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-x-twitter"></i>
                </a>
                <a href="https://instagram.com/youraccount" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://yourlab.website.com" target="_blank" rel="noopener noreferrer">
                  <i className="fas fa-globe"></i>
                </a>
              </div>
            </div>
            <div className='footerSubsection'>
              <h3>Support</h3>
              <div className='supportLogos'>
                <img src="/path/to/supporter1-logo.png" alt="Supporter 1" />
                <img src="/path/to/supporter2-logo.png" alt="Supporter 2" />
                <img src="/path/to/supporter3-logo.png" alt="Supporter 3" />
              </div>
            </div>
            <div className='footerSubsection'>
              <p>This project is made possible through the generous support of our partners and sponsors. Their contributions enable us to continue our research, maintain our extensive collection, and provide this platform as a resource for scholars and enthusiasts worldwide.</p>
            </div>
            <div className='footerBottom'>
              <p>&copy; {new Date().getFullYear()} Your Organization Name. All rights reserved. | <a href="/terms-of-use">Terms of Use</a></p>
            </div>
          </div>
        </div>
      </div>  
    </div>
  )
}