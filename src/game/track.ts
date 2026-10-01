import { DISTRICTS, type District, type SpriteKind, type TrafficKind } from './districts'
import { DRIVE_RIGHT, LANES, ONCOMING_OUTER, STOP_OFFSET, WAIT_LANE, WALK_CENTER, type LaneIndex } from './lanes'

export const SEGMENT_LENGTH = 200
export const RUMBLE = 3
/** How many times longer each district runs. Hills scale with it, so the grade stays the same. */
const AREA_SCALE = 4

/** Speed the timeline is planned around. Slower driving just meets each beat a little later. */
export const PLAN_SPEED = 2900
/** How far ahead of the Micra a vehicle appears, in world units. */
export const SPAWN_DISTANCE = SEGMENT_LENGTH * 160
/** Same-lane vehicles never meet closer than this many segments. */
const LANE_GAP = 16

export interface Sprite {
  kind: SpriteKind
  offset: number
  home: number
  label?: string
  line?: string
  hit: boolean
}

export interface Segment {
  index: number
  district: number
  /** How many districts you have entered since the shift started. Keeps looping drops honest. */
  visit: number
  curve: number
  p1: { world: { y: number; z: number }; camera: Cam; screen: Screen }
  p2: { world: { y: number; z: number }; camera: Cam; screen: Screen }
  sprites: Sprite[]
  grass: string
  road: string
  rumble: string
  lane: string
  edge: string
  rumbleWidth: number
  clipY: number
  rail: boolean
}

/** A stretch where the median boards are a moving train instead. */
export interface RailRun {
  z0: number
  z1: number
  slogans: string[]
}

/**
 * One entry on the traffic timeline. `meetZ` is where you reach the vehicle
 * if you hold cruising speed; `spawnAt` is where your car is when it appears.
 */
export interface TimelineEvent {
  id: number
  kind: TrafficKind
  lane: LaneIndex
  speed: number
  meetZ: number
  startZ: number
  spawnAt: number
  district: number
  label?: string
  oncoming?: boolean
}

interface Cam {
  x: number
  y: number
  z: number
}

interface Screen {
  x: number
  y: number
  w: number
  scale: number
}

const KIOSK_BOARDS = ['GLO', 'POS', 'BUKA', 'PURE WATER', 'PROVISION', 'AMALA', 'SUYA']
const STALL_GOODS = ['PEPPER', 'ASO-OKE', 'PLANTAIN', 'HERBS', 'GARRI', 'CORN', 'ORANGE', 'SUYA', 'YAM', 'WATER']

/** Beat codes used in each district's `timeline` script. */
type Beat = 'O' | 'S' | 'H' | 'L' | 'C' | 'Q' | 'P' | '.'

/** Vehicle speeds as a share of the Micra's top speed. */
const SAME_WAY: Record<TrafficKind, number> = {
  keke: 0.32,
  okada: 0.46,
  danfo: 0.4,
  car: 0.52,
  truck: 0.28,
  pothole: 0,
}
const ONCOMING: Record<TrafficKind, number> = {
  keke: 0.3,
  okada: 0.44,
  danfo: 0.42,
  car: 0.5,
  truck: 0.34,
  pothole: 0,
}
const MAX_SPEED = 3400

function blankPoint(y: number, z: number): Segment['p1'] {
  return {
    world: { y, z },
    camera: { x: 0, y: 0, z: 0 },
    screen: { x: 0, y: 0, w: 0, scale: 0 },
  }
}

function easeInOut(a: number, b: number, t: number) {
  const p = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  return a + (b - a) * p
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pushSegment(segments: Segment[], y: number, district: District, districtIndex: number, visit: number) {
  const n = segments.length
  const lastY = n === 0 ? 0 : segments[n - 1].p2.world.y
  const alt = Math.floor(n / RUMBLE) % 2 === 1
  segments.push({
    index: n,
    district: districtIndex,
    visit,
    curve: 0,
    p1: blankPoint(lastY, n * SEGMENT_LENGTH),
    p2: blankPoint(y, (n + 1) * SEGMENT_LENGTH),
    sprites: [],
    grass: alt ? district.grassAlt : district.grass,
    road: alt ? district.roadAlt : district.road,
    rumble: alt ? '#f4e6c8' : '#c4512c',
    lane: district.lane,
    edge: district.edge,
    rumbleWidth: district.rumbleWidth,
    clipY: 0,
    rail: !!district.rail,
  })
}

function addStretch(
  segments: Segment[],
  district: District,
  districtIndex: number,
  count: number,
  hill: number,
  visit: number,
) {
  const startY = segments.length === 0 ? 0 : segments[segments.length - 1].p2.world.y
  const endY = startY + hill
  for (let n = 0; n < count; n++) {
    const t = count <= 1 ? 1 : n / (count - 1)
    pushSegment(segments, easeInOut(startY, endY, t), district, districtIndex, visit)
  }
}

function place(
  segment: Segment | undefined,
  kind: SpriteKind,
  offset: number,
  extra: Partial<Pick<Sprite, 'label' | 'line'>> = {},
) {
  if (!segment) return
  segment.sprites.push({ kind, offset, home: offset, hit: false, ...extra })
}

function pick<T>(list: readonly T[], rand: () => number) {
  return list[(rand() * list.length) | 0]
}

function slowKinds(district: District): TrafficKind[] {
  if (district.trafficMix === 'danfo') return ['danfo', 'keke', 'danfo', 'truck']
  if (district.trafficMix === 'keke') return ['keke', 'keke', 'okada', 'car']
  return ['keke', 'danfo', 'okada', 'truck', 'car']
}

function oncomingKinds(district: District): TrafficKind[] {
  if (district.trafficMix === 'danfo') return ['danfo', 'car', 'truck']
  if (district.trafficMix === 'keke') return ['car', 'keke', 'okada']
  return ['car', 'danfo', 'okada', 'truck']
}

/** Fewer segments between beats on busier streets. */
function beatLength(district: District) {
  const busy = Math.max(0, Math.min(1, district.traffic / 0.28))
  return Math.round(24 - busy * 6)
}

function dressDistrict(segments: Segment[], start: number, end: number, district: District, rand: () => number) {
  const span = end - start
  const stops = district.passengers.map((_, index) => {
    const at = start + Math.floor(((index + 1) / (district.passengers.length + 1)) * span)
    return Math.min(end - 10, Math.max(start + 18, at))
  })
  const dropAt = end - 16
  const gantryAt = Math.min(end - 14, start + Math.max(40, Math.floor(span * 0.38)))
  const nearRightStop = (i: number) => stops.some((s) => Math.abs(s - i) <= 4) || Math.abs(dropAt - i) <= 3

  const leftFar = ONCOMING_OUTER - 0.38
  const leftNear = ONCOMING_OUTER - 0.14
  const rightFar = DRIVE_RIGHT + 0.42
  const rightNear = DRIVE_RIGHT + 0.18

  let i = start + 6
  while (i < end - 8) {
    const cluster = 2 + ((rand() * 2) | 0)
    for (let k = 0; k < cluster && i < end - 8; k++, i += 9) {
      const left = k % 2 === 0 ? leftFar : leftNear
      place(segments[i], district.roadside, left)
      if (district.roadside === 'roof') place(segments[i + 1], 'roof', left - 0.32)
      const rightAt = i + 4
      if (!nearRightStop(rightAt) && k !== 1) {
        const right = k % 2 === 0 ? rightNear : rightFar
        place(segments[rightAt], district.roadside, right)
        if (district.roadside === 'roof') place(segments[rightAt + 1], 'roof', right + 0.3)
      }
    }
    i += 16
  }

  for (let n = start + 2; n < end - 2; n += 22) {
    place(segments[n], 'streetlight', ONCOMING_OUTER - 0.08)
    if (!nearRightStop(n + 11)) place(segments[n + 11], 'streetlight', DRIVE_RIGHT + 0.08)
  }

  if (district.kiosks) {
    for (let n = start + 14; n < end - 10; n += 28) {
      place(segments[n], 'kiosk', leftFar - 0.04, { label: pick(KIOSK_BOARDS, rand) })
    }
  }

  if (district.hawkers > 0) {
    const step = Math.max(6, Math.round(11 / district.hawkers))
    const market = district.hawkers >= 0.75
    for (let n = start + 12; n < end - 12; n += step) {
      place(segments[n], 'hawker', n % 2 === 0 ? leftNear : leftFar)
      if (!market) continue
      const rightAt = n + 2
      if (nearRightStop(rightAt)) continue
      place(segments[rightAt], 'stall', rightNear, { label: pick(STALL_GOODS, rand) })
      if (n + step < end - 12) place(segments[n + 4], 'stall', leftNear + 0.06, { label: pick(STALL_GOODS, rand) })
    }
  }

  if (!district.rail) {
    district.billboards.forEach((text, index) => {
      const at = start + Math.floor(((index + 0.5) / district.billboards.length) * span)
      place(segments[Math.min(end - 8, at)], 'pylon', WALK_CENTER, { label: text })
    })

    for (let n = start + 24; n < end - 20; n += 42) {
      if (district.billboards.length === 0) place(segments[n], 'pylon', WALK_CENTER, { label: district.sign })
    }
  }

  const extraWait = Math.max(2, district.passengers.length)
  for (let n = 0; n < extraWait + 2; n++) {
    const at = start + Math.floor(((n + 0.7) / (extraWait + 3)) * span)
    if (nearRightStop(at)) continue
    place(segments[Math.min(end - 8, at)], 'passenger', STOP_OFFSET, {
      label: pick(['Titi', 'Gani', 'Ngozi', 'Femi', 'Aisha', 'Chike'] as const, rand),
      line: 'Abeg carry me.',
    })
  }

  stops.forEach((at, index) => {
    const rider = district.passengers[index]
    place(segments[at], 'bay', STOP_OFFSET + 0.22)
    place(segments[at], 'passenger', STOP_OFFSET, { line: rider.line, label: rider.name })
  })
  place(segments[dropAt], 'drop', STOP_OFFSET + 0.12, { label: district.id, line: district.name })

  if (district.landmark) {
    place(segments[end - 5], district.landmark, DRIVE_RIGHT + 0.55, { label: district.name })
  }
  place(segments[gantryAt], 'gantry', 0, { label: district.street })

  let coinLane = 0
  for (let n = start + 16; n < end - 8; n += 9) {
    if (nearRightStop(n)) continue
    place(segments[n], 'coin', LANES[coinLane % 3])
    coinLane += 1
  }
  for (let n = start + 30; n < end - 18; n += 46) {
    const laneIndex = (rand() * 3) | 0
    for (let k = 0; k < 4; k++) {
      const at = n + k * 2
      if (at >= end - 8 || nearRightStop(at)) continue
      place(segments[at], 'coin', LANES[laneIndex])
    }
  }

  let boostLane = 1
  for (let n = start + 28; n < end - 10; n += 34) {
    if (nearRightStop(n)) continue
    const lane = LANES[boostLane % 3]
    const taken = segments[n]?.sprites.some((sprite) => sprite.kind === 'coin' && Math.abs(sprite.offset - lane) < 0.08)
    if (taken) boostLane += 1
    place(segments[n], 'boost', LANES[boostLane % 3])
    boostLane += 1
  }

  return stops
}

function scriptDistrict(
  timeline: TimelineEvent[],
  start: number,
  end: number,
  district: District,
  districtIndex: number,
  stops: number[],
  rand: () => number,
) {
  const script = district.timeline.replace(/\s+/g, '').split('') as Beat[]
  if (script.length === 0) return
  const beat = beatLength(district)
  const first = start + (districtIndex === 0 ? 38 : 22)
  const lastSame = [first - LANE_GAP, first - LANE_GAP, first - LANE_GAP, first - LANE_GAP]
  let lastOn = first - LANE_GAP
  const quietRight = (i: number) => stops.some((s) => i > s - 14 && i < s + 5) || i > end - 22

  const travelLane = (): LaneIndex => (rand() > 0.55 ? 0 : rand() > 0.5 ? 1 : 2)

  const add = (want: number, kind: TrafficKind, lane: LaneIndex, mode: 'same' | 'oncoming' | 'parked') => {
    let at = want
    if (mode === 'oncoming') {
      at = Math.max(want, lastOn + LANE_GAP)
      lastOn = at
    } else {
      at = Math.max(want, lastSame[lane] + LANE_GAP)
      lastSame[lane] = at
    }
    if (at >= end - 12) return -1
    const share = mode === 'parked' ? 0 : mode === 'same' ? SAME_WAY[kind] : -ONCOMING[kind]
    const speed = share * MAX_SPEED
    const meetZ = (at + 0.5) * SEGMENT_LENGTH
    const travel = SPAWN_DISTANCE / Math.max(200, PLAN_SPEED - speed)
    timeline.push({
      id: timeline.length,
      kind,
      lane: mode === 'oncoming' ? ((rand() > 0.5 ? 0 : 1) as LaneIndex) : lane,
      speed,
      meetZ,
      startZ: meetZ - speed * travel,
      spawnAt: meetZ - PLAN_SPEED * travel,
      district: districtIndex,
      label: kind === 'danfo' ? district.sign : undefined,
      oncoming: mode === 'oncoming',
    })
    return at
  }

  let step = 0
  for (let at = first; at < end - 12; at += beat, step++) {
    const code = script[step % script.length]
    const right = !quietRight(at)
    switch (code) {
      case 'O':
        add(at, pick(oncomingKinds(district), rand), 0, 'oncoming')
        break
      case 'C':
        add(at, pick(oncomingKinds(district), rand), 0, 'oncoming')
        add(at + Math.max(8, beat), 'car', 0, 'oncoming')
        break
      case 'S':
        if (right) add(at, pick(slowKinds(district), rand), travelLane(), 'same')
        else add(at, pick(oncomingKinds(district), rand), 0, 'oncoming')
        break
      case 'Q': {
        const slowAt = right ? add(at, pick(slowKinds(district), rand), travelLane(), 'same') : -1
        const wait = (slowAt >= 0 ? slowAt : at) + Math.max(10, beat)
        add(wait, pick(oncomingKinds(district), rand), 0, 'oncoming')
        break
      }
      case 'P':
        if (right) add(at, district.trafficMix === 'keke' ? 'keke' : 'danfo', WAIT_LANE, 'parked')
        break
      case 'H':
        if (right) add(at, 'pothole', travelLane(), 'parked')
        break
      case 'L':
        add(at, 'pothole', 0, 'oncoming')
        break
      default:
        break
    }
  }
}

export interface Track {
  segments: Segment[]
  timeline: TimelineEvent[]
  rails: RailRun[]
  length: number
  laps: number
  lapLength: number
}

/** Add another full pass of Ibadan onto the end of the road. Hills continue from where you are. */
export function appendLap(track: Track) {
  const rand = mulberry32(1849 + track.laps * 409)
  const lap = track.laps
  DISTRICTS.forEach((district, districtIndex) => {
    const start = track.segments.length
    const visit = lap * DISTRICTS.length + districtIndex
    district.stretches.forEach((stretch) => {
      const count = stretch.enter + stretch.hold + stretch.leave
      addStretch(
        track.segments,
        district,
        districtIndex,
        Math.round(count * AREA_SCALE),
        stretch.hill * AREA_SCALE,
        visit,
      )
    })
    const stops = dressDistrict(track.segments, start, track.segments.length, district, rand)
    scriptDistrict(track.timeline, start, track.segments.length, district, districtIndex, stops, rand)
    if (district.rail) {
      track.rails.push({
        z0: start * SEGMENT_LENGTH,
        z1: track.segments.length * SEGMENT_LENGTH,
        slogans: ['IBADAN', 'PACESETTER', 'SEVEN HILLS', 'OYO STATE', district.sign],
      })
    }
  })
  track.timeline.sort((a, b) => a.spawnAt - b.spawnAt)
  track.laps += 1
  track.length = track.segments.length * SEGMENT_LENGTH
  if (track.lapLength === 0) track.lapLength = track.length
}

export function buildTrack(): Track {
  const track: Track = { segments: [], timeline: [], rails: [], length: 0, laps: 0, lapLength: 0 }
  appendLap(track)
  appendLap(track)
  return track
}

export function resetSprites(segments: Segment[]) {
  segments.forEach((segment) => {
    segment.sprites.forEach((sprite) => {
      sprite.hit = false
      sprite.offset = sprite.home
    })
  })
}

export function findSegment(segments: Segment[], z: number) {
  const index = Math.max(0, Math.min(segments.length - 1, Math.floor(z / SEGMENT_LENGTH)))
  return segments[index]
}
