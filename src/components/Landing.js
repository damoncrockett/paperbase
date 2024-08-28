import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import SpinBox from './SpinBox';
import { returnDomain } from '../utils/img';

const tileColor = 0xf9f9f9;
//const tileColor = 0x4b2f3b;
//const tileColor = 0x00356b;
const tileColorPop = 0xbd5319;

export default function Landing({ setPage }) {

  return (
    <div id='landing'>
      <HamburgerButton />
      <div id='landingContent'>
        <p id='landingTitle'>Paperbase.</p>
        <p id='landingText'>Paperbase is an interactive visual platform for exploring and analyzing the world's largest collection of photographic paper. Designed and built by the Lens Media Lab at Yale University.</p>
        <button onClick={() => setPage('app')}>Explore the collection</button>
      </div>
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
        <img id='jpffLogo' src={returnDomain() + 'jpff_white.png'} onError={(e) => e.target.style.display = 'none'} />
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
        Credits
      </div>
      <div className={menuOpen ? 'hamburgerLine hamOpen' : 'hamburgerLine'}>
        Contact
      </div>
    </div>
    </>
  )
}