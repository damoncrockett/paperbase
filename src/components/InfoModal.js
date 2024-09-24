import React, { useState, useEffect, useRef } from 'react';

export default function InfoModal({ 
    show, 
    onClose,
    setActiveSection
}) {
  if (!show) {
    return null;
  }

  const scrollRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
        const { top: containerTop, height: containerHeight } = scrollRef.current.getBoundingClientRect();
        const threshold = containerTop + containerHeight * 0.20;
        const children = scrollRef.current.firstChild.children;
      
        for (let i = 0; i < children.length; i++) {
          const { top: childTop } = children[i].getBoundingClientRect();
      
          if (childTop <= threshold && childTop >= containerTop) {
            setActiveSection(children[i].id);
            break;
          }
        }
      };
      
    const scrollableDiv = scrollRef.current;
    scrollableDiv.addEventListener('scroll', handleScroll);

    // Clean up the event listener
    return () => {
      scrollableDiv.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
    <button id="infomodal-close" onClick={onClose}>&times;</button>
    <div ref={scrollRef} id="infomodal-background">
        <Info />
    </div>
    </>
  );
}

function Info() {
  return (
    <div id='infomodal-content'>
        <div className='infosection' id='info-intro'>
            <h1 id='title'>Paperbase</h1>
            <p>Paperbase is a tool designed and built by the 
                <a target='_blank' href='https://lml.yale.edu/'>Lens Media Lab</a> that enables 
                users to explore the lab's reference collection of historic photographic papers. The 
                lab has measured each of these papers along the physical dimensions of color, texture, 
                gloss, and thickness and has catalogued the manufacturer, brand, and year of production for 
                each sample, as well as a great deal of additional historical information. Users can sort, filter, 
                select, and rearrange visual representations of these paper samples in order to find patterns 
                across the whole collection and thus, across the universe of photographic papers.
            </p> 
            <p>  
              What follows 
              is a user guide to the application. As each section scrolls into view, the controls described 
              in that section will appear on the screen in their native locations. These are live, working 
              controls that can be clicked, and changes will be reflected in the display underneath, although 
              if the user guide is open (as it is now), their view will be obscured. 
              <span style={{color: "goldenrod", fontWeight: "700"}}>Every button in the application 
              has a tooltip description that appears when the mouse hovers over it</span>, and the user can 
              always return to this guide by clicking the <span className='material-icons'>info</span> button 
              in the lower left-hand corner of the screen.
            </p>
        </div>
        <div className='infosection' id='info-panel-buttons'>
            <h1>The Panel</h1>
            <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Torquent sodales purus mi condimentum 
            vivamus rhoncus facilisi. Viverra montes ac molestie inceptos aliquet. Class eleifend mollis 
            rutrum amet adipiscing eu molestie. Nascetur augue aenean nisi etiam diam erat justo vehicula 
            cubilia. Nec ipsum efficitur platea fames sed ultricies.
            </p>
            <h2>Panel Structure</h2>
            <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Torquent sodales purus mi condimentum 
            vivamus rhoncus facilisi. Viverra montes ac molestie inceptos aliquet. Class eleifend mollis 
            rutrum amet adipiscing eu molestie. Nascetur augue aenean nisi etiam diam erat justo vehicula 
            cubilia. Nec ipsum efficitur platea fames sed ultricies.
            </p>
            <h2>Panel Fill</h2>
            <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Torquent sodales purus mi condimentum 
            vivamus rhoncus facilisi. Viverra montes ac molestie inceptos aliquet. Class eleifend mollis 
            rutrum amet adipiscing eu molestie. Nascetur augue aenean nisi etiam diam erat justo vehicula 
            cubilia. Nec ipsum efficitur platea fames sed ultricies.
            </p>
            <h2>Panel Text</h2>
            <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Torquent sodales purus mi condimentum 
            vivamus rhoncus facilisi. Viverra montes ac molestie inceptos aliquet. Class eleifend mollis 
            rutrum amet adipiscing eu molestie. Nascetur augue aenean nisi etiam diam erat justo vehicula 
            cubilia. Nec ipsum efficitur platea fames sed ultricies.
            </p>
            <h2>Selection</h2>
            <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Torquent sodales purus mi condimentum 
            vivamus rhoncus facilisi. Viverra montes ac molestie inceptos aliquet. Class eleifend mollis 
            rutrum amet adipiscing eu molestie. Nascetur augue aenean nisi etiam diam erat justo vehicula 
            cubilia. Nec ipsum efficitur platea fames sed ultricies.
            </p>
        </div>
        <div className='infosection' id='info-camera'>
            <h1>Projection Controls</h1>
            <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Torquent sodales purus mi condimentum 
            vivamus rhoncus facilisi. Viverra montes ac molestie inceptos aliquet. Class eleifend mollis 
            rutrum amet adipiscing eu molestie. Nascetur augue aenean nisi etiam diam erat justo vehicula 
            cubilia. Nec ipsum efficitur platea fames sed ultricies.
            </p>
            <h2>Camera Reset</h2>
            <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Torquent sodales purus mi condimentum 
            vivamus rhoncus facilisi. Viverra montes ac molestie inceptos aliquet. Class eleifend mollis 
            rutrum amet adipiscing eu molestie. Nascetur augue aenean nisi etiam diam erat justo vehicula 
            cubilia. Nec ipsum efficitur platea fames sed ultricies.
            </p>
            <h2>Box Selection</h2>
            <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Torquent sodales purus mi condimentum 
            vivamus rhoncus facilisi. Viverra montes ac molestie inceptos aliquet. Class eleifend mollis 
            rutrum amet adipiscing eu molestie. Nascetur augue aenean nisi etiam diam erat justo vehicula 
            cubilia. Nec ipsum efficitur platea fames sed ultricies.
            </p>
        </div>
        <div className='infosection' id='info-top'>
            <h1>Top Controls</h1>
            <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Torquent sodales purus mi condimentum 
            vivamus rhoncus facilisi. Viverra montes ac molestie inceptos aliquet. Class eleifend mollis 
            rutrum amet adipiscing eu molestie. Nascetur augue aenean nisi etiam diam erat justo vehicula 
            cubilia. Nec ipsum efficitur platea fames sed ultricies.
            </p>
            <h2>Plot Width</h2>
            <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Torquent sodales purus mi condimentum 
            vivamus rhoncus facilisi. Viverra montes ac molestie inceptos aliquet. Class eleifend mollis 
            rutrum amet adipiscing eu molestie. Nascetur augue aenean nisi etiam diam erat justo vehicula 
            cubilia. Nec ipsum efficitur platea fames sed ultricies.
            </p>
            <h2>Glyph Controls</h2>
            <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Torquent sodales purus mi condimentum 
            vivamus rhoncus facilisi. Viverra montes ac molestie inceptos aliquet. Class eleifend mollis 
            rutrum amet adipiscing eu molestie. Nascetur augue aenean nisi etiam diam erat justo vehicula 
            cubilia. Nec ipsum efficitur platea fames sed ultricies.
            </p>
        </div>
        <div className='infosection' id='info-bottom'>
            <h1>Axis Menus</h1>
            <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Torquent sodales purus mi condimentum 
            vivamus rhoncus facilisi. Viverra montes ac molestie inceptos aliquet. Class eleifend mollis 
            rutrum amet adipiscing eu molestie. Nascetur augue aenean nisi etiam diam erat justo vehicula 
            cubilia. Nec ipsum efficitur platea fames sed ultricies.
            </p>
        </div>
        <div className='infosection' id='info-plottype'>
            <h1>Plot Types</h1>
            <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Torquent sodales purus mi condimentum 
            vivamus rhoncus facilisi. Viverra montes ac molestie inceptos aliquet. Class eleifend mollis 
            rutrum amet adipiscing eu molestie. Nascetur augue aenean nisi etiam diam erat justo vehicula 
            cubilia. Nec ipsum efficitur platea fames sed ultricies.
            </p>
        </div>
        <div className='infosection' id='info-filter'>
            <h1>Filter Controls</h1>
            <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Torquent sodales purus mi condimentum 
            vivamus rhoncus facilisi. Viverra montes ac molestie inceptos aliquet. Class eleifend mollis 
            rutrum amet adipiscing eu molestie. Nascetur augue aenean nisi etiam diam erat justo vehicula 
            cubilia. Nec ipsum efficitur platea fames sed ultricies.
            </p>
        </div>
        {/* <div className='infosection' id='info-filter-modal'>
            <h2>Filters</h2>
            <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Torquent sodales purus mi condimentum 
            vivamus rhoncus facilisi. Viverra montes ac molestie inceptos aliquet. Class eleifend mollis 
            rutrum amet adipiscing eu molestie. Nascetur augue aenean nisi etiam diam erat justo vehicula 
            cubilia. Nec ipsum efficitur platea fames sed ultricies.
            </p>
        </div> */}
        <div className='infosection' id='info-filter-count'>
            <h2>Filter Counter</h2>
            <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Torquent sodales purus mi condimentum 
            vivamus rhoncus facilisi. Viverra montes ac molestie inceptos aliquet. Class eleifend mollis 
            rutrum amet adipiscing eu molestie. Nascetur augue aenean nisi etiam diam erat justo vehicula 
            cubilia. Nec ipsum efficitur platea fames sed ultricies.
            </p>
        </div>
        <div className='infosection' id='info-landing'>
            <h1>Getting Back to the Landing Page</h1>
            <p>
            Lorem ipsum odor amet, consectetuer adipiscing elit. Torquent sodales purus mi condimentum 
            vivamus rhoncus facilisi. Viverra montes ac molestie inceptos aliquet. Class eleifend mollis 
            rutrum amet adipiscing eu molestie. Nascetur augue aenean nisi etiam diam erat justo vehicula 
            cubilia. Nec ipsum efficitur platea fames sed ultricies.
            </p>
        </div>
        <div className='infosection' id='info-blank' style={{height: "512px"}}>
        </div>
    </div>
  );
}