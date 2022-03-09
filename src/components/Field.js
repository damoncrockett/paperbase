import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function Scatter(props) {
  const vertices = new Float32Array(props.data.pos);
  const normals = new Float32Array(props.data.norm);
  const itemSize = 3;
  return (
    <mesh>
      <bufferGeometry>
        <bufferAttribute
          attachObject={["attributes", "position"]}
          array={vertices}
          count={vertices.length / itemSize}
          itemSize={itemSize}
        />
        <bufferAttribute
          attachObject={["attributes", "normal"]}
          array={normals}
          count={normals.length / itemSize}
          itemSize={itemSize}
        />
      </bufferGeometry>
      <meshStandardMaterial color={'dodgerblue'} />
    </mesh>
  )
}

function Field(props) {
  const data = props.data;
  if (data!==null) {
    return (
      <Canvas dpr={[1, 2]} camera={{ position: [1, 1, 4000], far: 100000 }}>
        <color attach="background" args={[0xfff8dc]} />
        <ambientLight />
        <pointLight position={[1, 1, 2000]} />
        <Scatter
          data={props.data[0]}
        />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    )
  } else {
    return null
  }
}

export default Field;
