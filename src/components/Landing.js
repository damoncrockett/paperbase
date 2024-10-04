import React, { useRef, useEffect, useState } from 'react';
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
        <div className='landingContentSectionTitle'>
          <p>The Collection</p>
        </div>
        <div className='landingContentItem'>
          <p>{landingText[0].text}</p>
        </div>
        <div className='landingContentItem'>
          <p>{landingText[1].text}</p>
        </div>
        <div className='landingContentItem'>
          <p>{landingText[2].text}</p>
        </div>
        <div className='landingContentItem'>
          <p>{landingText[3].text}</p>
        </div>   
      </div>
    </div>  
  )
}