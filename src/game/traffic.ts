import type { TrafficKind } from './districts'
import { LANES, ONCOMING_LANES, type LaneIndex } from './lanes'
import { SEGMENT_LENGTH, SPAWN_DISTANCE, type TimelineEvent } from './track'

export interface Vehicle {
  id: number
  kind: TrafficKind
  lane: LaneIndex
  z: number
  offset: number
  target: number
  speed: number
  cruise: number
  boost: number
  label?: string
  hit: boolean
  passed: boolean
  oncoming: boolean
}

/** Width as a share of the road half-width. Each of the four lanes is about 0.37. */
export const VEHICLE_WIDTH: Record<TrafficKind, number> = {
  keke: 0.22,
  okada: 0.12,
  danfo: 0.28,
  car: 0.24,
  truck: 0.3,
  pothole: 0.22,
}

/** Length along the road in world units. */
export const VEHICLE_LENGTH: Record<TrafficKind, number> = {
  keke: 300,
  okada: 220,
  danfo: 520,
  car: 430,
  truck: 820,
  pothole: 150,
}

export function isMoving(vehicle: Vehicle) {
  return vehicle.kind !== 'pothole'
}

export function createTraffic(timeline: TimelineEvent[]) {
  const live: Vehicle[] = []
  let cursor = 0

  function spawn(event: TimelineEvent) {
    const oncoming = event.speed < 0 || !!event.oncoming
    const offset = oncoming ? ONCOMING_LANES[event.lane % 2] : LANES[event.lane]
    live.push({
      id: event.id,
      kind: event.kind,
      lane: event.lane,
      z: event.startZ,
      offset,
      target: offset,
      speed: event.speed,
      cruise: event.speed,
      boost: 0,
      label: event.label,
      hit: false,
      passed: false,
      oncoming,
    })
  }

  /** Drop everything and pick the timeline up from where the car is now. */
  function reset(playerZ: number) {
    live.length = 0
    cursor = 0
    while (cursor < timeline.length && timeline[cursor].spawnAt < playerZ) cursor++
  }

  function leaderGap(vehicle: Vehicle) {
    let best: Vehicle | null = null
    let gap = Infinity
    const dir = vehicle.cruise >= 0 ? 1 : -1
    for (const other of live) {
      if (other === vehicle || !isMoving(other) || other.lane !== vehicle.lane) continue
      if (Math.abs(other.offset - vehicle.offset) > 0.4) continue
      const ahead = (other.z - vehicle.z) * dir
      if (ahead <= 0 || ahead >= gap) continue
      gap = ahead
      best = other
    }
    if (!best) return null
    const room = gap - (VEHICLE_LENGTH[best.kind] + VEHICLE_LENGTH[vehicle.kind]) / 2
    return { leader: best, room }
  }

  function update(dt: number, playerZ: number) {
    while (cursor < timeline.length && timeline[cursor].spawnAt <= playerZ) {
      spawn(timeline[cursor])
      cursor++
    }

    for (const vehicle of live) {
      if (!isMoving(vehicle)) continue
      vehicle.boost = Math.max(0, vehicle.boost - dt)
      let want = vehicle.cruise * (vehicle.boost > 0 ? 1.45 : 1)
      if (vehicle.cruise === 0 && vehicle.z < playerZ - 600) want = 1200
      const ahead = leaderGap(vehicle)
      if (ahead && ahead.room < 320) {
        const follow = ahead.room < 80 ? ahead.leader.speed * 0.8 : ahead.leader.speed
        want = vehicle.cruise >= 0 ? Math.min(want, Math.max(0, follow)) : Math.max(want, Math.min(0, follow))
      }
      vehicle.speed += (want - vehicle.speed) * Math.min(1, dt * 2.5)
      vehicle.z += vehicle.speed * dt
      vehicle.offset += (vehicle.target - vehicle.offset) * Math.min(1, dt * 4.4)
    }

    for (let i = live.length - 1; i >= 0; i--) {
      const ahead = live[i].z - playerZ
      if (ahead < -SEGMENT_LENGTH * 4 || ahead > SPAWN_DISTANCE * 1.4) live.splice(i, 1)
    }
  }

  /** Honk: keke and okada in your lane pull onto the shoulder, bigger vehicles speed up. */
  function honk(playerZ: number, playerX: number) {
    let moved = 0
    for (const vehicle of live) {
      if (!isMoving(vehicle) || vehicle.hit) continue
      const ahead = vehicle.z - playerZ
      if (ahead < 0 || ahead > SEGMENT_LENGTH * 9) continue
      if (Math.abs(vehicle.offset - playerX) > 0.6) continue
      if (vehicle.cruise < 0) continue
      if (vehicle.kind === 'keke' || vehicle.kind === 'okada') {
        vehicle.target = LANES[3] + 0.08
        moved += 1
      } else {
        vehicle.boost = 2.4
        if (vehicle.cruise === 0) vehicle.cruise = 900
        moved += 1
      }
    }
    return moved
  }

  return {
    live,
    reset,
    update,
    honk,
  }
}

export type Traffic = ReturnType<typeof createTraffic>
