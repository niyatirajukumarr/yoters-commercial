'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'

// Renders the 3D penguin (static mesh) and animates its whole body:
// drop in -> lean toward the card -> lean back (pull) -> settle into a gentle idle.
export default function PenguinScene({ width = 160, height = 190 }: { width?: number; height?: number }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100)
    camera.position.set(0, 0, 4.2)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 1.0))
    const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(2, 3, 4); scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-3, 1, -2); scene.add(fill)

    const pivot = new THREE.Group()
    scene.add(pivot)

    // Base orientation of the mesh (tuned so the penguin stands upright, facing the viewer)
    const BASE_ROT_X = 0
    const BASE_ROT_Y = 0

    let raf = 0
    const start = performance.now()
    let model: THREE.Object3D | null = null
    let disposed = false

    const mtlLoader = new MTLLoader()
    mtlLoader.setPath('/penguin/')
    mtlLoader.setResourcePath('/penguin/')
    mtlLoader.load('material.mtl', (materials) => {
      materials.preload()
      const objLoader = new OBJLoader()
      objLoader.setMaterials(materials)
      objLoader.setPath('/penguin/')
      objLoader.load('penguin.obj', (obj) => {
        if (disposed) return
        const box = new THREE.Box3().setFromObject(obj)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z) || 1
        const scale = 2.6 / maxDim
        obj.scale.setScalar(scale)
        obj.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
        pivot.add(obj)
        model = obj
      })
    })

    const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)

    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = (performance.now() - start) / 1000

      pivot.rotation.x = BASE_ROT_X
      let leanZ = 0
      let baseY = BASE_ROT_Y

      if (model) {
        // drop in (first 1s)
        const drop = t < 1 ? (1 - easeOut(t)) * 5.5 : 0
        // lean timeline: reach -> pull -> upright
        if (t > 1.0 && t < 1.35) leanZ = ((t - 1.0) / 0.35) * -0.32          // reach toward card (tilt right)
        else if (t >= 1.35 && t < 2.45) leanZ = -0.32 + ((t - 1.35) / 1.1) * 0.72 // lean back (pull)
        else if (t >= 2.45 && t < 2.95) leanZ = 0.40 - ((t - 2.45) / 0.5) * 0.40   // return upright
        // idle after settle
        const bob = t > 2.95 ? Math.sin((t - 2.95) * 1.8) * 0.04 : 0
        const idleY = t > 2.95 ? Math.sin((t - 2.95) * 0.55) * 0.35 : 0

        pivot.position.y = drop + bob
        pivot.rotation.z = leanZ
        pivot.rotation.y = baseY + idleY
      }

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [width, height])

  return <div ref={mountRef} style={{ width, height }} />
}
