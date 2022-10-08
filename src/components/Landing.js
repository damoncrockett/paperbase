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
      <div id='landingContent'>
        <p id='landingTitle'>Paperbase.</p>
        <p id='landingText'>Paperbase is an interactive visual platform for exploring and analyzing the world's largest collection of photographic paper. Designed and built by the Lens Media Lab at Yale University.</p>
        <button onClick={() => setPage('app')}>Explore the collection</button>
      </div>
      <div id='canvasContainer'>
        <Canvas>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />
          <Box position={[2.5, 0, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]}/>
          <Box position={[7.5, 0, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]}/>
          <Box position={[-2.5, 0, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]}/>
          <Box position={[-7.5, 0, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]}/>
          <Box position={[2.5, 5, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]}/>
          <Box position={[7.5, 5, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]}/>
          <Box position={[-2.5, 5, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]}/>
          <Box position={[-7.5, 5, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]}/>
          <Box position={[2.5, -5, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]}/>
          <Box position={[7.5, -5, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]}/>
          <Box position={[-2.5, -5, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]}/>
          <Box position={[-7.5, -5, -8]} rotation={[Math.PI * 2 * Math.random(), 0, 0]}/>
        </Canvas>
      </div>
      <div id='landingFooter'>
        <img id='jpffLogo' src={returnDomain() + 'jpff.png'} onError={(e) => e.target.style.display = 'none'} />
      </div>
    </div>
  )
}

function Box(props) {
  const ref = useRef()
  useFrame((state, delta) => (ref.current.rotation.x += delta))

  return (
    <mesh
      {...props}
      ref={ref}
      scale={4}>
      <boxGeometry args={[1, 1, 0.25]} />
      <meshLambertMaterial color={0x4b2f3b}/>
    </mesh>
  )
}
