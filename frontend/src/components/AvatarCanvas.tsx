'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import AvatarTeacher from './AvatarTeacher'

export default function AvatarCanvas({ speaking, audioLevel = 0 }: { speaking: boolean; audioLevel?: number }) {
  return (
    <div className="w-full h-[500px]">
      <Canvas camera={{ position: [0, 1.6, 3.5], fov: 35 }} gl={{ antialias: true }}>

        {/* LIGHTING */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[0, 3, 3]} intensity={2} />
        <directionalLight position={[-2, 2, 2]} intensity={0.5} />
        <directionalLight position={[2, 2, -2]} intensity={0.5} />
        
        {/* Fill light */}
        <pointLight position={[0, 2, 2]} intensity={0.5} />

        {/* AVATAR */}
        <AvatarTeacher speaking={speaking} audioLevel={audioLevel} />

        {/* ENVIRONMENT */}
        <Environment preset="city" />

        {/* CONTROLS */}
        <OrbitControls enableZoom={false} />

      </Canvas>
    </div>
  )
}
