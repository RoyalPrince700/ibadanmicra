/**
 * Dual carriageway. A walkway splits oncoming traffic from your side.
 * The camera stays on the right carriageway, which is four lanes.
 * The rightmost of those four is the yellow wait lane, where the Micra
 * pulls in to pick people. Press Owa to drop them.
 */

export const ONCOMING_OUTER = -1.32
export const ONCOMING_INNER = -0.62
export const WALK_LEFT = -0.62
export const WALK_RIGHT = -0.22
export const WALK_CENTER = -0.42
export const DRIVE_LEFT = -0.22
export const DRIVE_RIGHT = 1.26

export const ROAD_LEFT = ONCOMING_OUTER
export const ROAD_EDGE = DRIVE_RIGHT

export type LaneIndex = 0 | 1 | 2 | 3
export const LANE_COUNT = 4
export const LANE_WIDTH = (DRIVE_RIGHT - DRIVE_LEFT) / LANE_COUNT

export const LANES: readonly [number, number, number, number] = [
  DRIVE_LEFT + LANE_WIDTH * 0.5,
  DRIVE_LEFT + LANE_WIDTH * 1.5,
  DRIVE_LEFT + LANE_WIDTH * 2.5,
  DRIVE_LEFT + LANE_WIDTH * 3.5,
]

/** Travel lane the camera prefers. Not the yellow wait lane. */
export const HOME_LANE: LaneIndex = 1
/** Rightmost lane: yellow marks, people wait here, Micra pulls in. */
export const WAIT_LANE: LaneIndex = 3

export const ONCOMING_LANES = [
  ONCOMING_OUTER + (ONCOMING_INNER - ONCOMING_OUTER) * 0.28,
  ONCOMING_OUTER + (ONCOMING_INNER - ONCOMING_OUTER) * 0.72,
] as const

export const STOP_OFFSET = LANES[WAIT_LANE] + LANE_WIDTH * 0.18
export const FOCUS_X = (DRIVE_LEFT + DRIVE_RIGHT) * 0.5

export const MAX_RIDERS = 4

export function clampLane(value: number): LaneIndex {
  if (value <= 0) return 0
  if (value >= 3) return 3
  return value as LaneIndex
}

export function laneLine(index: number) {
  return DRIVE_LEFT + LANE_WIDTH * index
}
