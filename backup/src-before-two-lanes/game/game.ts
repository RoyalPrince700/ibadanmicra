import { DISTRICTS, type SpriteKind } from './districts'
import { drawBackdrop, drawGantry, drawPlayer, drawSegment, drawSprite, mixHex, type CarPose } from './draw'
import { RIGHT_LANES } from './lanes'
import {
  SEGMENT_LENGTH,
  buildTrack,
  findSegment,
  resetSprites,
  type Segment,
  type Sprite,
} from './track'

const ROAD_WIDTH = 2000
const CAMERA_DEPTH = 0.84
const CAMERA_HEIGHT = 1000
const DRAW_DISTANCE = 140
const MAX_SPEED = 3400
const ACCEL = 1700
const BRAKE = 3200
const COAST = 280
const CLIMB = 3200
const BEST_KEY = 'seven-hills-fare'

const SCENERY = new Set<SpriteKind>([
  'sign',
  'palm',
  'tree',
  'umbrella',
  'roof',
  'cocoa',
  'mapo',
  'tower',
  'premier',
  'terminal',
  'kiosk',
  'bay',
  'gantry',
])

export interface Hud {
  phase: 'title' | 'drive' | 'over' | 'win'
  district: string
  street: string
  address: string
  subtitle: string
  radio: string
  fare: number
  lives: number
  speed: number
  maxSpeed: number
  progress: number
  districtIndex: number
  districtCount: number
  banner: string
  bannerSub: string
  toast: string
  job: string
  jobPay: number
  best: number
  stalled: boolean
  paused: boolean
}

type Held = {
  left: boolean
  right: boolean
  brake: boolean
  honk: boolean
}

type Job = {
  rider: string
  destId: string
  destIndex: number
  destName: string
  pay: number
}

type Hooks = {
  onHud: (hud: Hud) => void
}

export function createGame(canvas: HTMLCanvasElement, hooks: Hooks) {
  const track = buildTrack()
  const { segments } = track
  let position = SEGMENT_LENGTH * 8
  let speed = MAX_SPEED * 0.42
  let lane = 1
  let laneWait = 0
  let playerX = RIGHT_LANES[1]
  let lives = 3
  let fare = 0
  let best = readBest()
  let phase: Hud['phase'] = 'title'
  let invuln = 0
  let shake = 0
  let banner = ''
  let bannerLine = ''
  let bannerUntil = 0
  let toast = ''
  let toastUntil = 0
  let radioIndex = 0
  let radioAt = 0
  let lastDistrict = 0
  let honkLock = 0
  let clock = 0
  let hudTimer = 0
  let paused = false
  let running = true
  let raf = 0
  let last = performance.now()
  let steer: 'left' | 'right' | 'none' = 'none'
  let job: Job | null = null
  let audioCtx: AudioContext | null = null

  const held: Held = { left: false, right: false, brake: false, honk: false }
  const keys: Held = { left: false, right: false, brake: false, honk: false }

  const onKeyDown = (event: KeyboardEvent) => {
    if (mapKey(event.key, true)) event.preventDefault()
  }
  const onKeyUp = (event: KeyboardEvent) => {
    if (mapKey(event.key, false)) event.preventDefault()
  }
  const onBlur = () => {
    keys.left = keys.right = keys.brake = keys.honk = false
    steer = 'none'
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const width = canvas.clientWidth || 1
    const height = canvas.clientHeight || 1
    canvas.width = Math.max(1, Math.floor(width * dpr))
    canvas.height = Math.max(1, Math.floor(height * dpr))
  }
  resize()
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)

  function nudgeLane(dir: -1 | 1) {
    if (phase !== 'drive' || laneWait > 0) return
    const next = lane + dir
    if (next < 0 || next >= RIGHT_LANES.length) return
    lane = next
    laneWait = 0.16
  }

  function releaseDrive() {
    held.left = held.right = held.brake = held.honk = false
    keys.left = keys.right = keys.brake = keys.honk = false
    steer = 'none'
  }

  function togglePause() {
    if (phase !== 'drive') return
    paused = !paused
    if (paused) releaseDrive()
    emit(true)
  }

  function mapKey(key: string, down: boolean) {
    if (down && (key === 'Escape' || key === 'p' || key === 'P')) {
      if (phase === 'drive') togglePause()
      return true
    }
    if (paused) return isDriveKey(key)
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      keys.left = down
      if (down) nudgeLane(-1)
      return true
    }
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      keys.right = down
      if (down) nudgeLane(1)
      return true
    }
    if (key === 'ArrowDown' || key === 's' || key === 'S') {
      keys.brake = down
      return true
    }
    if (key === ' ' || key === 'h' || key === 'H') {
      keys.honk = down
      return true
    }
    if ((key === 'Enter' || key === 'ArrowUp' || key === 'w' || key === 'W') && down) {
      if (phase !== 'drive') startShift()
      return true
    }
    return false
  }

  function input(): Held {
    return {
      left: held.left || keys.left || steer === 'left',
      right: held.right || keys.right || steer === 'right',
      brake: held.brake || keys.brake,
      honk: held.honk || keys.honk,
    }
  }

  function startShift() {
    position = 0
    speed = MAX_SPEED * 0.55
    lane = 1
    laneWait = 0
    playerX = RIGHT_LANES[1]
    lives = 3
    fare = 0
    job = null
    invuln = 0
    shake = 0
    lastDistrict = 0
    radioIndex = 0
    radioAt = clock
    steer = 'none'
    paused = false
    resetSprites(segments)
    phase = 'drive'
    const first = DISTRICTS[0]
    banner = first.name
    bannerLine = first.subtitle
    bannerUntil = clock + 2.6
    toast = 'Pull into the right-hand stop to pick a passenger.'
    toastUntil = clock + 3.2
    emit(true)
  }

  function finish(kind: 'over' | 'win') {
    phase = kind
    paused = false
    if (kind === 'win') fare += 3000
    if (fare > best) {
      best = fare
      try {
        localStorage.setItem(BEST_KEY, String(best))
      } catch {
        // private mode
      }
    }
    emit(true)
  }

  function update(dt: number) {
    if (paused) return
    clock += dt
    invuln = Math.max(0, invuln - dt)
    honkLock = Math.max(0, honkLock - dt)
    shake *= Math.pow(0.02, dt)

    if (phase === 'title') {
      speed = MAX_SPEED * 0.38
      position += speed * dt
      if (position > track.length - SEGMENT_LENGTH * 30) position = SEGMENT_LENGTH * 8
      lane = 1
      playerX = RIGHT_LANES[1]
      return
    }

    if (phase !== 'drive') return

    const drive = input()
    if (drive.honk) honk()

    const segment = findSegment(segments, position)
    const grade = (segment.p2.world.y - segment.p1.world.y) / SEGMENT_LENGTH

    speed += ACCEL * dt
    speed -= COAST * dt
    if (drive.brake) speed -= BRAKE * dt
    speed -= grade * CLIMB * dt

    if (Math.abs(playerX) > 1) speed -= 1100 * dt
    if (Math.abs(playerX) > 1.4) speed -= 900 * dt

    if (speed < 120 && grade > 0.18) speed -= 900 * dt
    speed = Math.max(-760, Math.min(MAX_SPEED * 1.12, speed))

    position += speed * dt
    if (position < 0) {
      position = 0
      if (speed < 0) speed = 0
    }

    laneWait = Math.max(0, laneWait - dt)
    if (laneWait <= 0) {
      if (drive.left && !drive.right && lane > 0) {
        lane -= 1
        laneWait = 0.17
      } else if (drive.right && !drive.left && lane < RIGHT_LANES.length - 1) {
        lane += 1
        laneWait = 0.17
      }
    }
    const laneTarget = RIGHT_LANES[lane]
    playerX += (laneTarget - playerX) * Math.min(1, dt * 12)

    const here = findSegment(segments, position)
    if (here.district !== lastDistrict) {
      if (job && here.district > job.destIndex) {
        toast = `${job.rider} say you don pass ${job.destName}.`
        toastUntil = clock + 2.4
        job = null
      }
      lastDistrict = here.district
      fare += 250
      const district = DISTRICTS[here.district]
      banner = district.name
      bannerLine = district.subtitle
      bannerUntil = clock + 2.6
      radioIndex = 0
      radioAt = clock
    }

    collide(here)
    const ahead = segments[here.index + 1]
    if (ahead && ahead.district === here.district) collide(ahead)

    if (phase === 'drive' && here.index >= segments.length - 6) finish('win')
  }

  function collide(segment: Segment) {
    segment.sprites.forEach((sprite) => {
      if (sprite.hit || SCENERY.has(sprite.kind)) return
      const gap = Math.abs(playerX - sprite.offset)
      if (sprite.kind === 'passenger') {
        if (gap < 0.55 || (lane === RIGHT_LANES.length - 1 && gap < 0.9)) pickup(sprite, segment.district)
        return
      }
      if (sprite.kind === 'drop') {
        if (gap < 0.55 || (lane === RIGHT_LANES.length - 1 && gap < 0.9)) completeDrop(sprite)
        return
      }
      if (sprite.kind === 'hawker') {
        if (gap < 0.32) clipHawker()
        sprite.hit = gap < 0.32
        return
      }
      if (sprite.kind === 'pothole') {
        if (gap < 0.26) hitHole()
        sprite.hit = gap < 0.42
        return
      }
      const reach = sprite.kind === 'danfo' ? 0.24 : 0.2
      if (gap > reach) return
      hitVehicle(sprite)
    })
  }

  function pickup(sprite: Sprite, from: number) {
    sprite.hit = true
    const rider = sprite.label || 'Passenger'
    const dest = destinationFrom(from)
    if (job) {
      fare += 200
      toast = `${rider} enter small. Boot still hold ${job.rider}.`
      toastUntil = clock + 2.2
      return
    }
    if (!dest) {
      fare += 500
      toast = `${rider}: ${sprite.line || 'I don reach.'}`
      toastUntil = clock + 2.4
      buzz(12)
      return
    }
    const hop = dest.index - from
    const pay = 650 + hop * 550
    job = { rider, destId: dest.id, destIndex: dest.index, destName: dest.name, pay }
    fare += 300
    toast = `${rider}: ${sprite.line} Drop for ${dest.name}.`
    toastUntil = clock + 3.2
    buzz(12)
  }

  function completeDrop(sprite: Sprite) {
    if (!job || job.destId !== sprite.label) return
    sprite.hit = true
    fare += job.pay
    toast = `${job.rider} don drop for ${job.destName}.`
    toastUntil = clock + 2.4
    buzz(16)
    job = null
  }

  function clipHawker() {
    speed *= 0.78
    shake = Math.max(shake, 4)
    toast = 'Hawker for the lane.'
    toastUntil = clock + 1.2
    buzz(18)
  }

  function hitHole() {
    speed *= 0.7
    shake = Math.max(shake, 6)
    toast = 'Pothole. Ibadan road greet you.'
    toastUntil = clock + 1.4
    buzz(24)
  }

  function hitVehicle(sprite: Sprite) {
    sprite.hit = true
    if (invuln > 0) return
    lives -= 1
    speed *= 0.42
    invuln = 1.35
    shake = 14
    toast =
      sprite.kind === 'keke' ? 'Keke don tap you.' : sprite.kind === 'danfo' ? 'Danfo don brush you.' : 'Okada cut across.'
    toastUntil = clock + 1.6
    buzz(70)
    if (lives <= 0) finish('over')
  }

  function horn() {
    try {
      const ctx = audioCtx || new AudioContext()
      audioCtx = ctx
      void ctx.resume()
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(466, now)
      osc.frequency.linearRampToValueAtTime(349, now + 0.16)
      gain.gain.setValueAtTime(0.03, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.2)
    } catch {
      // autoplay or missing audio
    }
  }

  function honk() {
    if (honkLock > 0 || phase !== 'drive') return
    honkLock = 1.15
    toast = 'Peep peep!'
    toastUntil = clock + 0.7
    horn()
    const segment = findSegment(segments, position)
    for (let i = 0; i < 5; i++) {
      const next = segments[segment.index + i]
      if (!next) continue
      next.sprites.forEach((sprite) => {
        if (sprite.kind !== 'keke' && sprite.kind !== 'okada' && sprite.kind !== 'danfo' && sprite.kind !== 'hawker') {
          return
        }
        if (Math.abs(sprite.offset - playerX) > 0.85) return
        const shove = sprite.kind === 'danfo' ? 0.4 : sprite.kind === 'hawker' ? 1.05 : 0.9
        sprite.offset += sprite.offset >= playerX ? shove : -shove
      })
    }
  }

  function render() {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const width = canvas.width / dpr
    const height = canvas.height / dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    const base = findSegment(segments, position)
    const district = DISTRICTS[base.district]
    const skyTop = district.skyTop
    const skyBottom = district.skyBottom
    const drive = input()

    ctx.save()
    if (shake > 0.4) {
      ctx.translate(Math.sin(clock * 48) * shake, Math.cos(clock * 41) * shake * 0.4)
    }

    const focus = RIGHT_LANES[1]
    drawBackdrop(ctx, width, height, playerX - focus, skyTop, skyBottom, district.grass, district.haze)

    const basePercent = (position % SEGMENT_LENGTH) / SEGMENT_LENGTH
    const playerY = lerp(base.p1.world.y, base.p2.world.y, basePercent)
    let x = 0
    let dx = -(base.curve * basePercent)
    let maxY = height
    const drawDistance = Math.min(DRAW_DISTANCE, width < 520 ? 96 : DRAW_DISTANCE)
    const jobId = job?.destId ?? ''

    for (let n = 0; n < drawDistance; n++) {
      const index = base.index + n
      if (index >= segments.length) break
      const segment = segments[index]
      segment.clipY = maxY
      const camZ = position
      project(segment.p1, focus * ROAD_WIDTH - x, playerY + CAMERA_HEIGHT, camZ, width, height)
      project(segment.p2, focus * ROAD_WIDTH - x - dx, playerY + CAMERA_HEIGHT, camZ, width, height)
      x += dx
      dx += segment.curve

      const fog = n / drawDistance
      if (
        segment.p1.camera.z <= CAMERA_DEPTH ||
        segment.p2.screen.y >= segment.p1.screen.y ||
        segment.p2.screen.y >= maxY
      ) {
        continue
      }

      drawSegment(
        ctx,
        width,
        segment.p1.screen.x,
        segment.p1.screen.y,
        segment.p1.screen.w,
        segment.p2.screen.x,
        segment.p2.screen.y,
        segment.p2.screen.w,
        mixHex(segment.grass, skyBottom, fog * fog * 0.9),
        mixHex(segment.road, skyBottom, fog * fog * 0.75),
        mixHex(segment.rumble, skyBottom, fog * fog * 0.8),
        mixHex(segment.lane, skyBottom, fog),
        segment.index % 6 < 3,
        segment.rumbleWidth,
        mixHex(segment.edge, skyBottom, fog),
      )
      maxY = segment.p1.screen.y
    }

    for (let n = drawDistance - 1; n > 0; n--) {
      const index = base.index + n
      if (index >= segments.length) continue
      const segment = segments[index]
      const anchor = segment.p1.camera.z > 1 ? segment.p1 : segment.p2
      if (anchor.camera.z <= 1 || anchor.screen.scale <= 0) continue
      segment.sprites.forEach((sprite) => {
        if (sprite.hit && (sprite.kind === 'passenger' || sprite.kind === 'pothole' || sprite.kind === 'hawker' || sprite.kind === 'drop')) {
          return
        }
        const groundY = anchor.screen.y
        if (groundY < segment.clipY - 8) return
        if (sprite.kind === 'gantry') {
          drawGantry(ctx, anchor.screen.x, groundY, anchor.screen.w, sprite.label || '', width)
          return
        }
        const destX = anchor.screen.x + sprite.offset * anchor.screen.w
        const destH = spriteHeight(sprite.kind) * anchor.screen.w
        drawSprite(ctx, sprite, destX, groundY, destH, sprite.kind === 'drop' && sprite.label === jobId)
      })
    }

    if (phase === 'drive' && invuln > 0 && Math.floor(clock * 12) % 2 === 0) {
      ctx.restore()
      return
    }

    const pose: CarPose = {
      brake: drive.brake,
      reverse: speed < 0,
      spin: clock * Math.max(0, speed) * 0.004,
      bob: Math.sin(clock * 14) * (Math.max(0, speed) / MAX_SPEED) * 2,
    }
    const inset = controlInset(height)
    const foot = height - inset
    const half = roadHalfAt(foot, width, height)
    const laneGap = RIGHT_LANES[1] - RIGHT_LANES[0]
    const lean = Math.max(-0.1, Math.min(0.1, (RIGHT_LANES[lane] - playerX) * 0.45))
    const carX = width / 2 + (playerX - focus) * half
    drawPlayer(ctx, carX, foot, lean, laneGap * half, pose)
    ctx.restore()
  }

  function emit(force = false) {
    hudTimer += force ? 1 : 0
    if (!force && hudTimer < 0.1) return
    hudTimer = 0
    hooks.onHud(buildHud())
  }

  function buildHud(): Hud {
    const segment = findSegment(segments, position)
    const district = DISTRICTS[segment.district]
    if (clock - radioAt > 4.5) {
      radioAt = clock
      radioIndex = (radioIndex + 1) % district.radio.length
    }
    return {
      phase,
      district: district.name,
      street: district.street,
      address: district.address,
      subtitle: district.subtitle,
      radio: district.radio[radioIndex] || district.radio[0],
      fare,
      lives,
      speed,
      maxSpeed: MAX_SPEED,
      progress: position / track.length,
      districtIndex: segment.district,
      districtCount: DISTRICTS.length,
      banner: clock < bannerUntil ? banner : '',
      bannerSub: clock < bannerUntil ? bannerLine : '',
      toast: clock < toastUntil ? toast : '',
      job: job ? `${job.rider} · ${job.destName}` : '',
      jobPay: job?.pay ?? 0,
      best,
      stalled: phase === 'drive' && speed < 0,
      paused,
    }
  }

  function frame(now: number) {
    if (!running) return
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (!paused) {
      hudTimer += dt
      update(dt)
      emit(false)
    }
    render()
    raf = requestAnimationFrame(frame)
  }

  emit(true)
  raf = requestAnimationFrame(frame)

  if (import.meta.env.DEV) {
    ;(window as unknown as { __sevenHills?: { skipToEnd: () => void } }).__sevenHills = {
      skipToEnd() {
        if (phase !== 'drive') startShift()
        position = track.length - SEGMENT_LENGTH * 30
        speed = MAX_SPEED
        lane = 1
        playerX = RIGHT_LANES[1]
        lives = Math.max(lives, 1)
      },
    }
  }

  return {
    startShift,
    togglePause,
    setHeld(control: keyof Held, down: boolean) {
      if (paused) {
        held[control] = false
        return
      }
      held[control] = down
      if (down && control === 'left') nudgeLane(-1)
      if (down && control === 'right') nudgeLane(1)
      if (control === 'honk' && down) honk()
    },
    setSteer(side: 'left' | 'right' | 'none') {
      steer = paused ? 'none' : side
    },
    destroy() {
      running = false
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      void audioCtx?.close()
    },
  }
}

function isDriveKey(key: string) {
  return (
    key === 'ArrowLeft' ||
    key === 'ArrowRight' ||
    key === 'ArrowDown' ||
    key === 'ArrowUp' ||
    key === 'a' ||
    key === 'A' ||
    key === 'd' ||
    key === 'D' ||
    key === 's' ||
    key === 'S' ||
    key === 'w' ||
    key === 'W' ||
    key === ' ' ||
    key === 'h' ||
    key === 'H' ||
    key === 'Enter'
  )
}

function destinationFrom(from: number) {
  const room = DISTRICTS.length - 1 - from
  if (room <= 0) return null
  const hop = room === 1 || Math.random() > 0.55 ? 1 : 2
  const index = from + hop
  const dest = DISTRICTS[index]
  return { id: dest.id, index, name: dest.name }
}

function project(
  point: Segment['p1'],
  cameraX: number,
  cameraY: number,
  cameraZ: number,
  width: number,
  height: number,
) {
  const camX = -cameraX
  const camY = point.world.y - cameraY
  const camZ = point.world.z - cameraZ
  point.camera.x = camX
  point.camera.y = camY
  point.camera.z = camZ
  if (camZ <= 0) {
    point.screen.scale = 0
    return
  }
  const scale = CAMERA_DEPTH / camZ
  point.screen.scale = scale
  point.screen.x = Math.round(width / 2 + (scale * camX * width) / 2)
  point.screen.y = Math.round(height / 2 - (scale * camY * height) / 2)
  point.screen.w = Math.round((scale * ROAD_WIDTH * width) / 2)
}

function spriteHeight(kind: SpriteKind) {
  if (kind === 'cocoa') return 1.25
  if (kind === 'tower') return 1.05
  if (kind === 'mapo' || kind === 'premier' || kind === 'terminal') return 0.92
  if (kind === 'danfo') return 0.72
  if (kind === 'pothole') return 0.22
  if (kind === 'passenger' || kind === 'hawker') return 0.88
  if (kind === 'bay') return 0.84
  if (kind === 'gantry') return 0.7
  if (kind === 'sign' || kind === 'drop' || kind === 'kiosk') return 0.74
  if (kind === 'keke') return 0.56
  return 0.62
}

function roadHalfAt(y: number, width: number, height: number) {
  const rise = y - height / 2
  if (rise <= 4) return width * 0.25
  return ((ROAD_WIDTH / CAMERA_HEIGHT) * width * rise) / height
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function readBest() {
  try {
    const raw = Number(localStorage.getItem(BEST_KEY) || 0)
    return Number.isFinite(raw) ? raw : 0
  } catch {
    return 0
  }
}

function controlInset(height: number) {
  const coarse = window.matchMedia('(max-width: 800px), (pointer: coarse)').matches
  if (!coarse) return 28
  return Math.min(200, Math.max(158, height * 0.22))
}

function buzz(ms: number) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    // no haptics
  }
}
