import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import SpinBox from './SpinBox';
import { returnDomain } from '../utils/img';

const tileColor = 0xf9f9f9;
//const tileColor = 0x4b2f3b;
//const tileColor = 0x00356b;
const tileColorPop = 0xbd5319;

const iconPath = "M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z";

export default function Landing({ setPage }) {

  return (
    <div id='landing'>
      <HamburgerButton />
      <div id='landingContent'>
        <p id='landingTitle'>Paperbase.</p>
        <p id='landingText'>Paperbase is an interactive visual platform for exploring and analyzing the world's largest collection of photographic paper. Designed and built by the <a href='https://lml.yale.edu/' target='_blank'>Lens Media Lab</a> at Yale University.</p>
        <button onClick={() => setPage('app')}>Explore the collection</button>
      </div>
      <div id='terms-of-use'><a href={returnDomain() + 'terms.html'} target='_blank'>Terms of Use</a></div>
      <div id='canvasContainer'>
        <Canvas camera={{ fov: 90, position: [0, 0, 10] }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />
          <SpinBox position={[-5, 5, 0]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={tileColor} isrot={true}/>
          <SpinBox position={[0, 5, 0]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={tileColor} isrot={true}/>
          <SpinBox position={[5, 5, 0]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={tileColor} isrot={true}/>
          <SpinBox position={[-5, 0, 0]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={tileColor} isrot={true}/>
          <SpinBox position={[0, 0, 0]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={tileColor} isrot={true}/>
          <SpinBox position={[5, 0, 0]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={tileColor} isrot={true}/>
          <SpinBox position={[-5, -5, 0]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={tileColor} isrot={true}/>
          <SpinBox position={[0, -5, 0]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={tileColor} isrot={true}/>
          <SpinBox position={[5, -5, 0]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={tileColor} isrot={true}/>
        </Canvas>
      </div>
      <div id='landingFooter'>
        <a href='https://www.jpfamilyfund.org/' target='_blank'>
          <img id='jpffLogo' src={returnDomain() + 'jpff_white.png'} onError={(e) => e.target.style.display = 'none'} />
        </a>
      </div>
      <div id='github-icon'>
        <a href="https://github.com/damoncrockett/paperbase" target='_blank'>
            <svg id='github-icon' viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d={iconPath}></path>
            </svg>
        </a>
      </div>
    </div>
  )
}

function HamburgerButton() {

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
    <div id='clickoutField' 
      style={{display: menuOpen ? 'block' : 'none', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 11}} 
      onClick={e => {e.stopPropagation(); setMenuOpen(false)}}>
    </div>
    <div id='hamburgerButton' onClick={e => {e.stopPropagation(); setMenuOpen(true)}}>
      <div className={menuOpen ? 'hamburgerLine hamOpen' : 'hamburgerLine'}>
        Methods
      </div>
      <div className={menuOpen ? 'hamburgerLine hamOpen' : 'hamburgerLine'}>
        Research
      </div>
      <div className={menuOpen ? 'hamburgerLine hamOpen' : 'hamburgerLine'}>
        Credits
      </div>
    </div>
    </>
  )
}

