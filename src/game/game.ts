import { DISTRICTS, type SpriteKind, type TrafficKind } from './districts'
import { drawBackdrop, drawBoostVibe, drawGantry, drawPlayer, drawSegment, drawSprite, drawTrainCar, drawVehicle, drawWalker, mixHex, type CarPose, type Walker } from './draw'
import { FOCUS_X, HOME_LANE, LANES, MAX_RIDERS, WAIT_LANE, clampLane, type LaneIndex } from './lanes'
import { SEGMENT_LENGTH, SPAWN_DISTANCE, appendLap, buildTrack, findSegment, resetSprites, type Segment, type Sprite } from './track'
import { VEHICLE_LENGTH, VEHICLE_WIDTH, createTraffic, isMoving, type Vehicle } from './traffic'

const ROAD_WIDTH = 1680
const CAMERA_DEPTH = 0.82
const CAMERA_HEIGHT = 2400
/** Horizon as a share of screen height. Lower numbers show more road. */
const HORIZON = 0.28
/** How much the camera follows you across the four lanes. */
const CAMERA_FOLLOW = 0.28
const DRAW_DISTANCE = 180
const MAX_SPEED = 6400
const BOOST_SPEED = 12000
const ACCEL = 1900
const BOOST_PUSH = 6400
const BRAKE = 3200
const COAST = 260
const CLIMB = 3200
const BOOST_MAX = 100
const BOOST_DRAIN = 28
const BOOST_PICKUP = 40
const COIN_PAY = 80
const PLAYER_WIDTH = 0.28
const PLAYER_LENGTH = 380
const LANE_SNAP = 14
const UNITS_PER_METRE = SEGMENT_LENGTH / 5
const OVERTAKE_PAY = 100
const BEST_KEY = 'seven-hills-fare'
/** Toward the Micra. Closing speed puts the whole set past you in a couple of seconds. */
const TRAIN_SPEED = -11000
const TRAIN_CARS = 14
const TRAIN_LEN = 1600
const TRAIN_GAP = 220
const TRAIN_PITCH = TRAIN_LEN + TRAIN_GAP

const STATIC_KINDS = new Set<SpriteKind>(['passenger', 'drop', 'coin', 'boost'])

export interface AheadMark {
  id: number
  kind: TrafficKind
  lane: LaneIndex
  metres: number
  share: number
  oncoming: boolean
  parked: boolean
}

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
  coins: number
  boost: number
  boosting: boolean
  lap: number
  kmh: number
  lane: LaneIndex
  ahead: AheadMark[]
  warning: string
  windowMetres: number
  riders: { name: string; dest: string }[]
  seats: number
  waiting: boolean
}

type Held = {
  left: boolean
  right: boolean
  brake: boolean
  honk: boolean
  boost: boolean
}

type Job = {
  rider: string
  destId: string
  destIndex: number
  destVisit: number
  destName: string
  pay: number
}

type Hooks = {
  onHud: (hud: Hud) => void
}

export function createGame(canvas: HTMLCanvasElement, hooks: Hooks) {
  const track = buildTrack()
  const { segments } = track
  const traffic = createTraffic(track.timeline)
  const trainHeads: number[] = []
  let position = SEGMENT_LENGTH * 8
  let speed = MAX_SPEED * 0.42
  let lane: LaneIndex = HOME_LANE
  let playerX = LANES[HOME_LANE]
  let cameraX = FOCUS_X
  let carAhead = 1100
  let coarse = false
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
  let riders: Job[] = []
  const walkers: Walker[] = []
  let audioCtx: AudioContext | null = null
  let owaLock = 0
  let coins = 0
  let boostEnergy = BOOST_MAX
  let boosting = false
  let boostNag = 0
  let vibeClock = 0
  let chimeLock = 0
  let boostOsc: OscillatorNode | null = null
  let boostGain: GainNode | null = null

  const held: Held = { left: false, right: false, brake: false, honk: false, boost: false }
  const keys: Held = { left: false, right: false, brake: false, honk: false, boost: false }
  const boostKeys = new Set<string>()

  const onKeyDown = (event: KeyboardEvent) => {
    if (mapKey(event.key, true)) event.preventDefault()
  }
  const onKeyUp = (event: KeyboardEvent) => {
    if (mapKey(event.key, false)) event.preventDefault()
  }
  const onBlur = () => {
    keys.left = keys.right = keys.brake = keys.honk = keys.boost = false
    boostKeys.clear()
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
    coarse = window.matchMedia('(max-width: 800px), (pointer: coarse)').matches
  }
  resize()
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)

  function view() {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const width = canvas.width / dpr
    const height = canvas.height / dpr
    const horizon = height * HORIZON
    const inset = coarse ? Math.min(180, Math.max(132, height * 0.18)) : 24
    const foot = Math.max(horizon + 60, height - inset)
    const ahead = (CAMERA_DEPTH * CAMERA_HEIGHT * height) / (2 * (foot - horizon))
    return { dpr, width, height, horizon, foot, ahead }
  }

  function moveTo(next: LaneIndex) {
    if (phase !== 'drive' || paused) return
    lane = next
  }

  function releaseDrive() {
    held.left = held.right = held.brake = held.honk = held.boost = false
    keys.left = keys.right = keys.brake = keys.honk = keys.boost = false
    boostKeys.clear()
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
      if (down) moveTo(clampLane(lane - 1))
      return true
    }
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      keys.right = down
      if (down) moveTo(clampLane(lane + 1))
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
    if (key === 'o' || key === 'O') {
      if (down) owa()
      return true
    }
    if (key === 'Shift') {
      pressBoost(key, down)
      return true
    }
    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      if (phase === 'drive') {
        pressBoost(key, down)
        return true
      }
      if (down) startShift()
      return true
    }
    if (key === 'Enter' && down) {
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
      boost: held.boost || keys.boost,
    }
  }

  function startShift() {
    position = 0
    speed = MAX_SPEED * 0.55
    lane = HOME_LANE
    playerX = LANES[HOME_LANE]
    cameraX = FOCUS_X
    lives = 3
    fare = 0
    coins = 0
    boostEnergy = BOOST_MAX
    boosting = false
    setBoostHum(false)
    job = null
    riders = []
    walkers.length = 0
    invuln = 0
    shake = 0
    lastDistrict = 0
    radioIndex = 0
    radioAt = clock
    steer = 'none'
    paused = false
    resetSprites(segments)
    traffic.reset(position + carAhead)
    phase = 'drive'
    say('Tap Boost once. It dey run, you dey dodge. The road no dey end.', 3.8)
    emit(true)
  }

  function finish(kind: 'over' | 'win') {
    phase = kind
    paused = false
    boosting = false
    setBoostHum(false)
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

  function say(text: string, seconds: number) {
    toast = text
    toastUntil = clock + seconds
  }

  function roadY(z: number) {
    const segment = findSegment(segments, z)
    const t = Math.max(0, Math.min(1, (z - segment.p1.world.z) / SEGMENT_LENGTH))
    return lerp(segment.p1.world.y, segment.p2.world.y, t)
  }

  function update(dt: number) {
    if (paused) return
    clock += dt
    updateTrains(dt)
    invuln = Math.max(0, invuln - dt)
    honkLock = Math.max(0, honkLock - dt)
    shake *= Math.pow(0.02, dt)

    if (phase === 'title') {
      speed = MAX_SPEED * 0.38
      position += speed * dt
      if (position > track.lapLength - SEGMENT_LENGTH * 40) {
        position = SEGMENT_LENGTH * 8
        traffic.reset(position + carAhead)
      }
      lane = HOME_LANE
      playerX = LANES[HOME_LANE]
      cameraX = FOCUS_X
      traffic.update(dt, position + carAhead)
      return
    }

    if (phase !== 'drive') return

    const drive = input()
    if (drive.honk) honk()
    owaLock = Math.max(0, owaLock - dt)
    for (let i = walkers.length - 1; i >= 0; i--) {
      const walker = walkers[i]
      walker.t += dt * 1.35
      const goal = walker.kind === 'in' ? playerX : LANES[WAIT_LANE] + 0.28
      walker.offset += (goal - walker.offset) * Math.min(1, dt * 7)
      walker.z = position + carAhead + (walker.kind === 'out' ? 90 : 24)
      if (walker.t >= 1) walkers.splice(i, 1)
    }

    chimeLock = Math.max(0, chimeLock - dt)
    ensureRoad()

    const carZ = position + carAhead
    const segment = findSegment(segments, carZ)
    const grade = (segment.p2.world.y - segment.p1.world.y) / SEGMENT_LENGTH

    if (boosting) {
      speed += BOOST_PUSH * dt
      boostEnergy = Math.max(0, boostEnergy - BOOST_DRAIN * dt)
      shake = Math.max(shake, 2.6)
      vibeBoost()
      setBoostHum(true)
      if (boostEnergy <= 0) {
        boosting = false
        setBoostHum(false)
        say('Boost don finish. Grab the bolt.', 1.5)
      }
    } else {
      setBoostHum(false)
    }

    speed += ACCEL * dt
    speed -= COAST * dt
    if (drive.brake) speed -= BRAKE * dt
    speed -= grade * CLIMB * (boosting ? 0.18 : 1) * dt
    if (speed < 120 && grade > 0.18 && !boosting) speed -= 900 * dt
    speed = Math.max(-760, Math.min(boosting ? BOOST_SPEED : MAX_SPEED, speed))

    const beforeZ = position + carAhead
    position += speed * dt
    if (position < 0) {
      position = 0
      if (speed < 0) speed = 0
    }
    ensureRoad()

    playerX += (LANES[lane] - playerX) * Math.min(1, dt * LANE_SNAP)
    const focus = FOCUS_X + (playerX - FOCUS_X) * CAMERA_FOLLOW
    cameraX += (focus - cameraX) * Math.min(1, dt * 6)

    const nowZ = position + carAhead
    traffic.update(dt, nowZ)

    const here = findSegment(segments, nowZ)
    if (here.district !== lastDistrict) {
      lastDistrict = here.district
      fare += 250
      radioIndex = 0
      radioAt = clock
      if (here.district === 0 && here.visit > 0) say(`Lap ${Math.floor(here.visit / DISTRICTS.length) + 1}. Ibadan no finish.`, 2.4)
      const waitingDrop = riders.filter((rider) => rider.destVisit === here.visit)
      if (waitingDrop.length) say(`${waitingDrop[0].rider} wan drop. Shout owa.`, 2.6)
    }

    collideStops(here)
    const next = segments[here.index + 1]
    if (next) collideStops(next)
    collectPickups(beforeZ, nowZ)
    collideTraffic(nowZ)
  }

  function pressBoost(key: string, down: boolean) {
    if (down) {
      if (boostKeys.has(key)) return
      boostKeys.add(key)
      armBoost()
      return
    }
    boostKeys.delete(key)
  }

  function armBoost() {
    if (phase !== 'drive' || paused || boosting) return
    if (boostEnergy <= 0) {
      if (clock > boostNag) {
        boostNag = clock + 2.2
        say('Boost empty. Pick the bolt on the road.', 1.5)
      }
      return
    }
    boosting = true
    say('Boost! Dodge the road.', 0.9)
  }

  function ensureRoad() {
    const need = position + carAhead + SEGMENT_LENGTH * 700
    while (track.length < need) appendLap(track)
  }

  function collectPickups(fromZ: number, toZ: number) {
    const start = Math.max(0, Math.floor(Math.min(fromZ, toZ) / SEGMENT_LENGTH))
    const end = Math.min(segments.length - 1, Math.floor(Math.max(fromZ, toZ) / SEGMENT_LENGTH))
    for (let i = start; i <= end; i++) {
      const segment = segments[i]
      for (const sprite of segment.sprites) {
        if (sprite.hit) continue
        if (Math.abs(sprite.offset - playerX) > 0.2) continue
        if (sprite.kind === 'coin') {
          sprite.hit = true
          coins += 1
          fare += COIN_PAY
          coinChime()
        } else if (sprite.kind === 'boost') {
          sprite.hit = true
          boostEnergy = Math.min(BOOST_MAX, boostEnergy + BOOST_PICKUP)
          boostChime()
        }
      }
    }
  }

  function inWaitLane() {
    return lane === WAIT_LANE && Math.abs(playerX - LANES[WAIT_LANE]) < 0.22
  }

  function collideStops(segment: Segment) {
    segment.sprites.forEach((sprite) => {
      if (sprite.hit || sprite.kind !== 'passenger' || !inWaitLane() || speed > 1100) return
      pickup(sprite, segment.visit)
    })
  }

  function collideTraffic(carZ: number) {
    for (const vehicle of traffic.live) {
      if (vehicle.hit) continue
      const dz = vehicle.z - carZ
      const reach = (VEHICLE_LENGTH[vehicle.kind] + PLAYER_LENGTH) / 2
      if (dz < -reach) {
        if (!vehicle.passed && vehicle.cruise >= 0 && isMoving(vehicle)) {
          vehicle.passed = true
          fare += OVERTAKE_PAY
          if (clock > toastUntil) say(`Clean overtake. +₦${OVERTAKE_PAY}`, 1)
        }
        continue
      }
      if (dz > reach) continue
      const room = ((VEHICLE_WIDTH[vehicle.kind] + PLAYER_WIDTH) / 2) * 0.86
      if (Math.abs(vehicle.offset - playerX) > room) continue
      if (vehicle.kind === 'pothole') hitHole(vehicle)
      else hitVehicle(vehicle)
    }
  }

  function pickup(sprite: Sprite, fromVisit: number) {
    if (riders.length >= MAX_RIDERS) {
      if (clock > toastUntil) say('Boot don full. Owa first.', 1.6)
      return
    }
    sprite.hit = true
    const rider = sprite.label || 'Passenger'
    const dest = destinationFrom(fromVisit)
    walkers.push({
      kind: 'in',
      offset: sprite.offset,
      z: position + carAhead,
      t: 0,
      shirt: riders.length,
    })
    const hop = dest.visit - fromVisit
    const pay = 650 + hop * 550
    const seat: Job = {
      rider,
      destId: dest.id,
      destIndex: dest.index,
      destVisit: dest.visit,
      destName: dest.name,
      pay,
    }
    riders.push(seat)
    job = riders[0]
    fare += 200
    say(`${rider} enter. ${riders.length} of ${MAX_RIDERS}. Drop for ${dest.name}. Owa when you reach.`, 2.8)
    buzz(12)
  }

  function owa() {
    if (phase !== 'drive' || paused || owaLock > 0) return
    owaLock = 0.45
    if (riders.length === 0) {
      say('Nobody for inside. Pull yellow lane make dem enter.', 1.8)
      return
    }
    const here = findSegment(segments, position + carAhead).visit
    let leaving = riders.filter((rider) => rider.destVisit <= here)
    if (leaving.length === 0) leaving = [riders[0]]
    leaving.forEach((rider) => {
      riders = riders.filter((seat) => seat !== rider)
      fare += rider.pay
      walkers.push({
        kind: 'out',
        offset: playerX,
        z: position + carAhead + 40,
        t: 0,
        shirt: walkers.length,
      })
    })
    job = riders[0] ?? null
    const names = leaving.map((rider) => rider.rider).join(', ')
    say(`Owa! ${names} don drop${leaving.length > 1 ? '' : ` for ${leaving[0].destName}`}.`, 2.4)
    buzz(16)
  }

  function hitHole(vehicle: Vehicle) {
    vehicle.hit = true
    speed *= 0.7
    shake = Math.max(shake, 6)
    say('Pothole. Ibadan road greet you.', 1.4)
    buzz(24)
  }

  function hitVehicle(vehicle: Vehicle) {
    vehicle.hit = true
    if (invuln > 0) return
    lives -= 1
    speed = vehicle.cruise < 0 ? speed * 0.3 : Math.max(0, Math.min(speed, vehicle.speed) * 0.7)
    invuln = 1.4
    shake = 14
    const name = vehicleName(vehicle.kind)
    say(vehicle.cruise < 0 ? `Head-on with a ${name}. Stay for your lane.` : `You jam the ${name} from behind.`, 1.8)
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
    horn()
    const moved = traffic.honk(position + carAhead, playerX)
    say(moved > 0 ? 'Peep peep! Dem don give way.' : 'Peep peep!', 0.8)
  }

  function setBoostHum(on: boolean) {
    try {
      if (!on) {
        if (!boostOsc || !audioCtx) {
          boostOsc = null
          boostGain = null
          return
        }
        const now = audioCtx.currentTime
        boostGain?.gain.cancelScheduledValues(now)
        boostGain?.gain.setValueAtTime(Math.max(0.0001, boostGain.gain.value), now)
        boostGain?.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)
        boostOsc.stop(now + 0.1)
        boostOsc = null
        boostGain = null
        return
      }
      const ctx = audioCtx || new AudioContext()
      audioCtx = ctx
      void ctx.resume()
      if (!boostOsc) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.value = 80
        gain.gain.value = 0.02
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        boostOsc = osc
        boostGain = gain
      }
      boostOsc.frequency.value = 72 + (Math.max(0, speed) / BOOST_SPEED) * 110
    } catch {
      boostOsc = null
      boostGain = null
    }
  }

  function vibeBoost() {
    if (clock < vibeClock) return
    vibeClock = clock + 0.12
    buzz(18)
  }

  function coinChime() {
    if (chimeLock > 0) return
    chimeLock = 0.06
    try {
      const ctx = audioCtx || new AudioContext()
      audioCtx = ctx
      void ctx.resume()
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(740, now)
      osc.frequency.linearRampToValueAtTime(1180, now + 0.08)
      gain.gain.setValueAtTime(0.035, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.14)
    } catch {
      // autoplay or missing audio
    }
  }

  function boostChime() {
    if (chimeLock > 0) return
    chimeLock = 0.08
    try {
      const ctx = audioCtx || new AudioContext()
      audioCtx = ctx
      void ctx.resume()
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.linearRampToValueAtTime(660, now + 0.1)
      gain.gain.setValueAtTime(0.028, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.18)
    } catch {
      // autoplay or missing audio
    }
  }

  function updateTrains(dt: number) {
    const rails = track.rails
    while (trainHeads.length < rails.length) {
      const run = rails[trainHeads.length]
      const span = TRAIN_CARS * TRAIN_PITCH
      trainHeads.push(Math.min(run.z1, run.z0 + span + SEGMENT_LENGTH * 30))
    }
    for (let i = 0; i < rails.length; i++) {
      trainHeads[i] += TRAIN_SPEED * dt
      if (trainHeads[i] + TRAIN_CARS * TRAIN_PITCH < rails[i].z0) trainHeads[i] = rails[i].z1
    }
  }

  function roadPoint(z: number) {
    const index = Math.max(0, Math.min(segments.length - 1, Math.floor(z / SEGMENT_LENGTH)))
    const seg = segments[index]
    if (seg.p1.camera.z <= CAMERA_DEPTH) return null
    const t = Math.max(0, Math.min(1, (z - seg.p1.world.z) / SEGMENT_LENGTH))
    const w = lerp(seg.p1.screen.w, seg.p2.screen.w, t)
    if (w < 2) return null
    return {
      x: lerp(seg.p1.screen.x, seg.p2.screen.x, t),
      y: lerp(seg.p1.screen.y, seg.p2.screen.y, t),
      w,
    }
  }

  function render() {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const v = view()
    const { width, height, horizon } = v
    carAhead = v.ahead
    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    const carZ = position + carAhead
    const base = findSegment(segments, position)
    const district = DISTRICTS[findSegment(segments, carZ).district]
    const skyBottom = district.skyBottom
    const drive = input()

    ctx.save()
    if (shake > 0.4) {
      ctx.translate(Math.sin(clock * 48) * shake, Math.cos(clock * 41) * shake * 0.4)
    }

    drawBackdrop(
      ctx,
      width,
      height,
      horizon,
      cameraX - FOCUS_X,
      clock,
      district.skyTop,
      skyBottom,
      district.grass,
      district.haze,
    )

    const camY = roadY(carZ) + CAMERA_HEIGHT
    const camX = cameraX * ROAD_WIDTH
    const drawDistance = width < 520 ? 140 : DRAW_DISTANCE
    const lastIndex = Math.min(segments.length - 1, base.index + drawDistance - 1)
    for (let i = base.index; i <= lastIndex; i++) {
      const segment = segments[i]
      project(segment.p1, camX, camY, position, width, height, horizon)
      project(segment.p2, camX, camY, position, width, height, horizon)
    }

    const buckets = new Map<number, Vehicle[]>()
    for (const vehicle of traffic.live) {
      const index = Math.floor(vehicle.z / SEGMENT_LENGTH)
      if (index <= base.index || index > lastIndex) continue
      const list = buckets.get(index)
      if (list) list.push(vehicle)
      else buckets.set(index, [vehicle])
    }

    const trainBuckets = new Map<number, { nearZ: number; farZ: number; slogan: string; role: 'engine' | 'coach' | 'tail' }[]>()
    const viewNear = position + SEGMENT_LENGTH * 2
    const viewFar = segments[lastIndex].p2.world.z
    for (let r = 0; r < track.rails.length; r++) {
      const run = track.rails[r]
      const head = trainHeads[r]
      if (head === undefined || run.z1 < viewNear || run.z0 > viewFar) continue
      for (let c = 0; c < TRAIN_CARS; c++) {
        const nearZ = head + c * TRAIN_PITCH
        const farZ = nearZ + TRAIN_LEN
        const a = Math.max(nearZ, run.z0, viewNear)
        const b = Math.min(farZ, run.z1, viewFar)
        if (b - a < 120) continue
        const role = (c === 0 ? 'engine' : c === TRAIN_CARS - 1 ? 'tail' : 'coach') as 'engine' | 'coach' | 'tail'
        const slogan = run.slogans[c % run.slogans.length] || 'IBADAN'
        const index = Math.max(base.index, Math.min(lastIndex, Math.floor(a / SEGMENT_LENGTH)))
        const bit = { nearZ: a, farZ: b, slogan, role }
        const list = trainBuckets.get(index)
        if (list) list.push(bit)
        else trainBuckets.set(index, [bit])
      }
    }

    const jobId = job?.destId ?? ''
    for (let i = lastIndex; i >= base.index; i--) {
      const segment = segments[i]
      const p1 = segment.p1
      const p2 = segment.p2
      if (p1.camera.z <= CAMERA_DEPTH || p2.screen.y >= p1.screen.y) continue
      const fog = (i - base.index) / drawDistance

      drawSegment(
        ctx,
        width,
        p1.screen.x,
        p1.screen.y,
        p1.screen.w,
        p2.screen.x,
        p2.screen.y,
        p2.screen.w,
        mixHex(segment.grass, skyBottom, fog * fog * 0.9),
        mixHex(segment.road, skyBottom, fog * fog * 0.75),
        mixHex(segment.rumble, skyBottom, fog * fog * 0.8),
        mixHex(segment.lane, skyBottom, fog),
        i % 6 < 3,
        segment.rumbleWidth,
        mixHex(segment.edge, skyBottom, fog),
        segment.rail,
      )

      const here = buckets.get(i)
      if (here) {
        here.sort((a, b) => b.z - a.z)
        for (const vehicle of here) {
          const t = vehicle.z / SEGMENT_LENGTH - i
          const w = lerp(p1.screen.w, p2.screen.w, t)
          const x = lerp(p1.screen.x, p2.screen.x, t) + vehicle.offset * w
          const y = lerp(p1.screen.y, p2.screen.y, t)
          drawVehicle(
            ctx,
            vehicle.kind,
            x,
            y,
            VEHICLE_WIDTH[vehicle.kind] * w,
            vehicle.cruise < 0,
            vehicle.id,
            vehicle.label || '',
            vehicle.hit,
          )
        }
      }

      if (i === base.index || p1.screen.w < 2) continue
      for (const sprite of segment.sprites) {
        if (sprite.hit && STATIC_KINDS.has(sprite.kind)) continue
        if (sprite.kind === 'gantry') {
          drawGantry(ctx, p1.screen.x, p1.screen.y, p1.screen.w, sprite.label || '', width, height)
          continue
        }
        const x = p1.screen.x + sprite.offset * p1.screen.w
        const h = spriteHeight(sprite.kind) * p1.screen.w
        if (x + h < -40 || x - h > width + 40) continue
        drawSprite(ctx, sprite, x, p1.screen.y, h, sprite.kind === 'drop' && sprite.label === jobId)
      }
    }

    const trainCars: { nearZ: number; farZ: number; slogan: string; role: 'engine' | 'coach' | 'tail' }[] = []
    trainBuckets.forEach((list) => trainCars.push(...list))
    trainCars.sort((a, b) => b.nearZ - a.nearZ)
    for (const car of trainCars) {
      const n = roadPoint(car.nearZ)
      const f = roadPoint(car.farZ)
      if (!n || !f) continue
      drawTrainCar(ctx, n, f, car.slogan, car.role)
    }

    if (phase === 'drive' && invuln > 0 && Math.floor(clock * 12) % 2 === 0) {
      ctx.restore()
      return
    }

    const pose: CarPose = {
      brake: drive.brake,
      reverse: speed < 0,
      spin: clock * Math.max(0, speed) * 0.004,
      bob: Math.sin(clock * (boosting ? 28 : 14)) * (Math.max(0, speed) / MAX_SPEED) * (boosting ? 3.2 : 2),
      riders: riders.length,
      boost: boosting,
    }
    const half = (CAMERA_DEPTH / carAhead) * ROAD_WIDTH * (width / 2)
    const lean = Math.max(-0.1, Math.min(0.1, (LANES[lane] - playerX) * 0.22))
    const carX = width / 2 + (playerX - cameraX) * half
    drawPlayer(ctx, carX, v.foot, lean, ((PLAYER_WIDTH * half) / 0.85) * (boosting ? 1.05 : 1), pose)
    if (boosting) drawBoostVibe(ctx, width, height, clock, Math.min(1, Math.max(0, speed) / BOOST_SPEED))

    for (const walker of walkers) {
      const seg = findSegment(segments, walker.z)
      const t = Math.max(0, Math.min(1, (walker.z - seg.p1.world.z) / SEGMENT_LENGTH))
      const w = lerp(seg.p1.screen.w, seg.p2.screen.w, t)
      const x = lerp(seg.p1.screen.x, seg.p2.screen.x, t) + walker.offset * w
      const y = lerp(seg.p1.screen.y, seg.p2.screen.y, t)
      if (w > 4) drawWalker(ctx, x, y, 0.42 * w, walker)
    }
    ctx.restore()
  }

  function emit(force = false) {
    if (!force && hudTimer < 0.08) return
    hudTimer = 0
    hooks.onHud(buildHud())
  }

  function aheadMarks(carZ: number): AheadMark[] {
    const marks: AheadMark[] = []
    for (const vehicle of traffic.live) {
      if (vehicle.hit) continue
      const gap = vehicle.z - carZ
      if (gap < -VEHICLE_LENGTH[vehicle.kind] / 2 || gap > SPAWN_DISTANCE) continue
      if (vehicle.offset > 1.4) continue
      marks.push({
        id: vehicle.id,
        kind: vehicle.kind,
        lane: vehicle.lane,
        metres: Math.max(0, Math.round(gap / UNITS_PER_METRE)),
        share: Math.max(0, Math.min(1, gap / SPAWN_DISTANCE)),
        oncoming: vehicle.oncoming || vehicle.cruise < 0,
        parked: vehicle.cruise === 0,
      })
    }
    return marks.sort((a, b) => a.metres - b.metres).slice(0, 10)
  }

  function warningFor(marks: AheadMark[]) {
    if (phase !== 'drive') return ''
    const block = marks.find((mark) => mark.lane === lane && !mark.oncoming && mark.metres < 70)
    if (block) {
      if (block.kind === 'pothole') return `Pothole ${block.metres} m`
      return lane === WAIT_LANE
        ? `${vehicleName(block.kind)} in the wait lane · ${block.metres} m`
        : `${vehicleName(block.kind)} ahead · ${block.metres} m · slide left`
    }
    if (lane === WAIT_LANE && riders.length < MAX_RIDERS) return 'Yellow lane. Wait small, people go enter.'
    return ''
  }

  function buildHud(): Hud {
    const carZ = position + carAhead
    const segment = findSegment(segments, carZ)
    const district = DISTRICTS[segment.district]
    if (clock - radioAt > 4.5) {
      radioAt = clock
      radioIndex = (radioIndex + 1) % district.radio.length
    }
    const ahead = phase === 'drive' ? aheadMarks(carZ) : []
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
      maxSpeed: BOOST_SPEED,
      progress: position / track.length,
      districtIndex: segment.district,
      districtCount: DISTRICTS.length,
      banner: clock < bannerUntil ? banner : '',
      bannerSub: clock < bannerUntil ? bannerLine : '',
      toast: clock < toastUntil ? toast : '',
      job: riders.length ? riders.map((rider) => `${rider.rider} · ${rider.destName}`).join('  ·  ') : '',
      jobPay: riders.reduce((sum, rider) => sum + rider.pay, 0),
      best,
      stalled: phase === 'drive' && speed < 0,
      paused,
      coins,
      boost: boostEnergy / BOOST_MAX,
      boosting,
      lap: Math.floor(segment.visit / DISTRICTS.length) + 1,
      kmh: Math.max(0, Math.round((speed / UNITS_PER_METRE) * 3.6)),
      lane,
      ahead,
      warning: warningFor(ahead),
      windowMetres: Math.round(SPAWN_DISTANCE / UNITS_PER_METRE),
      riders: riders.map((rider) => ({ name: rider.rider, dest: rider.destName })),
      seats: MAX_RIDERS,
      waiting: phase === 'drive' && inWaitLane(),
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
        position += track.lapLength
        ensureRoad()
        speed = BOOST_SPEED
        lane = HOME_LANE
        playerX = LANES[HOME_LANE]
        traffic.reset(position + carAhead)
        lives = Math.max(lives, 1)
      },
    }
  }

  return {
    startShift,
    togglePause,
    activateBoost: armBoost,
    setHeld(control: keyof Held, down: boolean) {
      if (control === 'boost') {
        if (down) armBoost()
        return
      }
      if (paused) {
        held[control] = false
        return
      }
      held[control] = down
      if (down && control === 'left') moveTo(clampLane(lane - 1))
      if (down && control === 'right') moveTo(clampLane(lane + 1))
      if (control === 'honk' && down) honk()
    },
    setSteer(side: 'left' | 'right' | 'none') {
      if (paused) {
        steer = 'none'
        return
      }
      if (side !== steer && side === 'left') moveTo(clampLane(lane - 1))
      if (side !== steer && side === 'right') moveTo(clampLane(lane + 1))
      steer = side
    },
    owa,
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

export function vehicleName(kind: TrafficKind) {
  if (kind === 'danfo') return 'Danfo'
  if (kind === 'keke') return 'Keke'
  if (kind === 'okada') return 'Okada'
  if (kind === 'truck') return 'Trailer'
  if (kind === 'pothole') return 'Pothole'
  return 'Car'
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
    key === 'o' ||
    key === 'O' ||
    key === 'Enter' ||
    key === 'Shift'
  )
}

function destinationFrom(fromVisit: number) {
  const hop = Math.random() > 0.55 ? 1 : 2
  const visit = fromVisit + hop
  const index = visit % DISTRICTS.length
  const dest = DISTRICTS[index]
  return { id: dest.id, index, visit, name: dest.name }
}

function project(
  point: Segment['p1'],
  cameraX: number,
  cameraY: number,
  cameraZ: number,
  width: number,
  height: number,
  horizon: number,
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
  point.screen.x = width / 2 + (scale * camX * width) / 2
  point.screen.y = horizon - (scale * camY * height) / 2
  point.screen.w = (scale * ROAD_WIDTH * width) / 2
}

function spriteHeight(kind: SpriteKind) {
  if (kind === 'cocoa') return 1.25
  if (kind === 'tower') return 1.05
  if (kind === 'mapo' || kind === 'premier' || kind === 'terminal') return 0.92
  if (kind === 'billboard') return 0.95
  if (kind === 'pylon') return 1.7
  if (kind === 'streetlight') return 0.78
  if (kind === 'coin' || kind === 'boost') return 0.36
  if (kind === 'passenger' || kind === 'hawker') return 0.44
  if (kind === 'stall') return 0.72
  if (kind === 'bay') return 0.84
  if (kind === 'sign' || kind === 'drop' || kind === 'kiosk') return 0.66
  if (kind === 'palm') return 1
  if (kind === 'tree') return 1.05
  if (kind === 'roof') return 0.9
  return 0.62
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

function buzz(ms: number) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    // no haptics
  }
}
