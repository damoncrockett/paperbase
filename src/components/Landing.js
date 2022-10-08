import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function returnDomain() {
  const production = process.env.NODE_ENV === 'production';
  return production ? '' : 'http://localhost:8888/'
}



export default function Landing({ setPage }) {

  return (
    <div id='landing'>
    <button id='navmenu' className='material-icons menubutton'>menu</button>
      <div id='landingContent'>
        <p id='landingTitle'>Paperbase.</p>
        <p id='landingText'>Paperbase is an interactive visual platform for exploring and analyzing the world's largest collection of photographic paper. Designed and built by the Lens Media Lab at Yale University.</p>
        <button onClick={() => setPage('app')}>Explore the collection</button>
      </div>
      <div id='canvasContainer'>
        <Canvas camera={{ fov: 75, position: [0, 0, 10] }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />
          <Box position={[2.5, 8, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={0x4b2f3b} isrot={true}/>
          <Box position={[7.5, 8, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={0x4b2f3b} isrot={true}/>
          <Box position={[-2.5, 8, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={0x4b2f3b} isrot={true}/>
          <Box position={[-7.5, 8, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={0x4b2f3b} isrot={true}/>
          <Box position={[2.5, 3, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={0x4b2f3b} isrot={true}/>
          <Box position={[7.5, 3, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={0x4b2f3b} isrot={true}/>
          <Box position={[-2.5, 3, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={0x4b2f3b} isrot={true}/>
          <Box position={[-7.5, 3, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={0x4b2f3b} isrot={true}/>
          <Box position={[2.5, -2, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={0x4b2f3b} isrot={true}/>
          <Box position={[7.5, -2, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={0x4b2f3b} isrot={true}/>
          <Box position={[-2.5, -2, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={0x4b2f3b} isrot={true}/>
          <Box position={[-7.5, -2, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={0x4b2f3b} isrot={true}/>
          <Box position={[2.5, -7, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={0x4b2f3b} isrot={true}/>
          <Box position={[7.5, -7, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={0x4b2f3b} isrot={true}/>
          <Box position={[-2.5, -7, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={0x4b2f3b} isrot={true}/>
          <Box position={[-7.5, -7, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]} color={0x4b2f3b} isrot={true}/>
        </Canvas>
      </div>
      <div id='landingFooter'>
        <img id='jpffLogo' src={returnDomain() + 'jpff.png'} onError={(e) => e.target.style.display = 'none'} />
      </div>
    </div>
  )
}

function Box({ position, rotation, color, isrot }) {
  const ref = useRef()

  if ( isrot ) {
    useFrame((state, delta) => (ref.current.rotation.x += delta ))
  }

  return (
    <mesh
      position={position}
      rotation={rotation}
      ref={ref}
      scale={4}>
      <boxGeometry args={[1, 1, 0.25]} />
      <meshLambertMaterial color={color}/>
    </mesh>
  )
}
