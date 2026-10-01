import { DISTRICTS, type District, type SpriteKind } from './districts'
import { LEFT_LANE, RIGHT_LANES, STOP_OFFSET } from './lanes'

export const SEGMENT_LENGTH = 200
export const RUMBLE = 3

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
  curve: number
  p1: { world: { y: number; z: number }; camera: Cam; screen: Screen }
  p2: { world: { y: number; z: number }; camera: Cam; screen: Screen }
  sprites: Sprite[]
  grass: string
  road: string
  rumble: string
  lane: string
  edge: string
  lanes: 1 | 2
  rumbleWidth: number
  clipY: number
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

const KIOSK_BOARDS = ['GLO', 'POS', 'BUKA', 'PURE WATER', 'PROVISION']

function blankPoint(y: number, z: number): Segment['p1'] {
  return {
    world: { y, z },
    camera: { x: 0, y: 0, z: 0 },
    screen: { x: 0, y: 0, w: 0, scale: 0 },
  }
}

function easeIn(a: number, b: number, t: number) {
  return a + (b - a) * t * t
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

function pushSegment(
  segments: Segment[],
  curve: number,
  y: number,
  district: District,
  districtIndex: number,
) {
  const n = segments.length
  const lastY = n === 0 ? 0 : segments[n - 1].p2.world.y
  const alt = Math.floor(n / RUMBLE) % 2 === 1
  segments.push({
    index: n,
    district: districtIndex,
    curve,
    p1: blankPoint(lastY, n * SEGMENT_LENGTH),
    p2: blankPoint(y, (n + 1) * SEGMENT_LENGTH),
    sprites: [],
    grass: alt ? district.grassAlt : district.grass,
    road: alt ? district.roadAlt : district.road,
    rumble: alt ? '#f4e6c8' : '#c4512c',
    lane: district.lane,
    edge: district.edge,
    lanes: district.lanes,
    rumbleWidth: district.rumbleWidth,
    clipY: 0,
  })
}

function addStretch(
  segments: Segment[],
  district: District,
  districtIndex: number,
  enter: number,
  hold: number,
  leave: number,
  curve: number,
  hill: number,
) {
  const startY = segments.length === 0 ? 0 : segments[segments.length - 1].p2.world.y
  const endY = startY + hill
  const total = Math.max(1, enter + hold + leave)
  let n = 0
  const step = (c: number) => {
    const t = total <= 1 ? 1 : n / (total - 1)
    pushSegment(segments, c, easeInOut(startY, endY, t), district, districtIndex)
    n += 1
  }
  for (let i = 0; i < enter; i++) {
    const t = enter <= 1 ? 1 : i / (enter - 1)
    step(easeIn(0, curve, t))
  }
  for (let i = 0; i < hold; i++) step(curve)
  for (let i = 0; i < leave; i++) {
    const t = leave <= 1 ? 1 : i / (leave - 1)
    step(easeInOut(curve, 0, t))
  }
}

function place(
  segment: Segment,
  kind: SpriteKind,
  offset: number,
  extra: Partial<Pick<Sprite, 'label' | 'line'>> & { force?: boolean } = {},
) {
  const { force, ...rest } = extra
  const crowded = segment.sprites.some(
    (sprite) => Math.abs(sprite.offset) < 1.15 && Math.abs(sprite.offset - offset) < 0.48,
  )
  if (!force && crowded && Math.abs(offset) < 1.1) return
  segment.sprites.push({
    kind,
    offset,
    home: offset,
    hit: false,
    ...rest,
  })
}

function rightLane(rand: () => number) {
  return RIGHT_LANES[(rand() * RIGHT_LANES.length) | 0] + (rand() - 0.5) * 0.04
}

function trafficKind(district: District, roll: number): SpriteKind {
  if (district.trafficMix === 'danfo') return roll > 0.38 ? 'danfo' : 'keke'
  if (district.trafficMix === 'mixed') {
    if (roll > 0.72) return 'okada'
    if (roll > 0.4) return 'danfo'
    return 'keke'
  }
  return roll > 0.78 ? 'okada' : 'keke'
}

function dressDistrict(
  segments: Segment[],
  start: number,
  end: number,
  district: District,
  rand: () => number,
) {
  const span = end - start
  for (let i = start + 4; i < end - 6; i += 4) {
    const side = ((i / 4) | 0) % 2 === 0 ? 1 : -1
    const offset = side * (district.shoulder + rand() * 0.22)
    place(segments[i], district.roadside, offset)
    if (district.roadside === 'roof' && i + 1 < end - 6) {
      place(segments[i + 1], 'roof', side * (district.shoulder + 0.18 + rand() * 0.16))
    }
    if (district.kiosks && i + 2 < end - 6 && rand() > 0.42) {
      place(segments[i + 2], 'kiosk', side * (district.shoulder + 0.08), {
        label: KIOSK_BOARDS[(rand() * KIOSK_BOARDS.length) | 0],
      })
    }
  }

  if (district.hawkers > 0) {
    const step = Math.max(6, Math.round(1 / Math.max(0.25, district.hawkers)))
    for (let i = start + 10; i < end - 12; i += step) {
      if (rand() > district.hawkers) continue
      place(segments[i], 'hawker', rightLane(rand))
    }
  }

  const gap = Math.max(4, Math.round(1 / Math.max(0.05, district.traffic)))
  for (let i = start + 16; i < end - 12; i += gap) {
    if (rand() > district.traffic + 0.35) continue
    const oncoming = rand() < 0.18
    const offset = oncoming ? LEFT_LANE : rightLane(rand)
    const kind = trafficKind(district, rand())
    place(segments[i], kind, offset, kind === 'danfo' ? { label: district.sign } : {})
  }

  for (let i = start + 12; i < end - 8; i += 9) {
    if (rand() > district.potholes * 4) continue
    place(segments[i], 'pothole', rightLane(rand))
  }

  district.passengers.forEach((rider, index) => {
    const at = start + Math.floor(((index + 1) / (district.passengers.length + 1)) * span)
    const i = Math.min(end - 8, Math.max(start + 10, at))
    place(segments[i], 'bay', STOP_OFFSET + 0.36, { force: true })
    place(segments[i], 'passenger', STOP_OFFSET, { line: rider.line, label: rider.name, force: true })
  })

  for (let i = end - 16; i > start + 12; i--) {
    if (segments[i].sprites.length > 0) continue
    place(segments[i], 'drop', STOP_OFFSET, { label: district.id, line: district.name })
    break
  }

  if (district.landmark) {
    place(segments[Math.max(start + 8, end - 4)], district.landmark, district.shoulder + 0.12, {
      label: district.name,
    })
  }
  const gantryAt = Math.min(end - 12, start + Math.max(36, Math.floor((end - start) * 0.4)))
  place(segments[gantryAt], 'gantry', RIGHT_LANES[1], { label: district.street, force: true })
}

export function buildTrack() {
  const segments: Segment[] = []
  const rand = mulberry32(1849)
  DISTRICTS.forEach((district, districtIndex) => {
    const start = segments.length
    district.stretches.forEach((stretch) => {
      addStretch(
        segments,
        district,
        districtIndex,
        stretch.enter,
        stretch.hold,
        stretch.leave,
        0,
        stretch.hill,
      )
    })
    dressDistrict(segments, start, segments.length, district, rand)
  })
  return {
    segments,
    length: segments.length * SEGMENT_LENGTH,
  }
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
