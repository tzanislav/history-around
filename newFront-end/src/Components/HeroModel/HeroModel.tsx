import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useFBX, useTexture } from '@react-three/drei'
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  type Object3D,
} from 'three'
import './HeroModel.css'

type CustomModelConfig = {
  modelPath: string
  texturePath: string
  scale?: number
  positionOffset?: [number, number, number]
  rotationOffset?: [number, number, number]
}

type HeroModelProps = {
  customModel?: CustomModelConfig
}

function RelicShape() {
  const meshRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (!meshRef.current) {
      return
    }

    meshRef.current.rotation.y += delta * 0.35
    meshRef.current.rotation.x += delta * 0.1
  })

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <icosahedronGeometry args={[1.25, 1]} />
      <meshStandardMaterial
        color="#f0b45e"
        metalness={0.55}
        roughness={0.24}
        emissive="#6f3f11"
        emissiveIntensity={0.2}
      />
    </mesh>
  )
}

function FbxModel({ config }: { config: CustomModelConfig }) {
  const modelRef = useRef<Group>(null)
  const fbx = useFBX(config.modelPath)
  const texture = useTexture(config.texturePath)
  const positionOffset = config.positionOffset ?? [0, 0, 0]
  const rotationOffset = config.rotationOffset ?? [0, 0, 0]

  const model = useMemo(() => {
    texture.colorSpace = SRGBColorSpace

    const clonedModel = fbx.clone(true)

    clonedModel.traverse((child: Object3D) => {
      const candidateMesh = child as Mesh

      if (!candidateMesh.isMesh) {
        return
      }

      candidateMesh.castShadow = true
      candidateMesh.receiveShadow = true
      candidateMesh.material = new MeshStandardMaterial({
        map: texture,
        metalness: 0.0,
        roughness: 0.25,
      })
    })

    return clonedModel
  }, [fbx, texture])

  useFrame((_, delta) => {
    if (!modelRef.current) {
      return
    }

    modelRef.current.rotation.y += delta * 0.3
  })

  return (
    <group
      ref={modelRef}
      scale={config.scale ?? 0.01}
      position={positionOffset}
      rotation={rotationOffset}
    >
      <primitive object={model} />
    </group>
  )
}

function HeroModel({ customModel }: HeroModelProps) {
  return (
    <div className="hero-model" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 4], fov: 40 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 2.5, 3]} intensity={1.3} />
        <pointLight position={[-2.4, -1.6, -1]} intensity={0.7} color="#88b6ff" />
        {customModel ? <FbxModel config={customModel} /> : <RelicShape />}
      </Canvas>
    </div>
  )
}

export default HeroModel
