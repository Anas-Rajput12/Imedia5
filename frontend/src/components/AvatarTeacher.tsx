'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

interface AvatarProps {
  speaking: boolean
  audioLevel?: number
  avatarType?: 'maths' | 'science' | 'homework'
  isPointing?: boolean
  pointDirection?: 'left' | 'center' | 'right'
  isHoldingBook?: boolean
  isExplaining?: boolean
  isListening?: boolean
  teachingMode?: 'explaining' | 'writing' | 'pointing' | 'idle'
  isWriting?: boolean
}

interface MorphTargetMesh {
  mesh: THREE.Mesh
  morphTargetDictionary: { [key: string]: number }
}

const AVATAR_FILES = {
  maths: '/avatar.glb',
  science: '/avatar2.glb',
  homework: '/avatar1.glb',
}

function AvatarModel({
  speaking,
  audioLevel = 0,
  avatarType = 'maths',
  isExplaining = false,
  isWriting = false,
  teachingMode = 'idle'
}: AvatarProps) {
  const group = useRef<THREE.Group>(null)
  const headBone = useRef<THREE.Object3D>(null)
  const spine = useRef<THREE.Object3D>(null)
  const leftUpperArm = useRef<THREE.Object3D>(null)
  const rightUpperArm = useRef<THREE.Object3D>(null)
  const leftForearm = useRef<THREE.Object3D>(null)
  const rightForearm = useRef<THREE.Object3D>(null)
  const leftHand = useRef<THREE.Object3D>(null)
  const rightHand = useRef<THREE.Object3D>(null)

  const avatarFile = AVATAR_FILES[avatarType] || '/avatar.glb'
  const { scene, animations } = useGLTF(avatarFile)
  const morphTargets = useRef<MorphTargetMesh[]>([])
  const mixer = useRef<THREE.AnimationMixer>()
  const lastBlinkTime = useRef(0)
  const gestureTime = useRef(Math.random() * 1000)

  useEffect(() => {
    if (!scene) return

    scene.traverse((child) => {
      const lowerName = child.name.toLowerCase()

      if (lowerName.includes('head') || lowerName.includes('neck')) {
        headBone.current = child as THREE.Object3D
      }
      if (lowerName.includes('spine') || lowerName.includes('chest')) {
        spine.current = child as THREE.Object3D
      }
      if (lowerName.includes('leftupperarm')) {
        leftUpperArm.current = child as THREE.Object3D
      }
      if (lowerName.includes('rightupperarm')) {
        rightUpperArm.current = child as THREE.Object3D
      }
      if (lowerName.includes('leftforearm')) {
        leftForearm.current = child as THREE.Object3D
      }
      if (lowerName.includes('rightforearm')) {
        rightForearm.current = child as THREE.Object3D
      }
      if (lowerName.includes('lefthand')) {
        leftHand.current = child as THREE.Object3D
      }
      if (lowerName.includes('righthand')) {
        rightHand.current = child as THREE.Object3D
      }

      if (child instanceof THREE.Mesh && child.morphTargetInfluences && child.morphTargetDictionary) {
        morphTargets.current.push({
          mesh: child,
          morphTargetDictionary: child.morphTargetDictionary
        })
      }
    })

    if (animations && animations.length > 0) {
      mixer.current = new THREE.AnimationMixer(scene)
      const idleClip = animations.find(anim =>
        anim.name.toLowerCase().includes('idle') ||
        anim.name.toLowerCase().includes('standing')
      )
      if (idleClip) {
        const idleAction = mixer.current.clipAction(idleClip)
        idleAction.setEffectiveTimeScale(0.5)
        idleAction.setEffectiveWeight(1)
        idleAction.play()
      }
    }
  }, [scene, animations])

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    gestureTime.current += delta

    if (mixer.current) {
      mixer.current.update(delta)
    }

    // === NATURAL BREATHING (Continuous, calm) ===
    if (spine.current) {
      const breath = Math.sin(time * 0.3) * 0.006
      spine.current.position.y = breath
    }

    // === EYE BLINKING (Natural, not too frequent) ===
    if (morphTargets.current.length > 0) {
      const timeSinceLastBlink = time - lastBlinkTime.current
      if (timeSinceLastBlink > 3 + Math.random() * 2) {
        const blinkDuration = 0.15
        const blinkPhase = timeSinceLastBlink / blinkDuration
        if (blinkPhase < 1) {
          const blinkValue = Math.sin(blinkPhase * Math.PI) * 0.85
          morphTargets.current.forEach(({ mesh, morphTargetDictionary }) => {
            if ('eyeBlinkLeft' in morphTargetDictionary) {
              const idx = morphTargetDictionary['eyeBlinkLeft']
              if (mesh.morphTargetInfluences && idx !== undefined) {
                mesh.morphTargetInfluences[idx] = blinkValue
              }
            }
            if ('eyeBlinkRight' in morphTargetDictionary) {
              const idx = morphTargetDictionary['eyeBlinkRight']
              if (mesh.morphTargetInfluences && idx !== undefined) {
                mesh.morphTargetInfluences[idx] = blinkValue
              }
            }
          })
          if (blinkPhase > 0.5) {
            lastBlinkTime.current = time
          }
        }
      }
    }

    // === PROFESSIONAL LIP-SYNC WITH GENTLE SMILE ===
    if (speaking && morphTargets.current.length > 0) {
      // Natural mouth movement synchronized with audio
      const mouthOpenTarget = audioLevel > 0 ? audioLevel * 0.7 : Math.sin(time * 10) * 0.35 + 0.4
      const mouthSmileTarget = 0.25 // Professional, friendly smile (not exaggerated)

      morphTargets.current.forEach(({ mesh, morphTargetDictionary }) => {
        if ('mouthOpen' in morphTargetDictionary) {
          const idx = morphTargetDictionary['mouthOpen']
          if (mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
              mesh.morphTargetInfluences[idx],
              mouthOpenTarget,
              delta * 14
            )
          }
        }
        if ('mouthSmile' in morphTargetDictionary) {
          const idx = morphTargetDictionary['mouthSmile']
          if (mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
              mesh.morphTargetInfluences[idx],
              mouthSmileTarget,
              delta * 10
            )
          }
        }
        // Subtle cheek movement while speaking
        if ('cheekPuffLeft' in morphTargetDictionary) {
          const idx = morphTargetDictionary['cheekPuffLeft']
          if (mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
              mesh.morphTargetInfluences[idx],
              Math.sin(time * 8) * 0.04,
              delta * 10
            )
          }
        }
        if ('cheekPuffRight' in morphTargetDictionary) {
          const idx = morphTargetDictionary['cheekPuffRight']
          if (mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
              mesh.morphTargetInfluences[idx],
              Math.sin(time * 8) * 0.04,
              delta * 10
            )
          }
        }
      })
    } else {
      // Return to neutral expression when not speaking
      if (morphTargets.current.length > 0) {
        morphTargets.current.forEach(({ mesh, morphTargetDictionary }) => {
          if ('mouthOpen' in morphTargetDictionary) {
            const idx = morphTargetDictionary['mouthOpen']
            if (mesh.morphTargetInfluences) {
              mesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
                mesh.morphTargetInfluences[idx],
                0,
                delta * 8
              )
            }
          }
          if ('mouthSmile' in morphTargetDictionary) {
            const idx = morphTargetDictionary['mouthSmile']
            if (mesh.morphTargetInfluences) {
              mesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
                mesh.morphTargetInfluences[idx],
                0.15, // Resting friendly smile
                delta * 6
              )
            }
          }
        })
      }
    }

    // === PROFESSIONAL HEAD MOVEMENTS ===
    if (headBone.current) {
      if (speaking || isExplaining) {
        // Gentle, professional head movements while teaching
        headBone.current.rotation.y = THREE.MathUtils.lerp(
          headBone.current.rotation.y,
          Math.sin(time * 0.4) * 0.05, // Subtle head turn
          delta * 2
        )
        headBone.current.rotation.x = THREE.MathUtils.lerp(
          headBone.current.rotation.x,
          Math.sin(time * 0.35) * 0.04, // Subtle nod
          delta * 2
        )
        // Very slight head tilt (engaged but professional)
        headBone.current.rotation.z = THREE.MathUtils.lerp(
          headBone.current.rotation.z,
          Math.sin(time * 0.3) * 0.03,
          delta * 1.8
        )
      } else if (teachingMode === 'listening' || isListening) {
        // Attentive listening pose - slight forward lean
        headBone.current.rotation.x = THREE.MathUtils.lerp(
          headBone.current.rotation.x,
          0.08,
          delta * 1.5
        )
        headBone.current.rotation.y = THREE.MathUtils.lerp(
          headBone.current.rotation.y,
          0,
          delta * 1.5
        )
      } else {
        // Relaxed neutral position
        headBone.current.rotation.y = THREE.MathUtils.lerp(
          headBone.current.rotation.y,
          Math.sin(time * 0.1) * 0.02,
          delta * 0.8
        )
        headBone.current.rotation.x = THREE.MathUtils.lerp(
          headBone.current.rotation.x,
          0,
          delta * 0.8
        )
        headBone.current.rotation.z = THREE.MathUtils.lerp(
          headBone.current.rotation.z,
          0,
          delta * 0.6
        )
      }
    }

    // === PROFESSIONAL HAND GESTURES (Controlled, not exaggerated) ===
    if ((speaking || isExplaining) && teachingMode !== 'writing') {
      // RIGHT HAND - Professional explanatory gestures
      if (rightUpperArm.current) {
        rightUpperArm.current.rotation.x = THREE.MathUtils.lerp(
          rightUpperArm.current.rotation.x,
          Math.sin(gestureTime.current * 0.8) * 0.35 + 0.45, // Controlled movement
          delta * 2.5
        )
        rightUpperArm.current.rotation.z = THREE.MathUtils.lerp(
          rightUpperArm.current.rotation.z,
          Math.cos(gestureTime.current * 0.6) * 0.18 - 0.08,
          delta * 2.5
        )
        rightUpperArm.current.rotation.y = THREE.MathUtils.lerp(
          rightUpperArm.current.rotation.y,
          Math.sin(gestureTime.current * 0.5) * 0.12,
          delta * 2
        )
      }
      if (rightForearm.current) {
        rightForearm.current.rotation.x = THREE.MathUtils.lerp(
          rightForearm.current.rotation.x,
          Math.sin(gestureTime.current * 1.0) * 0.22 + 0.28,
          delta * 2.5
        )
        rightForearm.current.rotation.y = THREE.MathUtils.lerp(
          rightForearm.current.rotation.y,
          Math.sin(gestureTime.current * 0.7) * 0.1,
          delta * 2
        )
      }
      if (rightHand.current) {
        rightHand.current.rotation.z = THREE.MathUtils.lerp(
          rightHand.current.rotation.z,
          Math.sin(gestureTime.current * 1.2) * 0.14,
          delta * 3
        )
        rightHand.current.rotation.x = THREE.MathUtils.lerp(
          rightHand.current.rotation.x,
          Math.cos(gestureTime.current * 1.0) * 0.12,
          delta * 2.5
        )
        rightHand.current.rotation.y = THREE.MathUtils.lerp(
          rightHand.current.rotation.y,
          Math.sin(gestureTime.current * 1.4) * 0.1,
          delta * 3
        )
      }

      // LEFT HAND - Supportive, calm gestures
      if (leftUpperArm.current) {
        leftUpperArm.current.rotation.x = THREE.MathUtils.lerp(
          leftUpperArm.current.rotation.x,
          0.4 + Math.sin(gestureTime.current * 0.4) * 0.08,
          delta * 2
        )
        leftUpperArm.current.rotation.z = THREE.MathUtils.lerp(
          leftUpperArm.current.rotation.z,
          Math.sin(gestureTime.current * 0.3) * 0.06,
          delta * 2
        )
        leftUpperArm.current.rotation.y = THREE.MathUtils.lerp(
          leftUpperArm.current.rotation.y,
          Math.sin(gestureTime.current * 0.25) * 0.05,
          delta * 1.8
        )
      }
      if (leftForearm.current) {
        leftForearm.current.rotation.x = THREE.MathUtils.lerp(
          leftForearm.current.rotation.x,
          Math.sin(gestureTime.current * 0.75) * 0.18 + 0.22,
          delta * 2
        )
        leftForearm.current.rotation.y = THREE.MathUtils.lerp(
          leftForearm.current.rotation.y,
          Math.sin(gestureTime.current * 0.6) * 0.08,
          delta * 2
        )
      }
      if (leftHand.current) {
        leftHand.current.rotation.z = THREE.MathUtils.lerp(
          leftHand.current.rotation.z,
          Math.sin(gestureTime.current * 0.9) * 0.12,
          delta * 2.5
        )
        leftHand.current.rotation.x = THREE.MathUtils.lerp(
          leftHand.current.rotation.x,
          Math.cos(gestureTime.current * 0.8) * 0.1,
          delta * 2.3
        )
        leftHand.current.rotation.y = THREE.MathUtils.lerp(
          leftHand.current.rotation.y,
          Math.sin(gestureTime.current * 1.1) * 0.09,
          delta * 2.5
        )
      }
    } else if (teachingMode === 'writing' || isWriting) {
      // Writing pose - arms positioned for writing on board
      if (rightUpperArm.current) {
        rightUpperArm.current.rotation.x = THREE.MathUtils.lerp(
          rightUpperArm.current.rotation.x,
          1.2, // Arm raised for writing
          delta * 2
        )
        rightUpperArm.current.rotation.z = THREE.MathUtils.lerp(
          rightUpperArm.current.rotation.z,
          -0.3,
          delta * 2
        )
      }
      if (rightForearm.current) {
        rightForearm.current.rotation.x = THREE.MathUtils.lerp(
          rightForearm.current.rotation.x,
          0.5,
          delta * 2
        )
      }
    } else {
      // === RELAXED NEUTRAL POSITION (When not teaching) ===
      // Right arm - natural resting position
      if (rightUpperArm.current) {
        rightUpperArm.current.rotation.x = THREE.MathUtils.lerp(
          rightUpperArm.current.rotation.x,
          0.03,
          delta * 0.6
        )
        rightUpperArm.current.rotation.z = THREE.MathUtils.lerp(
          rightUpperArm.current.rotation.z,
          -0.01,
          delta * 0.6
        )
        rightUpperArm.current.rotation.y = THREE.MathUtils.lerp(
          rightUpperArm.current.rotation.y,
          0,
          delta * 0.5
        )
      }
      if (rightForearm.current) {
        rightForearm.current.rotation.x = THREE.MathUtils.lerp(
          rightForearm.current.rotation.x,
          0.04,
          delta * 0.6
        )
        rightForearm.current.rotation.y = THREE.MathUtils.lerp(
          rightForearm.current.rotation.y,
          0,
          delta * 0.5
        )
      }
      if (rightHand.current) {
        rightHand.current.rotation.z = THREE.MathUtils.lerp(
          rightHand.current.rotation.z,
          0,
          delta * 0.6
        )
        rightHand.current.rotation.x = THREE.MathUtils.lerp(
          rightHand.current.rotation.x,
          0.05,
          delta * 0.6
        )
        rightHand.current.rotation.y = THREE.MathUtils.lerp(
          rightHand.current.rotation.y,
          0,
          delta * 0.5
        )
      }

      // Left arm - natural resting position
      if (leftUpperArm.current) {
        leftUpperArm.current.rotation.x = THREE.MathUtils.lerp(
          leftUpperArm.current.rotation.x,
          0.04,
          delta * 0.6
        )
        leftUpperArm.current.rotation.z = THREE.MathUtils.lerp(
          leftUpperArm.current.rotation.z,
          0.015,
          delta * 0.6
        )
        leftUpperArm.current.rotation.y = THREE.MathUtils.lerp(
          leftUpperArm.current.rotation.y,
          0,
          delta * 0.5
        )
      }
      if (leftForearm.current) {
        leftForearm.current.rotation.x = THREE.MathUtils.lerp(
          leftForearm.current.rotation.x,
          0.03,
          delta * 0.6
        )
        leftForearm.current.rotation.y = THREE.MathUtils.lerp(
          leftForearm.current.rotation.y,
          0,
          delta * 0.5
        )
      }
      if (leftHand.current) {
        leftHand.current.rotation.z = THREE.MathUtils.lerp(
          leftHand.current.rotation.z,
          0,
          delta * 0.6
        )
        leftHand.current.rotation.x = THREE.MathUtils.lerp(
          leftHand.current.rotation.x,
          0.05,
          delta * 0.6
        )
        leftHand.current.rotation.y = THREE.MathUtils.lerp(
          leftHand.current.rotation.y,
          0,
          delta * 0.5
        )
      }
    }

    // === PROFESSIONAL BODY SWAY (Subtle, not distracting) ===
    if (spine.current) {
      if (speaking || isExplaining) {
        // Very subtle body movement while teaching
        spine.current.rotation.z = THREE.MathUtils.lerp(
          spine.current.rotation.z,
          Math.sin(time * 0.3) * 0.03,
          delta * 1.5
        )
        spine.current.rotation.x = THREE.MathUtils.lerp(
          spine.current.rotation.x,
          Math.sin(time * 0.25) * 0.025,
          delta * 1.3
        )
        spine.current.rotation.y = THREE.MathUtils.lerp(
          spine.current.rotation.y,
          Math.sin(time * 0.2) * 0.02,
          delta * 1.2
        )
      } else {
        // Return to relaxed position
        spine.current.rotation.z = THREE.MathUtils.lerp(
          spine.current.rotation.z,
          Math.sin(time * 0.1) * 0.01,
          delta * 0.6
        )
        spine.current.rotation.x = THREE.MathUtils.lerp(
          spine.current.rotation.x,
          0,
          delta * 0.5
        )
        spine.current.rotation.y = THREE.MathUtils.lerp(
          spine.current.rotation.y,
          0,
          delta * 0.4
        )
      }
    }
  })

  return (
    <primitive
      ref={group}
      object={scene}
      scale={2.8}
      position={[0, -3.2, 0]}
    />
  )
}

export default function AvatarTeacher({
  speaking,
  audioLevel,
  avatarType,
  isPointing = false,
  pointDirection = 'left',
  isHoldingBook = true,
  isExplaining = false,
  isListening = false,
  teachingMode = 'idle',
  isWriting = false
}: AvatarProps) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-50 rounded-2xl shadow-inner overflow-hidden">
      <Canvas camera={{ position: [0, 1.6, 4.2], fov: 48}} gl={{ antialias: true }}>
        <ambientLight intensity={1.0} />
        <directionalLight position={[0, 3, 3]} intensity={2.0} castShadow color="#FFF5E6" />
        <directionalLight position={[-2, 2, 2]} intensity={0.9} color="#E8F4FF" />
        <directionalLight position={[2, 2, 2]} intensity={0.9} color="#FFE8F0" />
        <pointLight position={[0, 2, 2]} intensity={0.7} color="#FFF9E8" />
        <pointLight position={[-1, 3, 1]} intensity={0.4} color="#E8FFF0" />

        <mesh position={[0, 0, -3]}>
          <planeGeometry args={[20, 10]} />
          <meshStandardMaterial color="#F8FAFF" />
        </mesh>

        <mesh position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#FEF7E8" />
        </mesh>

        <AvatarModel
          speaking={speaking}
          audioLevel={audioLevel}
          avatarType={avatarType}
          isPointing={isPointing}
          pointDirection={pointDirection}
          isHoldingBook={isHoldingBook}
          isExplaining={isExplaining}
          isListening={isListening}
          teachingMode={teachingMode}
          isWriting={isWriting}
        />

      </Canvas>
    </div>
  )
}

useGLTF.preload('/avatar.glb')
useGLTF.preload('/avatar1.glb')
useGLTF.preload('/avatar2.glb')
