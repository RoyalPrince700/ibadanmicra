/** Asphalt runs from -1 (left edge) to 1 (right edge), in a straight line. */

export const MEDIAN_LEFT = -0.58
export const MEDIAN_RIGHT = -0.4
export const RIGHT_EDGE = 0.96

const RIGHT_SPAN = RIGHT_EDGE - MEDIAN_RIGHT

/** Three lanes on the carriageway the Micra drives. */
export const RIGHT_LANES = [0, 1, 2].map(
  (lane) => MEDIAN_RIGHT + RIGHT_SPAN * ((lane + 0.5) / 3),
)

/** Dashed dividers between those three lanes. */
export const LANE_MARKS = [1, 2].map((mark) => MEDIAN_RIGHT + RIGHT_SPAN * (mark / 3))

/** Single oncoming lane on the far carriageway. */
export const LEFT_LANE = (-1 + MEDIAN_LEFT) / 2

/** Shoulder stop just off the right edge, beside the outer lane. */
export const STOP_OFFSET = 1.08
