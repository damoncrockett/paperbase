import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

function SpinBox({ position, rotation, color, isrot }) {
  const ref = useRef()

  if (isrot) {
    useFrame((state, delta) => (ref.current.rotation.x += delta))
  }

  return (
    <mesh
      position={position}
      rotation={rotation}
      ref={ref}
      scale={4}>
      <boxGeometry args={[1, 1, 0.25]} />
      <meshLambertMaterial color={color} />
    </mesh>
  )
}

export default SpinBox;
