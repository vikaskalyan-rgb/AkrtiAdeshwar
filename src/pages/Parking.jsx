import { useState, useEffect, useRef } from 'react'
import Topbar from '../components/layout/Topbar'
import { Modal } from '../components/ui'
import api from '../api/config'
import { useAuth } from '../context/AuthContext'
import {
  Car, Bike, Plus, Trash2, X, Edit3, Save, MapPin,
  RotateCw, Move, Check, Maximize2
} from 'lucide-react'

const VEHICLE_TYPES = [
  { value: 'CAR',     label: 'Car',     icon: Car,  isBike: false, color: '#5b52f0' },
  { value: 'BIKE',    label: 'Bike',    icon: Bike, isBike: true,  color: '#059669' },
  { value: 'SCOOTER', label: 'Scooter', icon: Bike, isBike: true,  color: '#0284c7' },
  { value: 'CYCLE',   label: 'Cycle',   icon: Bike, isBike: true,  color: '#d97706' },
  { value: 'TEMPO',   label: 'Tempo',   icon: Car,  isBike: false, color: '#e11d48' },
]
const isBikeType = (t) => ['BIKE', 'SCOOTER', 'CYCLE'].includes((t || '').toUpperCase())

// ── 3D vehicle builders ───────────────────────────────────
function makeCar(color = 0x5b52f0) {
  const g = new THREE.Group()
  // body
  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.4 })
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 3.8), bodyMat)
  body.position.y = 0.45; body.castShadow = true
  g.add(body)
  // cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2), 
    new THREE.MeshStandardMaterial({ color: 0xcfe8ff, metalness: 0.2, roughness: 0.1 }))
  cabin.position.set(0, 0.85, -0.2); cabin.castShadow = true
  g.add(cabin)
  // wheels
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
  const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16)
  const positions = [[-0.95, 0.35, 1.2], [0.95, 0.35, 1.2], [-0.95, 0.35, -1.2], [0.95, 0.35, -1.2]]
  positions.forEach(([x, y, z]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat)
    w.rotation.z = Math.PI / 2; w.position.set(x, y, z); w.castShadow = true
    g.add(w)
  })
  return g
}

function makeBike(color = 0x059669) {
  const g = new THREE.Group()
  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.4 })
  // frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 1.8), bodyMat)
  frame.position.y = 0.6; frame.castShadow = true
  g.add(frame)
  // seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a }))
  seat.position.set(0, 0.9, -0.3); seat.castShadow = true
  g.add(seat)
  // wheels
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.18, 16)
  ;[0.85, -0.85].forEach(z => {
    const w = new THREE.Mesh(wheelGeo, wheelMat)
    w.rotation.z = Math.PI / 2; w.position.set(0, 0.4, z); w.castShadow = true
    g.add(w)
  })
  return g
}

function makeVehicleMesh(type) {
  const t = (type || '').toUpperCase()
  const conf = VEHICLE_TYPES.find(v => v.value === t)
  const color = conf ? parseInt(conf.color.replace('#', '0x')) : 0x888888
  if (isBikeType(t)) return makeBike(color)
  return makeCar(color)
}

// ════════════════════════════════════════════════════════════
//  3D Scene Component
// ════════════════════════════════════════════════════════════
function ParkingScene({ slots, selectedSlotId, onSlotClick, userFlat, isAdmin, editMode, onSlotDrag }) {
  const mountRef    = useRef(null)
  const sceneRef    = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef   = useRef(null)
  const slotMeshesRef = useRef({})   // id -> { base, label, group }
  const raycaster   = useRef(new THREE.Raycaster())
  const pointer     = useRef(new THREE.Vector2())

  // camera control state
  const camState = useRef({
    theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 60,
    target: new THREE.Vector3(0, 0, 0),
    isPanning: false, isRotating: false,
    lastX: 0, lastY: 0,
  })

  // ── init scene once ──
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const W = mount.clientWidth, H = mount.clientHeight
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xeef1f6)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 1000)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambient)
    const sun = new THREE.DirectionalLight(0xffffff, 0.9)
    sun.position.set(20, 40, 20); sun.castShadow = true
    sun.shadow.camera.left = -60; sun.shadow.camera.right = 60
    sun.shadow.camera.top = 60;   sun.shadow.camera.bottom = -60
    sun.shadow.mapSize.set(2048, 2048)
    scene.add(sun)

    // ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 90),
      new THREE.MeshStandardMaterial({ color: 0xd6dae2, roughness: 0.95 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = 0
    ground.receiveShadow = true
    scene.add(ground)

    // boundary walls (the angled compound)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a3a4a })
    const mkWall = (w, h, d, x, y, z, ry = 0) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat)
      wall.position.set(x, y, z); wall.rotation.y = ry; wall.castShadow = true
      scene.add(wall)
    }
    // left & right long walls (slightly angled like the brochure)
    mkWall(1, 3, 80, -24, 1.5, 0, 0.05)
    mkWall(1, 3, 80,  22, 1.5, 0, -0.05)

    // ── LIFTS (two lift blocks near the center) ──
    const liftMat = new THREE.MeshStandardMaterial({ color: 0x5b52f0, metalness: 0.3, roughness: 0.5 })
    const lift1 = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 3), liftMat)
    lift1.position.set(-3, 2, -7); lift1.castShadow = true
    scene.add(lift1)
    const lift2 = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 3), liftMat)
    lift2.position.set(-3, 2, 2); lift2.castShadow = true
    scene.add(lift2)
    // lift labels (text via canvas)
    ;[lift1, lift2].forEach(l => {
      const lblCanvas = document.createElement('canvas')
      lblCanvas.width = 128; lblCanvas.height = 64
      const ctx = lblCanvas.getContext('2d')
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 28px sans-serif'
      ctx.textAlign = 'center'; ctx.fillText('LIFT', 64, 40)
      const tex = new THREE.CanvasTexture(lblCanvas)
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }))
      sprite.scale.set(3, 1.5, 1)
      sprite.position.set(l.position.x, 4.6, l.position.z)
      scene.add(sprite)
    })

    // ── RAMP (entry ramp, the striped one on the right) ──
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x9aa0ad, roughness: 0.9 })
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 6), rampMat)
    ramp.position.set(10, 0.2, -1)
    ramp.receiveShadow = true
    scene.add(ramp)
    // ramp stripes
    for (let i = 0; i < 5; i++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.42, 6),
        new THREE.MeshStandardMaterial({ color: 0xf5c542 })
      )
      stripe.position.set(7 + i * 1.6, 0.22, -1)
      scene.add(stripe)
    }

    // gate marker
    const gateMat = new THREE.MeshStandardMaterial({ color: 0xe11d48 })
    const gate = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 4), gateMat)
    gate.position.set(22, 1, 28); gate.castShadow = true
    scene.add(gate)

    updateCamera()

    // ── render loop ──
    let raf
    const animate = () => {
      raf = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // ── resize ──
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight
      camera.aspect = w / h; camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }, [])

  // ── camera positioning ──
  const updateCamera = useCallback(() => {
    const c = camState.current
    const cam = cameraRef.current
    if (!cam) return
    c.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, c.phi))
    c.radius = Math.max(15, Math.min(120, c.radius))
    const x = c.target.x + c.radius * Math.sin(c.phi) * Math.cos(c.theta)
    const y = c.target.y + c.radius * Math.cos(c.phi)
    const z = c.target.z + c.radius * Math.sin(c.phi) * Math.sin(c.theta)
    cam.position.set(x, y, z)
    cam.lookAt(c.target)
  }, [])

  // ── pointer controls (rotate / pan / zoom) ──
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const onPointerDown = (e) => {
      const c = camState.current
      c.lastX = e.clientX; c.lastY = e.clientY
      if (e.button === 2 || e.shiftKey) c.isPanning = true
      else c.isRotating = true

      // slot pick (only on a clean click, not drag)
      c._downX = e.clientX; c._downY = e.clientY
    }
    const onPointerMove = (e) => {
      const c = camState.current
      const dx = e.clientX - c.lastX, dy = e.clientY - c.lastY
      c.lastX = e.clientX; c.lastY = e.clientY
      if (c.isRotating) {
        c.theta -= dx * 0.01
        c.phi   -= dy * 0.01
        updateCamera()
      } else if (c.isPanning) {
        const panSpeed = c.radius * 0.0015
        c.target.x -= (dx * Math.cos(c.theta) + dy * Math.sin(c.theta)) * panSpeed
        c.target.z -= (-dx * Math.sin(c.theta) + dy * Math.cos(c.theta)) * panSpeed * 0
        c.target.z -= (dy * Math.cos(c.theta) - dx * Math.sin(c.theta)) * panSpeed
        updateCamera()
      }
    }
    const onPointerUp = (e) => {
      const c = camState.current
      const moved = Math.abs(e.clientX - c._downX) + Math.abs(e.clientY - c._downY)
      if (moved < 5) handlePick(e)   // treat as click
      c.isPanning = false; c.isRotating = false
    }
    const onWheel = (e) => {
      e.preventDefault()
      const c = camState.current
      c.radius += e.deltaY * 0.05
      updateCamera()
    }
    const onContext = (e) => e.preventDefault()

    // touch
    let pinchDist = 0
    const onTouchStart = (e) => {
      const c = camState.current
      if (e.touches.length === 1) {
        c.lastX = e.touches[0].clientX; c.lastY = e.touches[0].clientY
        c.isRotating = true
        c._downX = e.touches[0].clientX; c._downY = e.touches[0].clientY
      } else if (e.touches.length === 2) {
        c.isRotating = false
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        pinchDist = Math.hypot(dx, dy)
      }
    }
    const onTouchMove = (e) => {
      e.preventDefault()
      const c = camState.current
      if (e.touches.length === 1 && c.isRotating) {
        const dx = e.touches[0].clientX - c.lastX
        const dy = e.touches[0].clientY - c.lastY
        c.lastX = e.touches[0].clientX; c.lastY = e.touches[0].clientY
        c.theta -= dx * 0.01; c.phi -= dy * 0.01
        updateCamera()
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.hypot(dx, dy)
        c.radius += (pinchDist - dist) * 0.08
        pinchDist = dist
        updateCamera()
      }
    }
    const onTouchEnd = (e) => {
      const c = camState.current
      if (e.changedTouches.length && c._downX != null) {
        const moved = Math.abs(e.changedTouches[0].clientX - c._downX) +
                      Math.abs(e.changedTouches[0].clientY - c._downY)
        if (moved < 8) handlePick(e.changedTouches[0])
      }
      c.isRotating = false
    }

    mount.addEventListener('pointerdown', onPointerDown)
    mount.addEventListener('pointermove', onPointerMove)
    mount.addEventListener('pointerup', onPointerUp)
    mount.addEventListener('wheel', onWheel, { passive: false })
    mount.addEventListener('contextmenu', onContext)
    mount.addEventListener('touchstart', onTouchStart, { passive: false })
    mount.addEventListener('touchmove', onTouchMove, { passive: false })
    mount.addEventListener('touchend', onTouchEnd)

    return () => {
      mount.removeEventListener('pointerdown', onPointerDown)
      mount.removeEventListener('pointermove', onPointerMove)
      mount.removeEventListener('pointerup', onPointerUp)
      mount.removeEventListener('wheel', onWheel)
      mount.removeEventListener('contextmenu', onContext)
      mount.removeEventListener('touchstart', onTouchStart)
      mount.removeEventListener('touchmove', onTouchMove)
      mount.removeEventListener('touchend', onTouchEnd)
    }
  }, [updateCamera])

  // ── pick a slot ──
  const handlePick = (e) => {
    const mount = mountRef.current
    const rect = mount.getBoundingClientRect()
    pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.current.setFromCamera(pointer.current, cameraRef.current)

    const bases = Object.values(slotMeshesRef.current).map(m => m.base)
    const hits = raycaster.current.intersectObjects(bases, false)
    if (hits.length) {
      const id = hits[0].object.userData.slotId
      onSlotClick(id)
    }
  }

  // ── (re)build slots whenever data changes ──
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    // clear old
    Object.values(slotMeshesRef.current).forEach(({ group }) => scene.remove(group))
    slotMeshesRef.current = {}

    slots.forEach(slot => {
      const group = new THREE.Group()
      group.position.set(slot.posX, 0, slot.posZ)
      group.rotation.y = slot.rotation || 0

      const isMine = slot.assignedFlat && userFlat &&
                     slot.assignedFlat.toUpperCase() === userFlat.toUpperCase()
      const isSelected = slot.id === selectedSlotId
      const assigned = !!slot.assignedFlat

      // base pad color
      let padColor = 0xb8bec9          // unassigned grey
      if (assigned) padColor = 0xbfe3c6 // assigned green-ish
      if (isMine)   padColor = 0x5b52f0 // mine indigo
      if (isSelected) padColor = 0xf5c542 // selected yellow

      const base = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 0.15, 5),
        new THREE.MeshStandardMaterial({ color: padColor, roughness: 0.8 })
      )
      base.position.y = 0.08
      base.receiveShadow = true
      base.userData.slotId = slot.id
      group.add(base)

      // slot border lines
      const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff })
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(2.6, 0.16, 5)), edgeMat
      )
      edges.position.y = 0.08
      group.add(edges)

      // label sprite (slot number + flat)
      const c = document.createElement('canvas')
      c.width = 256; c.height = 128
      const ctx = c.getContext('2d')
      ctx.fillStyle = isMine ? '#ffffff' : '#1a1a2e'
      ctx.font = 'bold 52px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(slot.label, 128, 54)
      if (assigned) {
        ctx.font = 'bold 38px sans-serif'
        ctx.fillStyle = isMine ? '#ffe066' : '#5b52f0'
        ctx.fillText(slot.assignedFlat, 128, 100)
      } else {
        ctx.font = '30px sans-serif'; ctx.fillStyle = '#94a3b8'
        ctx.fillText('unassigned', 128, 96)
      }
      const tex = new THREE.CanvasTexture(c)
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }))
      sprite.scale.set(2.5, 1.25, 1)
      sprite.position.set(0, 2.5, 0)
      group.add(sprite)

      // vehicles
      const vehicles = slot.vehicles || []
      const cars  = vehicles.filter(v => !isBikeType(v.type))
      const bikes = vehicles.filter(v => isBikeType(v.type))
      cars.forEach((v, i) => {
        const mesh = makeVehicleMesh(v.type)
        mesh.position.set(0, 0.15, i === 0 ? 0 : 0)
        group.add(mesh)
      })
      bikes.forEach((v, i) => {
        const mesh = makeVehicleMesh(v.type)
        const offset = bikes.length > 1 ? (i === 0 ? -0.6 : 0.6) : 0
        mesh.position.set(offset, 0.15, cars.length ? 1.6 : 0)
        mesh.scale.set(0.9, 0.9, 0.9)
        group.add(mesh)
      })

      scene.add(group)
      slotMeshesRef.current[slot.id] = { base, group }
    })
  }, [slots, selectedSlotId, userFlat])

  return <div ref={mountRef} style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'grab' }} />
}

// ════════════════════════════════════════════════════════════
//  Main Parking Page
// ════════════════════════════════════════════════════════════
export default function Parking() {
  const { user } = useAuth()
  const isAdmin     = user?.role === 'admin'
  const isOwner     = user?.role === 'owner'
  const isTenant    = user?.role === 'tenant' || user?.identifier?.includes('_tenant')
  const userFlat    = user?.flatNo

  const [slots,        setSlots]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [selectedId,   setSelectedId]   = useState(null)
  const [showSlotModal,setShowSlotModal]= useState(false)

  // assign-flat (admin)
  const [assignFlat,   setAssignFlat]   = useState('')
  const [carCap,       setCarCap]       = useState(1)
  const [bikeCap,      setBikeCap]      = useState(0)

  // add-vehicle
  const [vType,        setVType]        = useState('CAR')
  const [vNumber,      setVNumber]      = useState('')
  const [saving,       setSaving]       = useState(false)
  const [err,          setErr]          = useState(null)

  useEffect(() => { fetchSlots() }, [])

  const fetchSlots = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/parking/slots')
      setSlots(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const selectedSlot = slots.find(s => s.id === selectedId)

  // open modal when a slot is clicked
  const handleSlotClick = (id) => {
    setSelectedId(id)
    const slot = slots.find(s => s.id === id)
    if (slot) {
      setAssignFlat(slot.assignedFlat || '')
      setCarCap(slot.carCapacity)
      setBikeCap(slot.bikeCapacity)
      setErr(null)
      setShowSlotModal(true)
    }
  }

  // ── admin: assign / update slot ──
  const handleSaveSlot = async () => {
    setSaving(true); setErr(null)
    try {
      await api.put(`/api/parking/slots/${selectedDb.id}`, {
        assignedFlat: assignFlat.trim().toUpperCase() || null,
      })
      await fetchSlots()
      setShowSlotModal(false)
    } catch (e) { setErr('Failed to save') }
    finally { setSaving(false) }
  }

  const handleAddVehicle = async () => {
    if (!selectedDb) return
    setSaving(true); setErr(null)
    try {
      const res = await api.post('/api/parking/vehicles', {
        slotId: selectedId,
        flatNo: userFlat,
        type: vType,
        numberPlate: vNumber.trim().toUpperCase(),
        addedBy: user?.identifier,
        isTenant: isTenant,
      })
      if (res.data?.error) { setErr(res.data.error); setSaving(false); return }
      setVNumber('')
      await fetchSlots()
    } catch (e) {
      setErr(e?.response?.data?.error || 'Could not add vehicle')
    }
    finally { setSaving(false) }
  }

  const handleDeleteVehicle = async (vid) => {
    try { await api.delete(`/api/parking/vehicles/${vid}`); await fetchSlots() }
    catch (e) { console.error(e) }
  }

  // who can edit vehicles for the selected slot?
  const canEditVehicles = (() => {
    if (!selectedSlot || !selectedSlot.assignedFlat) return false
    const mine = selectedSlot.assignedFlat.toUpperCase() === (userFlat || '').toUpperCase()
    if (!mine) return false
    // owner can edit only if no tenant in flat; tenant always can.
    // Simplest correct rule per your spec: tenant edits if tenant; owner edits otherwise.
    return true
  })()

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <Topbar title="Parking" subtitle="Society parking layout" />

      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[13px]" style={{ color: 'var(--ink-4)' }}>Loading parking...</div>
          </div>
        ) : (
          <ParkingScene
            slots={slots}
            selectedSlotId={selectedId}
            onSlotClick={handleSlotClick}
            userFlat={userFlat}
            isAdmin={isAdmin}
          />
        )}

        {/* Floating legend */}
        <div className="absolute top-3 left-3 card p-3" style={{ maxWidth: 160 }}>
          <div className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--ink-3)' }}>Legend</div>
          {[
            ['#5b52f0', 'Your slot'],
            ['#bfe3c6', 'Assigned'],
            ['#b8bec9', 'Unassigned'],
            ['#f5c542', 'Selected'],
          ].map(([c, l]) => (
            <div key={l} className="flex items-center gap-2 mb-1">
              <div style={{ width: 12, height: 12, borderRadius: 3, background: c }} />
              <span className="text-[11px]" style={{ color: 'var(--ink-2)' }}>{l}</span>
            </div>
          ))}
        </div>

        {/* Help hint */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-center">
          <div className="card px-3 py-2 flex items-center gap-3 text-[10px]" style={{ color: 'var(--ink-3)' }}>
            <span className="flex items-center gap-1"><Move size={11}/> Drag to rotate</span>
            <span className="flex items-center gap-1"><Maximize2 size={11}/> Pinch / scroll to zoom</span>
            <span className="flex items-center gap-1"><MapPin size={11}/> Tap a slot</span>
          </div>
        </div>
      </div>

      {/* ── Slot modal ── */}
      <Modal open={showSlotModal} onClose={() => setShowSlotModal(false)}
        title={selectedSlot ? `Slot ${selectedSlot.label}` : 'Slot'}>
        {selectedSlot && (
          <div className="space-y-4">

            {/* Capacity summary */}
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: '#eeeeff' }}>
                <div className="flex items-center justify-center gap-1">
                  <Car size={14} style={{ color: '#5b52f0' }} />
                  <span className="text-[13px] font-bold" style={{ color: '#5b52f0' }}>{selectedSlot.carCapacity}</span>
                </div>
                <div className="text-[9px] mt-0.5" style={{ color: 'var(--ink-4)' }}>car spaces</div>
              </div>
              <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: '#ecfdf5' }}>
                <div className="flex items-center justify-center gap-1">
                  <Bike size={14} style={{ color: '#059669' }} />
                  <span className="text-[13px] font-bold" style={{ color: '#059669' }}>{selectedSlot.bikeCapacity}</span>
                </div>
                <div className="text-[9px] mt-0.5" style={{ color: 'var(--ink-4)' }}>bike spaces</div>
              </div>
            </div>

            {/* ── ADMIN: assign flat + capacity ── */}
            {isAdmin && (
              <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>
                  Admin · Assign Slot
                </div>
                <div>
                  <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>
                    Flat Number (leave blank to unassign)
                  </label>
                  <input className="input w-full" placeholder="e.g. 2H, 4B"
                    value={assignFlat}
                    onChange={e => setAssignFlat(e.target.value.toUpperCase())} />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>Car spaces</label>
                    <input type="number" min="0" max="4" className="input w-full"
                      value={carCap} onChange={e => setCarCap(e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'var(--ink-2)' }}>Bike spaces</label>
                    <input type="number" min="0" max="6" className="input w-full"
                      value={bikeCap} onChange={e => setBikeCap(e.target.value)} />
                  </div>
                </div>
                <button onClick={handleSaveSlot} disabled={saving} className="btn-primary w-full justify-center">
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Slot'}
                </button>
                {err && <div className="text-[11px] px-3 py-2 rounded-lg"
                  style={{ background: '#fff1f2', color: '#9f1239' }}>{err}</div>}
              </div>
            )}

            {/* Vehicles */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--ink-3)' }}>
                Vehicles {selectedSlot.assignedFlat ? `· Flat ${selectedSlot.assignedFlat}` : ''}
              </div>

              {(!selectedSlot.vehicles || selectedSlot.vehicles.length === 0) ? (
                <div className="text-[12px] text-center py-4 rounded-xl" style={{ color: 'var(--ink-4)', background: 'var(--surface-2)' }}>
                  No vehicles parked here
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedDb.vehicles.map(v => {
                    const conf = typeConf(v.type)
                    const Icon = conf.icon
                    return (
                      <div key={v.id} className="flex items-center gap-2.5 p-2.5 rounded-xl"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${conf.color}18` }}>
                          <Icon size={15} style={{ color: conf.color }}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>{conf.label}</div>
                          {v.numberPlate && <div className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{v.numberPlate}</div>}
                        </div>
                        {v.isTenant && (
                          <span className="badge text-[9px]"
                            style={{ background: '#fffbeb', color: '#d97706' }}>Tenant</span>
                        )}
                        {canEdit && (
                          <button onClick={() => handleDeleteVehicle(v.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: '#fff1f2', color: '#e11d48' }}>
                            <Trash2 size={13}/>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Add vehicle (residents/tenant of this flat) ── */}
            {canEditVehicles && (
              <div className="rounded-xl p-4 space-y-3" style={{ background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
                <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#065f46' }}>
                  Add a Vehicle
                </div>
                {/* type pills */}
                <div className="flex flex-wrap gap-1.5">
                  {VEHICLE_TYPES.map(t => {
                    const Icon = t.icon
                    const active = vType === t.value
                    return (
                      <button key={t.value} onClick={() => setVType(t.value)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                        style={{
                          background: active ? t.color : 'white',
                          color: active ? 'white' : 'var(--ink-2)',
                          border: `1px solid ${active ? t.color : 'var(--border)'}`,
                        }}>
                        <Icon size={13}/> {t.label}
                      </button>
                    )
                  })}
                </div>
                <input className="input w-full" placeholder="Vehicle number (e.g. TN09AB1234)"
                  value={vNumber} onChange={e => setVNumber(e.target.value.toUpperCase())} />
                {err && (
                  <div className="text-[11px] px-3 py-2 rounded-lg" style={{ background: '#fff1f2', color: '#9f1239' }}>
                    {err}
                  </div>
                )}
                <button onClick={handleAddVehicle} disabled={saving} className="btn-primary w-full justify-center">
                  <Plus size={14} /> {saving ? 'Adding...' : 'Add Vehicle'}
                </button>
              </div>
            )}

            {/* Non-editable note */}
            {!canEditVehicles && selectedSlot.assignedFlat && !isAdmin && (
              <div className="text-[11px] px-3 py-2.5 rounded-xl text-center" style={{ background: 'var(--surface-2)', color: 'var(--ink-4)' }}>
                Only the resident of Flat {selectedSlot.assignedFlat} can edit these vehicles.
              </div>
            )}
            {err && isAdmin && (
              <div className="text-[11px] px-3 py-2 rounded-lg" style={{ background: '#fff1f2', color: '#9f1239' }}>{err}</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}