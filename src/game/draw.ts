import { BRAND, type SpriteKind, type TrafficKind } from './districts'
import {
  DRIVE_LEFT,
  DRIVE_RIGHT,
  FOCUS_X,
  LANE_WIDTH,
  LANES,
  ONCOMING_INNER,
  ONCOMING_OUTER,
  WAIT_LANE,
  WALK_CENTER,
  WALK_LEFT,
  WALK_RIGHT,
  laneLine,
} from './lanes'
import type { Sprite } from './track'

export function mixHex(a: string, b: string, t: number) {
  const amount = Math.max(0, Math.min(1, t))
  const pa = hex(a)
  const pb = hex(b)
  const c = pa.map((channel, i) => Math.round(channel + (pb[i] - channel) * amount))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

function hex(value: string) {
  const h = value.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}

function poly(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number,
) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.lineTo(x3, y3)
  ctx.lineTo(x4, y4)
  ctx.closePath()
  ctx.fill()
}

/** A strip of road between two lateral offsets (in road half-widths). */
function band(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  w1: number,
  x2: number,
  y2: number,
  w2: number,
  from: number,
  to: number,
) {
  poly(ctx, x1 + from * w1, y1, x1 + to * w1, y1, x2 + to * w2, y2, x2 + from * w2, y2)
}

export function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  horizon: number,
  shift: number,
  clock: number,
  skyTop: string,
  skyBottom: string,
  grass: string,
  haze: number,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, horizon)
  sky.addColorStop(0, skyTop)
  sky.addColorStop(1, skyBottom)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, horizon + 2)

  const sunX = width * 0.78 + shift * 28
  const sunY = horizon * 0.34
  const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, width * 0.26)
  glow.addColorStop(0, 'rgba(245, 196, 0, 0.95)')
  glow.addColorStop(0.35, 'rgba(245, 180, 80, 0.32)')
  glow.addColorStop(1, 'rgba(245, 180, 80, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(sunX, sunY, width * 0.26, 0, Math.PI * 2)
  ctx.fill()

  clouds(ctx, width, horizon, clock, shift)

  hillLayer(ctx, width, horizon, Math.min(128, horizon * 0.52), '#5a2814', shift * 12, 0.4)
  hillLayer(ctx, width, horizon + 2, Math.min(96, horizon * 0.4), BRAND.rustDeep, shift * 22, 0.7)
  hillLayer(ctx, width, horizon + 8, Math.min(62, horizon * 0.24), BRAND.rust, shift * 40, 1.15)
  citySilhouette(ctx, width, horizon + 6, shift * 40)
  roofTicks(ctx, width, horizon + 10, shift * 40)

  if (haze > 0.02) {
    const band = ctx.createLinearGradient(0, horizon - 70, 0, horizon + 30)
    band.addColorStop(0, 'rgba(244, 226, 190, 0)')
    band.addColorStop(0.7, `rgba(244, 226, 190, ${Math.min(0.6, haze * 0.8)})`)
    band.addColorStop(1, 'rgba(244, 226, 190, 0)')
    ctx.fillStyle = band
    ctx.fillRect(0, horizon - 70, width, 100)
  }

  ctx.fillStyle = grass
  ctx.fillRect(0, horizon, width, height - horizon)
}

function clouds(ctx: CanvasRenderingContext2D, width: number, horizon: number, clock: number, shift: number) {
  ctx.fillStyle = 'rgba(255, 248, 232, 0.55)'
  for (let i = 0; i < 5; i++) {
    const span = width + 260
    const x = ((i * 233 + clock * (6 + i * 2) + shift * 10) % span) - 130
    const y = horizon * (0.16 + (i % 3) * 0.13)
    const s = 26 + (i % 3) * 12
    ctx.beginPath()
    ctx.ellipse(x, y, s * 1.8, s * 0.5, 0, 0, Math.PI * 2)
    ctx.ellipse(x - s * 0.8, y + s * 0.12, s, s * 0.42, 0, 0, Math.PI * 2)
    ctx.ellipse(x + s * 0.9, y + s * 0.1, s * 1.1, s * 0.44, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

function hillLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  base: number,
  amp: number,
  color: string,
  shift: number,
  lumps: number,
) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(-40, base + 4)
  const steps = 8
  for (let i = 0; i <= steps; i++) {
    const wave = Math.sin(i * 1.3 + lumps + shift * 0.01) * amp
    const y = base - Math.abs(wave)
    if (i === 0) ctx.lineTo(-40, y)
    else ctx.lineTo((i / steps) * width, y)
  }
  ctx.lineTo(width + 40, base + 4)
  ctx.closePath()
  ctx.fill()
}

function roofTicks(ctx: CanvasRenderingContext2D, width: number, base: number, shift: number) {
  const rusts = ['#6e3018', '#a34422', '#8c3b22', '#c4512c', '#7a2e16']
  for (let i = 0; i < 32; i++) {
    const x = ((i * 52 + shift) % (width + 110)) - 28
    const w = 12 + (i % 4) * 7
    const h = 7 + (i % 5) * 3
    ctx.fillStyle = rusts[i % rusts.length]
    ctx.fillRect(x, base - h, w, h)
    ctx.beginPath()
    ctx.moveTo(x - 2, base - h)
    ctx.lineTo(x + w / 2, base - h - 5)
    ctx.lineTo(x + w + 2, base - h)
    ctx.closePath()
    ctx.fill()
    if (i % 5 === 0) {
      ctx.fillStyle = '#1b4d3e'
      ctx.fillRect(x + w * 0.35, base - h + 2, w * 0.18, h * 0.4)
    }
  }
}

function citySilhouette(ctx: CanvasRenderingContext2D, width: number, base: number, shift: number) {
  const blocks = [
    { x: 0.08, w: 0.035, h: 28 },
    { x: 0.14, w: 0.05, h: 42 },
    { x: 0.2, w: 0.028, h: 22 },
    { x: 0.62, w: 0.04, h: 36 },
    { x: 0.7, w: 0.07, h: 58 },
    { x: 0.78, w: 0.03, h: 26 },
    { x: 0.88, w: 0.045, h: 34 },
  ]
  for (const block of blocks) {
    const x = ((block.x * width + shift * 0.35) % (width + 80)) - 20
    ctx.fillStyle = '#5c2614'
    ctx.fillRect(x, base - block.h, block.w * width, block.h)
    ctx.fillStyle = 'rgba(244, 230, 200, 0.18)'
    for (let r = 0; r < 4; r++) {
      ctx.fillRect(x + 3, base - block.h + 6 + r * 8, block.w * width - 6, 2)
    }
  }
  const towerX = ((width * 0.72 + shift * 0.35) % (width + 80)) - 20
  ctx.fillStyle = '#4a2212'
  ctx.fillRect(towerX + 6, base - 78, 8, 78)
  ctx.beginPath()
  ctx.moveTo(towerX + 2, base - 78)
  ctx.lineTo(towerX + 10, base - 92)
  ctx.lineTo(towerX + 18, base - 78)
  ctx.closePath()
  ctx.fill()
}

export function drawSegment(
  ctx: CanvasRenderingContext2D,
  width: number,
  x1: number,
  y1: number,
  w1: number,
  x2: number,
  y2: number,
  w2: number,
  grass: string,
  road: string,
  rumble: string,
  lane: string,
  dashed: boolean,
  rumbleWidth: number,
  edge: string,
  rail = false,
) {
  const top = Math.min(y1, y2)
  const bottom = Math.max(y1, y2)
  ctx.fillStyle = grass
  ctx.fillRect(0, top, width, Math.max(1, bottom - top))

  ctx.fillStyle = rumble
  const kerb = 0.05 + (rumbleWidth - 1) * 0.04
  band(ctx, x1, y1, w1, x2, y2, w2, ONCOMING_OUTER - kerb, ONCOMING_INNER + 0.04)
  band(ctx, x1, y1, w1, x2, y2, w2, DRIVE_LEFT - 0.04, DRIVE_RIGHT + kerb)

  ctx.fillStyle = '#3a3f46'
  band(ctx, x1, y1, w1, x2, y2, w2, ONCOMING_OUTER, ONCOMING_INNER)

  ctx.fillStyle = '#d7c7a4'
  band(ctx, x1, y1, w1, x2, y2, w2, WALK_LEFT, WALK_RIGHT)
  ctx.fillStyle = '#cbb892'
  band(ctx, x1, y1, w1, x2, y2, w2, WALK_LEFT + 0.05, WALK_RIGHT - 0.05)
  ctx.fillStyle = '#1b4d3e'
  band(ctx, x1, y1, w1, x2, y2, w2, WALK_LEFT + 0.012, WALK_LEFT + 0.03)
  band(ctx, x1, y1, w1, x2, y2, w2, WALK_RIGHT - 0.03, WALK_RIGHT - 0.012)

  if (rail) {
    ctx.fillStyle = '#3a342c'
    band(ctx, x1, y1, w1, x2, y2, w2, WALK_CENTER - 0.14, WALK_CENTER + 0.14)
    if (dashed) {
      ctx.fillStyle = '#6b4a2a'
      band(ctx, x1, y1, w1, x2, y2, w2, WALK_CENTER - 0.1, WALK_CENTER + 0.1)
    }
    ctx.fillStyle = BRAND.rustDeep
    band(ctx, x1, y1, w1, x2, y2, w2, WALK_CENTER - 0.075, WALK_CENTER - 0.055)
    band(ctx, x1, y1, w1, x2, y2, w2, WALK_CENTER + 0.055, WALK_CENTER + 0.075)
    ctx.fillStyle = BRAND.gold
    band(ctx, x1, y1, w1, x2, y2, w2, WALK_CENTER - 0.068, WALK_CENTER - 0.06)
    band(ctx, x1, y1, w1, x2, y2, w2, WALK_CENTER + 0.06, WALK_CENTER + 0.068)
  }

  ctx.fillStyle = road
  band(ctx, x1, y1, w1, x2, y2, w2, DRIVE_LEFT, DRIVE_RIGHT)

  const waitL = laneLine(WAIT_LANE)
  const waitR = DRIVE_RIGHT
  ctx.fillStyle = 'rgba(245, 196, 0, 0.28)'
  band(ctx, x1, y1, w1, x2, y2, w2, waitL, waitR)

  if (w1 < 8) return

  ctx.fillStyle = edge
  const e = Math.max(0.012, 1.3 / Math.max(1, w1))
  band(ctx, x1, y1, w1, x2, y2, w2, ONCOMING_OUTER - e, ONCOMING_OUTER + 0.012)
  band(ctx, x1, y1, w1, x2, y2, w2, ONCOMING_INNER - 0.012, ONCOMING_INNER + e)
  band(ctx, x1, y1, w1, x2, y2, w2, DRIVE_LEFT - e, DRIVE_LEFT + 0.012)
  band(ctx, x1, y1, w1, x2, y2, w2, DRIVE_RIGHT - 0.012, DRIVE_RIGHT + e)

  const mark = Math.max(0.012, 0.9 / Math.max(1, w1))
  ctx.fillStyle = 'rgba(244, 230, 200, 0.55)'
  const oncomingMid = (ONCOMING_OUTER + ONCOMING_INNER) / 2
  if (dashed) band(ctx, x1, y1, w1, x2, y2, w2, oncomingMid - mark, oncomingMid + mark)

  ctx.fillStyle = lane
  for (let i = 1; i < 4; i++) {
    const at = laneLine(i)
    if (i === 3) {
      ctx.fillStyle = '#f5c400'
      band(ctx, x1, y1, w1, x2, y2, w2, at - mark, at + mark)
      ctx.fillStyle = lane
      continue
    }
    if (dashed) band(ctx, x1, y1, w1, x2, y2, w2, at - mark, at + mark)
  }

  if (dashed && w1 > 22) {
    ctx.fillStyle = 'rgba(245, 196, 0, 0.55)'
    const box = LANE_WIDTH * 0.28
    const cx = LANES[WAIT_LANE]
    band(ctx, x1, y1, w1, x2, y2, w2, cx - box, cx - box + mark * 1.6)
    band(ctx, x1, y1, w1, x2, y2, w2, cx + box - mark * 1.6, cx + box)
  }
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  scale: number,
  hot: boolean,
) {
  const size = Math.max(6, scale)
  ctx.save()
  ctx.translate(x, y)
  painters[sprite.kind](ctx, size, sprite.label || '', hot)
  ctx.restore()
}

function labelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  maxWidth: number,
  start: number,
  color: string,
) {
  let size = start
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${size}px Outfit, sans-serif`
  while (size > 5 && ctx.measureText(text).width > maxWidth) {
    size -= 1
    ctx.font = `700 ${size}px Outfit, sans-serif`
  }
  ctx.fillStyle = color
  ctx.fillText(text, 0, y)
}

const painters: Record<SpriteKind, (ctx: CanvasRenderingContext2D, s: number, label: string, hot: boolean) => void> = {
  palm: (ctx, s) => {
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.beginPath()
    ctx.ellipse(0, 0, s * 0.22, s * 0.05, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#6b4a2a'
    ctx.beginPath()
    ctx.moveTo(-s * 0.07, 0)
    ctx.quadraticCurveTo(-s * 0.04, -s * 0.55, s * 0.02, -s * 0.86)
    ctx.lineTo(s * 0.1, -s * 0.86)
    ctx.quadraticCurveTo(s * 0.05, -s * 0.5, s * 0.07, 0)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#174a3b'
    for (let i = 0; i < 8; i++) {
      ctx.beginPath()
      ctx.ellipse(s * 0.06, -s * 0.9, s * 0.48, s * 0.1, (i * Math.PI) / 4 + 0.15, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#2f6a3e'
    ctx.beginPath()
    ctx.ellipse(s * 0.06, -s * 0.92, s * 0.28, s * 0.07, -0.25, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#c4512c'
    ctx.beginPath()
    ctx.arc(-s * 0.08, -s * 0.78, s * 0.055, 0, Math.PI * 2)
    ctx.arc(s * 0.18, -s * 0.76, s * 0.05, 0, Math.PI * 2)
    ctx.arc(s * 0.04, -s * 0.72, s * 0.045, 0, Math.PI * 2)
    ctx.fill()
  },
  tree: (ctx, s) => {
    ctx.fillStyle = '#5a3a22'
    ctx.fillRect(-s * 0.07, -s * 0.55, s * 0.14, s * 0.55)
    ctx.fillStyle = '#24573a'
    ctx.beginPath()
    ctx.arc(0, -s * 0.72, s * 0.34, 0, Math.PI * 2)
    ctx.arc(-s * 0.22, -s * 0.58, s * 0.2, 0, Math.PI * 2)
    ctx.arc(s * 0.22, -s * 0.6, s * 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#3a7d4c'
    ctx.beginPath()
    ctx.arc(-s * 0.08, -s * 0.84, s * 0.16, 0, Math.PI * 2)
    ctx.fill()
  },
  umbrella: (ctx, s) => {
    ctx.fillStyle = '#6b4a2a'
    ctx.fillRect(-s * 0.03, -s * 0.7, s * 0.06, s * 0.7)
    ctx.fillStyle = '#7a5a3a'
    ctx.fillRect(-s * 0.3, -s * 0.3, s * 0.6, s * 0.06)
    ctx.fillStyle = '#e7c07a'
    ctx.fillRect(-s * 0.26, -s * 0.36, s * 0.14, s * 0.06)
    ctx.fillStyle = '#c4512c'
    ctx.fillRect(-s * 0.06, -s * 0.37, s * 0.12, s * 0.07)
    const colors = ['#c4512c', '#f5c400', '#1b4d3e', '#f4e6c8']
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = colors[i]
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.9)
      ctx.lineTo(-s * 0.48 + i * s * 0.24, -s * 0.68)
      ctx.lineTo(-s * 0.24 + i * s * 0.24, -s * 0.68)
      ctx.closePath()
      ctx.fill()
    }
  },
  roof: (ctx, s) => {
    const rusts = ['#a34422', '#c4512c', '#8c3b22', '#6e3018']
    for (let i = 0; i < 4; i++) {
      const rw = s * (0.22 + (i % 2) * 0.08)
      const rh = s * (0.18 + (i % 3) * 0.07)
      const x = -s * 0.46 + i * s * 0.2
      const y = -rh - (i % 2) * s * 0.04
      ctx.fillStyle = '#f4e6c8'
      ctx.fillRect(x, y, rw, -y)
      ctx.fillStyle = '#1b4d3e'
      ctx.fillRect(x + rw * 0.35, y + rh * 0.2, rw * 0.3, -y - rh * 0.2)
      ctx.fillStyle = rusts[i % rusts.length]
      ctx.beginPath()
      ctx.moveTo(x - 2, y)
      ctx.lineTo(x + rw / 2, y - rh * 0.45)
      ctx.lineTo(x + rw + 2, y)
      ctx.closePath()
      ctx.fill()
    }
  },
  passenger: (ctx, s) => {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.beginPath()
    ctx.ellipse(0, 0, s * 0.2, s * 0.04, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#c4512c'
    ctx.beginPath()
    ctx.ellipse(0, -s * 0.86, s * 0.18, s * 0.05, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1a120b'
    ctx.beginPath()
    ctx.arc(0, -s * 0.68, s * 0.1, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1b4d3e'
    roundRect(ctx, -s * 0.13, -s * 0.56, s * 0.26, s * 0.36, 4)
    ctx.fill()
    ctx.fillStyle = BRAND.gold
    ctx.fillRect(-s * 0.13, -s * 0.38, s * 0.26, s * 0.05)
    ctx.fillStyle = '#1a120b'
    ctx.fillRect(-s * 0.1, -s * 0.2, s * 0.07, s * 0.2)
    ctx.fillRect(s * 0.03, -s * 0.2, s * 0.07, s * 0.2)
    ctx.fillStyle = '#1a120b'
    ctx.save()
    ctx.translate(s * 0.13, -s * 0.5)
    ctx.rotate(-0.9)
    ctx.fillRect(0, -s * 0.03, s * 0.24, s * 0.06)
    ctx.restore()
  },
  hawker: (ctx, s) => {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.beginPath()
    ctx.ellipse(0, 0, s * 0.18, s * 0.04, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#d7efe4'
    ctx.fillRect(-s * 0.16, -s * 1.05, s * 0.07, s * 0.12)
    ctx.fillRect(-s * 0.04, -s * 1.08, s * 0.07, s * 0.14)
    ctx.fillRect(s * 0.08, -s * 1.02, s * 0.07, s * 0.1)
    ctx.fillStyle = '#c4512c'
    ctx.beginPath()
    ctx.ellipse(0, -s * 0.92, s * 0.26, s * 0.05, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1a120b'
    ctx.beginPath()
    ctx.arc(0, -s * 0.76, s * 0.1, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f5c400'
    roundRect(ctx, -s * 0.14, -s * 0.64, s * 0.28, s * 0.4, 4)
    ctx.fill()
    ctx.fillStyle = '#1b4d3e'
    ctx.fillRect(-s * 0.14, -s * 0.44, s * 0.28, s * 0.06)
    ctx.fillStyle = '#1a120b'
    ctx.fillRect(-s * 0.1, -s * 0.24, s * 0.07, s * 0.24)
    ctx.fillRect(s * 0.03, -s * 0.24, s * 0.07, s * 0.24)
  },
  stall: (ctx, s, text) => {
    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    ctx.beginPath()
    ctx.ellipse(0, 0, s * 0.28, s * 0.05, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#6b4a2a'
    ctx.fillRect(-s * 0.22, -s * 0.28, s * 0.44, s * 0.06)
    ctx.fillRect(-s * 0.18, -s * 0.22, s * 0.04, s * 0.22)
    ctx.fillRect(s * 0.14, -s * 0.22, s * 0.04, s * 0.22)
    const goods = ['#c4512c', '#f5c400', '#2f6a3e', '#e7c07a', '#8c3b22', '#f4e6c8']
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = goods[i % goods.length]
      ctx.beginPath()
      ctx.ellipse(-s * 0.14 + i * s * 0.09, -s * 0.34, s * 0.045, s * 0.035, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#1a120b'
    ctx.beginPath()
    ctx.arc(s * 0.02, -s * 0.72, s * 0.08, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1b4d3e'
    roundRect(ctx, -s * 0.1, -s * 0.62, s * 0.22, s * 0.32, 3)
    ctx.fill()
    ctx.fillStyle = '#1a120b'
    ctx.fillRect(-s * 0.08, -s * 0.3, s * 0.05, s * 0.16)
    ctx.fillRect(s * 0.02, -s * 0.3, s * 0.05, s * 0.16)
    ctx.fillStyle = '#c4512c'
    ctx.beginPath()
    ctx.arc(0, -s * 0.9, s * 0.2, Math.PI, 0)
    ctx.fill()
    ctx.fillStyle = '#f5c400'
    ctx.beginPath()
    ctx.arc(-s * 0.05, -s * 0.9, s * 0.1, Math.PI, 0)
    ctx.fill()
    if (text) labelText(ctx, text.slice(0, 9), -s * 0.48, s * 0.4, Math.max(6, s * 0.08), '#f4e6c8')
  },
  kiosk: (ctx, s, text) => {
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.beginPath()
    ctx.ellipse(0, 0, s * 0.36, s * 0.06, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f4e6c8'
    ctx.fillRect(-s * 0.36, -s * 0.5, s * 0.72, s * 0.5)
    ctx.fillStyle = '#d9c7a4'
    ctx.fillRect(-s * 0.36, -s * 0.22, s * 0.72, s * 0.22)
    ctx.fillStyle = '#8c3b22'
    ctx.beginPath()
    ctx.moveTo(-s * 0.46, -s * 0.5)
    ctx.lineTo(0, -s * 0.84)
    ctx.lineTo(s * 0.46, -s * 0.5)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#f5c400'
    ctx.beginPath()
    ctx.moveTo(-s * 0.4, -s * 0.5)
    ctx.lineTo(0, -s * 0.78)
    ctx.lineTo(s * 0.4, -s * 0.5)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#1b4d3e'
    roundRect(ctx, -s * 0.32, -s * 0.48, s * 0.64, s * 0.18, 2)
    ctx.fill()
    labelText(ctx, (text || 'POS').slice(0, 11), -s * 0.39, s * 0.56, Math.max(8, s * 0.1), '#f5c400')
    const goods = ['#c4512c', '#f5c400', '#2f6a3e', '#e7c07a', '#f4e6c8']
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = goods[i]
      ctx.fillRect(-s * 0.3 + i * s * 0.12, -s * 0.2, s * 0.1, s * 0.12)
    }
  },
  drop: (ctx, s, _text, hot) => {
    ctx.fillStyle = '#5a3a22'
    ctx.fillRect(-s * 0.03, -s * 0.72, s * 0.06, s * 0.72)
    if (hot) {
      ctx.shadowColor = '#f5c400'
      ctx.shadowBlur = Math.min(18, s * 0.24)
    }
    ctx.fillStyle = hot ? '#f5c400' : '#f4e6c8'
    roundRect(ctx, -s * 0.36, -s * 0.82, s * 0.72, s * 0.3, 4)
    ctx.fill()
    ctx.shadowBlur = 0
    labelText(ctx, hot ? 'DROP' : 'STOP', -s * 0.67, s * 0.6, Math.max(8, s * 0.14), '#1a120b')
  },
  cocoa: (ctx, s) => {
    ctx.fillStyle = '#a68458'
    ctx.fillRect(-s * 0.36, -s * 0.28, s * 0.72, s * 0.28)
    ctx.fillStyle = '#c4a574'
    ctx.fillRect(-s * 0.22, -s * 1.48, s * 0.44, s * 1.22)
    ctx.fillStyle = '#8c6239'
    ctx.fillRect(s * 0.06, -s * 1.48, s * 0.16, s * 1.22)
    ctx.fillStyle = '#f4e6c8'
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 2; col++) {
        ctx.fillRect(-s * 0.16 + col * s * 0.12, -s * 1.36 + row * s * 0.14, s * 0.06, s * 0.08)
      }
    }
    ctx.fillStyle = '#1b4d3e'
    ctx.fillRect(-s * 0.28, -s * 1.62, s * 0.56, s * 0.16)
    if (s > 26) labelText(ctx, 'COCOA HOUSE', -s * 1.54, s * 0.5, Math.max(8, s * 0.07), '#f5c400')
  },
  mapo: (ctx, s) => {
    ctx.fillStyle = '#d9c7a4'
    ctx.fillRect(-s * 0.52, -s * 0.12, s * 1.04, s * 0.12)
    ctx.fillRect(-s * 0.44, -s * 0.2, s * 0.88, s * 0.08)
    ctx.fillStyle = '#f4e6c8'
    ctx.fillRect(-s * 0.46, -s * 0.74, s * 0.92, s * 0.54)
    ctx.beginPath()
    ctx.moveTo(-s * 0.52, -s * 0.74)
    ctx.lineTo(0, -s * 1.05)
    ctx.lineTo(s * 0.52, -s * 0.74)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#1b4d3e'
    for (let i = 0; i < 5; i++) ctx.fillRect(-s * 0.36 + i * s * 0.16, -s * 0.64, s * 0.05, s * 0.44)
    ctx.fillStyle = '#8c3b22'
    ctx.fillRect(-s * 0.07, -s * 0.34, s * 0.14, s * 0.2)
  },
  tower: (ctx, s) => {
    ctx.fillStyle = '#8a7358'
    ctx.fillRect(-s * 0.16, -s * 1.2, s * 0.32, s * 1.2)
    ctx.fillStyle = '#b5a48a'
    ctx.fillRect(-s * 0.16, -s * 1.2, s * 0.1, s * 1.2)
    ctx.fillStyle = '#6e5a42'
    ctx.fillRect(-s * 0.26, -s * 0.48, s * 0.52, s * 0.07)
    ctx.fillStyle = '#f4e6c8'
    for (let i = 0; i < 4; i++) ctx.fillRect(-s * 0.22 + i * s * 0.12, -s * 0.64, s * 0.025, s * 0.16)
    ctx.fillStyle = '#6e5a42'
    ctx.fillRect(-s * 0.2, -s * 1.28, s * 0.4, s * 0.08)
    ctx.fillStyle = '#f4e6c8'
    for (let i = 0; i < 3; i++) ctx.fillRect(-s * 0.14 + i * s * 0.1, -s * 1.4, s * 0.025, s * 0.12)
  },
  premier: (ctx, s) => {
    ctx.fillStyle = '#e7e0d4'
    ctx.fillRect(-s * 0.28, -s * 0.95, s * 0.56, s * 0.95)
    ctx.fillStyle = '#f7f1e4'
    ctx.beginPath()
    ctx.ellipse(0, -s * 0.95, s * 0.28, s * 0.1, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1b4d3e'
    for (let row = 0; row < 5; row++) {
      ctx.fillRect(-s * 0.2, -s * 0.82 + row * s * 0.15, s * 0.4, s * 0.045)
    }
    if (s > 24) labelText(ctx, 'PREMIER', -s * 0.22, s * 0.4, Math.max(8, s * 0.08), '#1a120b')
  },
  terminal: (ctx, s) => {
    ctx.fillStyle = '#8a8f86'
    ctx.fillRect(-s * 0.46, -s * 0.1, s * 0.08, s * 0.1)
    ctx.fillRect(s * 0.38, -s * 0.1, s * 0.08, s * 0.1)
    ctx.fillStyle = 'rgba(186, 214, 206, 0.95)'
    ctx.fillRect(-s * 0.4, -s * 0.55, s * 0.8, s * 0.42)
    ctx.fillStyle = '#1b4d3e'
    roundRect(ctx, -s * 0.5, -s * 0.72, s, s * 0.16, 3)
    ctx.fill()
    labelText(ctx, 'TERMINAL', -s * 0.64, s * 0.8, Math.max(8, s * 0.1), '#f4e6c8')
  },
  sign: (ctx, s, text) => {
    ctx.fillStyle = '#5a3a22'
    ctx.fillRect(-s * 0.03, -s * 0.5, s * 0.06, s * 0.5)
    ctx.fillStyle = '#1b4d3e'
    roundRect(ctx, -s * 0.46, -s * 0.82, s * 0.92, s * 0.34, 4)
    ctx.fill()
    labelText(ctx, (text || 'IBADAN').toUpperCase(), -s * 0.65, s * 0.8, Math.max(8, s * 0.13), '#f5c400')
  },
  bay: (ctx, s) => {
    ctx.fillStyle = '#b7b1a6'
    ctx.fillRect(-s * 0.62, -s * 0.08, s * 1.24, s * 0.1)
    ctx.fillStyle = '#8f8980'
    ctx.fillRect(-s * 0.62, -s * 0.12, s * 1.24, s * 0.04)
    ctx.fillStyle = '#3a332c'
    ctx.fillRect(-s * 0.48, -s * 0.78, s * 0.07, s * 0.7)
    ctx.fillRect(s * 0.41, -s * 0.78, s * 0.07, s * 0.7)
    ctx.fillStyle = '#0f3329'
    ctx.beginPath()
    ctx.moveTo(-s * 0.58, -s * 0.78)
    ctx.lineTo(-s * 0.46, -s * 0.96)
    ctx.lineTo(s * 0.58, -s * 0.96)
    ctx.lineTo(s * 0.46, -s * 0.78)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#1b4d3e'
    ctx.fillRect(-s * 0.56, -s * 0.84, s * 1.12, s * 0.08)
    ctx.fillStyle = '#6b4a2a'
    ctx.fillRect(-s * 0.32, -s * 0.28, s * 0.64, s * 0.07)
    ctx.fillRect(-s * 0.26, -s * 0.21, s * 0.05, s * 0.14)
    ctx.fillRect(s * 0.21, -s * 0.21, s * 0.05, s * 0.14)
    ctx.fillStyle = BRAND.gold
    roundRect(ctx, -s * 0.24, -s * 0.7, s * 0.48, s * 0.18, 2)
    ctx.fill()
    labelText(ctx, 'STOP', -s * 0.61, s * 0.4, Math.max(8, s * 0.1), '#1a120b')
  },
  gantry: (ctx, s, text) => {
    drawGantry(ctx, 0, 0, s * 1.15, text, s * 6)
  },
  streetlight: (ctx, s) => {
    ctx.fillStyle = '#3a3f44'
    ctx.fillRect(-s * 0.025, -s * 1.1, s * 0.05, s * 1.1)
    ctx.fillRect(-s * 0.06, -s * 0.06, s * 0.12, s * 0.06)
    ctx.fillStyle = '#4a5056'
    ctx.beginPath()
    ctx.moveTo(-s * 0.02, -s * 1.1)
    ctx.quadraticCurveTo(0, -s * 1.2, s * 0.22, -s * 1.18)
    ctx.lineTo(s * 0.22, -s * 1.14)
    ctx.quadraticCurveTo(s * 0.02, -s * 1.14, s * 0.02, -s * 1.08)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#f6e7b0'
    roundRect(ctx, s * 0.14, -s * 1.16, s * 0.14, s * 0.04, 2)
    ctx.fill()
    ctx.fillStyle = '#c4512c'
    ctx.fillRect(-s * 0.035, -s * 0.5, s * 0.07, s * 0.04)
    ctx.fillStyle = '#f4e6c8'
    ctx.fillRect(-s * 0.035, -s * 0.46, s * 0.07, s * 0.04)
  },
  billboard: (ctx, s, text) => {
    ctx.fillStyle = '#2c261f'
    ctx.fillRect(-s * 0.42, -s * 0.9, s * 0.06, s * 0.9)
    ctx.fillRect(s * 0.36, -s * 0.9, s * 0.06, s * 0.9)
    ctx.fillStyle = '#4a4036'
    ctx.fillRect(-s * 0.62, -s * 0.94, s * 1.24, s * 0.04)
    ctx.fillStyle = '#0c241c'
    roundRect(ctx, -s * 0.62, -s * 1.36, s * 1.24, s * 0.46, 4)
    ctx.fill()
    ctx.fillStyle = '#f4e6c8'
    roundRect(ctx, -s * 0.58, -s * 1.32, s * 1.16, s * 0.38, 3)
    ctx.fill()
    ctx.fillStyle = '#c4512c'
    ctx.fillRect(-s * 0.58, -s * 1.32, s * 0.12, s * 0.38)
    ctx.fillStyle = BRAND.gold
    ctx.fillRect(-s * 0.46, -s * 0.98, s * 1.04, s * 0.04)
    ctx.save()
    ctx.translate(s * 0.06, 0)
    labelText(ctx, (text || 'IBADAN').toUpperCase(), -s * 1.14, s * 0.96, Math.max(8, s * 0.16), '#1b4d3e')
    ctx.restore()
  },
  pylon: (ctx, s, text) => {
    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    ctx.beginPath()
    ctx.ellipse(0, 0, s * 0.18, s * 0.05, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#2c261f'
    ctx.fillRect(-s * 0.055, -s * 1.62, s * 0.11, s * 1.62)
    ctx.fillStyle = '#4a4036'
    ctx.fillRect(-s * 0.055, -s * 1.62, s * 0.035, s * 1.62)
    ctx.fillStyle = '#1a1612'
    ctx.fillRect(-s * 0.1, -s * 1.66, s * 0.2, s * 0.06)
    ctx.fillStyle = '#0c241c'
    roundRect(ctx, -s * 0.72, -s * 2.12, s * 1.44, s * 0.52, 5)
    ctx.fill()
    ctx.fillStyle = '#f4e6c8'
    roundRect(ctx, -s * 0.66, -s * 2.06, s * 1.32, s * 0.4, 4)
    ctx.fill()
    ctx.fillStyle = '#c4512c'
    ctx.fillRect(-s * 0.66, -s * 2.06, s * 0.1, s * 0.4)
    ctx.fillStyle = BRAND.gold
    ctx.fillRect(-s * 0.56, -s * 1.7, s * 1.12, s * 0.04)
    labelText(ctx, (text || 'IBADAN').toUpperCase(), -s * 1.86, s * 1.12, Math.max(8, s * 0.16), '#1b4d3e')
  },
  coin: (ctx, s) => {
    const t = performance.now() / 1000
    const squash = 0.22 + Math.abs(Math.sin(t * 6)) * 0.78
    const lift = s * 0.62 + Math.sin(t * 4) * s * 0.05
    ctx.fillStyle = 'rgba(0,0,0,0.28)'
    ctx.beginPath()
    ctx.ellipse(0, 0, s * 0.18, s * 0.05, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#c99200'
    ctx.beginPath()
    ctx.ellipse(0, -lift, s * 0.22, s * 0.22 * squash, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffe56a'
    ctx.beginPath()
    ctx.ellipse(0, -lift, s * 0.14, s * 0.14 * squash, 0, 0, Math.PI * 2)
    ctx.fill()
    if (squash > 0.55) {
      ctx.fillStyle = '#8c3b22'
      ctx.font = `700 ${Math.max(7, s * 0.18)}px Outfit, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('₦', 0, -lift)
    }
  },
  boost: (ctx, s) => {
    const t = performance.now() / 1000
    const lift = s * 0.7 + Math.sin(t * 5) * s * 0.06
    const pulse = 0.92 + Math.sin(t * 8) * 0.08
    ctx.fillStyle = 'rgba(0,0,0,0.28)'
    ctx.beginPath()
    ctx.ellipse(0, 0, s * 0.2, s * 0.055, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ff7a18'
    ctx.beginPath()
    ctx.arc(0, -lift, s * 0.26 * pulse, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffe08a'
    ctx.beginPath()
    ctx.arc(0, -lift, s * 0.16 * pulse, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#c4512c'
    ctx.beginPath()
    ctx.moveTo(s * 0.04, -lift - s * 0.16)
    ctx.lineTo(-s * 0.1, -lift + s * 0.01)
    ctx.lineTo(-s * 0.01, -lift + s * 0.01)
    ctx.lineTo(-s * 0.06, -lift + s * 0.16)
    ctx.lineTo(s * 0.1, -lift - s * 0.02)
    ctx.lineTo(s * 0.01, -lift - s * 0.02)
    ctx.closePath()
    ctx.fill()
  },
}

export function drawGantry(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  label: string,
  viewWidth: number,
  viewHeight = viewWidth * 0.62,
) {
  if (w < 14) return
  const leftPost = x + DRIVE_LEFT * w
  const rightPost = x + DRIVE_RIGHT * w
  const boardCenter = x + FOCUS_X * w
  const boardW = w * 1.02
  const boardH = Math.max(12, boardW * 0.16)
  // Rise with the road width so the board climbs off the top as you approach.
  // Tall screens need a higher span or the sign sinks into the view.
  const rise = w * Math.max(1.2, 1.65 * (viewHeight / Math.max(1, viewWidth)))
  const post = Math.max(2, Math.min(w * 0.028, 14))
  const top = y - rise
  const boardX = boardCenter - boardW / 2
  const boardY = top - boardH * 0.15
  if (boardY + boardH < 0) return
  const leaving = boardY < boardH
  const alpha = leaving ? Math.max(0, (boardY + boardH) / (boardH * 2)) : 1
  if (alpha < 0.05) return
  ctx.save()
  ctx.globalAlpha = alpha

  ctx.fillStyle = '#2c261f'
  ctx.fillRect(leftPost - post / 2, top, post, y - top)
  ctx.fillRect(rightPost - post / 2, top, post, y - top)
  ctx.fillStyle = '#4a4036'
  ctx.fillRect(leftPost - post / 2, top, post * 0.35, y - top)
  ctx.fillRect(rightPost - post / 2, top, post * 0.35, y - top)

  ctx.fillStyle = '#1a1612'
  ctx.fillRect(leftPost - post, top + boardH * 0.2, rightPost - leftPost + post * 2, Math.max(3, w * 0.03))
  ctx.fillStyle = '#3d342c'
  ctx.fillRect(leftPost - post, top, rightPost - leftPost + post * 2, Math.max(3, w * 0.03))

  ctx.fillStyle = '#0c241c'
  ctx.fillRect(boardX + w * 0.015, boardY + boardH * 0.12, boardW, boardH)
  ctx.fillStyle = '#1b4d3e'
  roundRect(ctx, boardX, boardY, boardW, boardH, Math.min(6, boardH * 0.15))
  ctx.fill()
  ctx.fillStyle = '#246454'
  ctx.fillRect(boardX, boardY, boardW, Math.max(2, boardH * 0.16))
  ctx.fillStyle = BRAND.gold
  ctx.fillRect(boardX, boardY, boardW, Math.max(2, boardH * 0.07))

  ctx.save()
  ctx.translate(boardCenter, boardY + boardH * 0.58)
  labelText(ctx, (label || 'IBADAN').toUpperCase(), 0, boardW * 0.86, Math.max(8, boardH * 0.42), '#f5c400')
  ctx.restore()

  const oncomingX = x + ((ONCOMING_OUTER + ONCOMING_INNER) / 2) * w
  const tagW = Math.min(w * 0.32, viewWidth * 0.18)
  const tagH = boardH * 0.62
  const tagX = oncomingX - tagW / 2
  ctx.fillStyle = '#8c3b22'
  roundRect(ctx, tagX, boardY + boardH * 0.2, tagW, tagH, 3)
  ctx.fill()
  ctx.save()
  ctx.translate(oncomingX, boardY + boardH * 0.2 + tagH / 2)
  labelText(ctx, 'ONCOMING', 0, tagW * 0.86, Math.max(7, tagH * 0.5), '#f4e6c8')
  ctx.restore()
  ctx.restore()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

export interface TrainEnd {
  x: number
  y: number
  w: number
}

/**
 * One coach of the median train, in road perspective.
 * The side facing the Micra carries the slogan.
 */
export function drawTrainCar(
  ctx: CanvasRenderingContext2D,
  near: TrainEnd,
  far: TrainEnd,
  slogan: string,
  role: 'engine' | 'coach' | 'tail',
) {
  if (near.w < 5 || far.w < 2) return
  const half = 0.17
  const off = WALK_CENTER
  const body = role === 'engine' ? 0.5 : 0.44
  const nl = near.x + (off - half) * near.w
  const nr = near.x + (off + half) * near.w
  const fl = far.x + (off - half) * far.w
  const fr = far.x + (off + half) * far.w
  const nh = near.w * body
  const fh = far.w * body
  const along = (t: number) => ({
    x: nr + (fr - nr) * t,
    y: near.y + (far.y - near.y) * t,
    h: nh + (fh - nh) * t,
    s: near.w + (far.w - near.w) * t,
  })

  ctx.save()
  ctx.fillStyle = 'rgba(26, 18, 11, 0.28)'
  poly(ctx, nl, near.y, nr + near.w * 0.03, near.y, fr + far.w * 0.02, far.y, fl, far.y)

  ctx.fillStyle = role === 'engine' ? '#6e3018' : '#d9c7a4'
  poly(ctx, nl, near.y, fl, far.y, fl, far.y - fh, nl, near.y - nh)

  ctx.fillStyle = BRAND.rust
  poly(ctx, nl, near.y - nh, nr, near.y - nh, fr, far.y - fh, fl, far.y - fh)
  ctx.fillStyle = BRAND.gold
  poly(ctx, nr, near.y - nh, nr, near.y - nh + nh * 0.06, fr, far.y - fh + fh * 0.06, fr, far.y - fh)

  ctx.fillStyle = role === 'engine' ? BRAND.rust : BRAND.cream
  poly(ctx, nr, near.y, fr, far.y, fr, far.y - fh, nr, near.y - nh)

  ctx.fillStyle = role === 'engine' ? BRAND.ink : BRAND.rustDeep
  poly(ctx, nr, near.y, fr, far.y, fr, far.y - fh * 0.14, nr, near.y - nh * 0.14)

  ctx.fillStyle = BRAND.green
  poly(ctx, nr, near.y - nh * 0.4, fr, far.y - fh * 0.4, fr, far.y - fh * 0.74, nr, near.y - nh * 0.74)

  ctx.fillStyle = role === 'engine' ? '#9fd4c8' : '#e7f3ee'
  const panes = role === 'engine' ? 3 : 5
  for (let i = 0; i < panes; i++) {
    const a = 0.12 + (i / panes) * 0.76
    const b = a + 0.76 / panes - 0.035
    const p0 = along(a)
    const p1 = along(b)
    poly(
      ctx,
      p0.x,
      p0.y - p0.h * 0.46,
      p1.x,
      p1.y - p1.h * 0.46,
      p1.x,
      p1.y - p1.h * 0.68,
      p0.x,
      p0.y - p0.h * 0.68,
    )
  }

  ctx.fillStyle = BRAND.gold
  poly(ctx, nr, near.y - nh * 0.16, fr, far.y - fh * 0.16, fr, far.y - fh * 0.38, nr, near.y - nh * 0.38)

  if (near.w > 22 && slogan) {
    for (const t of [0.3, 0.68]) {
      const spot = along(t)
      if (spot.s < 20) continue
      const band = Math.abs(spot.h * 0.28)
      let size = Math.max(12, Math.min(band * 0.72, spot.s * 0.12))
      ctx.save()
      ctx.beginPath()
      const a = along(Math.max(0.05, t - 0.18))
      const b = along(Math.min(0.95, t + 0.18))
      ctx.moveTo(a.x, a.y - a.h * 0.42)
      ctx.lineTo(b.x, b.y - b.h * 0.42)
      ctx.lineTo(b.x, b.y - b.h * 0.72)
      ctx.lineTo(a.x, a.y - a.h * 0.72)
      ctx.closePath()
      ctx.clip()
      ctx.fillStyle = BRAND.gold
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `700 ${size}px Outfit, sans-serif`
      const span = Math.hypot(b.x - a.x, b.y - a.y) * 0.92
      while (size > 11 && ctx.measureText(slogan).width > span) {
        size -= 1
        ctx.font = `700 ${size}px Outfit, sans-serif`
      }
      ctx.fillText(slogan, spot.x, spot.y - spot.h * 0.57)
      ctx.restore()
    }
  }

  ctx.fillStyle = BRAND.ink
  for (const t of role === 'engine' ? [0.22, 0.48, 0.78] : [0.18, 0.4, 0.62, 0.84]) {
    const p = along(t)
    const r = Math.max(1.3, p.s * 0.028)
    ctx.beginPath()
    ctx.arc(p.x - p.s * 0.02, p.y - r * 0.15, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = BRAND.gold
    ctx.beginPath()
    ctx.arc(p.x - p.s * 0.02, p.y - r * 0.15, r * 0.38, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = BRAND.ink
  }

  ctx.fillStyle = role === 'tail' ? BRAND.green : role === 'engine' ? BRAND.rustDeep : '#e7d3ae'
  poly(ctx, nl, near.y, nr, near.y, nr, near.y - nh, nl, near.y - nh)
  ctx.fillStyle = BRAND.gold
  poly(ctx, nl, near.y - nh * 0.2, nr, near.y - nh * 0.2, nr, near.y - nh * 0.28, nl, near.y - nh * 0.28)
  if (role === 'tail' && near.w > 16) {
    ctx.save()
    ctx.translate((nl + nr) / 2, near.y - nh * 0.55)
    labelText(ctx, 'IBADAN', 0, Math.abs(nr - nl) * 0.82, Math.max(8, nh * 0.16), BRAND.gold)
    ctx.restore()
  } else if (role === 'engine' && near.w > 16) {
    ctx.fillStyle = BRAND.cream
    poly(ctx, nl + (nr - nl) * 0.18, near.y - nh * 0.42, nr - (nr - nl) * 0.18, near.y - nh * 0.42, nr - (nr - nl) * 0.22, near.y - nh * 0.62, nl + (nr - nl) * 0.22, near.y - nh * 0.62)
    ctx.fillStyle = '#fff4c4'
    ctx.beginPath()
    ctx.arc(nl + (nr - nl) * 0.28, near.y - nh * 0.34, Math.max(1.4, near.w * 0.02), 0, Math.PI * 2)
    ctx.arc(nl + (nr - nl) * 0.72, near.y - nh * 0.34, Math.max(1.4, near.w * 0.02), 0, Math.PI * 2)
    ctx.fill()
    ctx.save()
    ctx.translate((nl + nr) / 2, near.y - nh * 0.78)
    labelText(ctx, 'IBADAN', 0, Math.abs(nr - nl) * 0.8, Math.max(8, nh * 0.14), BRAND.gold)
    ctx.restore()
  }
  ctx.restore()
}

/* ------------------------------------------------------------------ */
/* Traffic. Drawn in a unit box one vehicle-width wide, ground at y=0. */
/* ------------------------------------------------------------------ */

const CAR_PAINT = ['#c9ccd1', '#2f3e57', '#7a1f1f', '#e8e4da', '#262626', '#3e6b4f', '#8a6a3a']
const TRUCK_PAINT = ['#1f5f8b', '#a83a2a', '#e6e1d4', '#2f6a3e']

export function drawVehicle(
  ctx: CanvasRenderingContext2D,
  kind: TrafficKind,
  x: number,
  y: number,
  w: number,
  front: boolean,
  seed: number,
  label: string,
  faded: boolean,
) {
  if (w < 2) return
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(w, w)
  if (faded) ctx.globalAlpha = 0.45
  ctx.lineWidth = 0.02
  if (kind === 'pothole') paintPothole(ctx)
  else {
    shadow(ctx, kind === 'okada' ? 0.9 : 0.56)
    if (kind === 'car') paintCar(ctx, front, CAR_PAINT[seed % CAR_PAINT.length])
    else if (kind === 'danfo') paintDanfo(ctx, front, label, w)
    else if (kind === 'keke') paintKeke(ctx, front)
    else if (kind === 'okada') paintOkada(ctx, front, seed)
    else paintTruck(ctx, front, TRUCK_PAINT[seed % TRUCK_PAINT.length], w)
  }
  ctx.restore()
}

function shadow(ctx: CanvasRenderingContext2D, rx: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.beginPath()
  ctx.ellipse(0, 0, rx, 0.07, 0, 0, Math.PI * 2)
  ctx.fill()
}

function tyre(ctx: CanvasRenderingContext2D, x: number, w: number, h: number) {
  ctx.fillStyle = '#121010'
  roundRect(ctx, x - w / 2, -h, w, h, 0.03)
  ctx.fill()
}

function lights(ctx: CanvasRenderingContext2D, front: boolean, y: number, inset: number, size: number) {
  if (front) {
    ctx.save()
    ctx.shadowColor = 'rgba(255, 240, 190, 0.9)'
    ctx.shadowBlur = 8
    ctx.fillStyle = '#fff4cf'
    roundRect(ctx, -0.5 + inset, y, size, size * 0.55, 0.02)
    ctx.fill()
    roundRect(ctx, 0.5 - inset - size, y, size, size * 0.55, 0.02)
    ctx.fill()
    ctx.restore()
    ctx.fillStyle = '#f5a623'
    ctx.fillRect(-0.5 + inset, y + size * 0.6, size * 0.4, size * 0.18)
    ctx.fillRect(0.5 - inset - size * 0.4, y + size * 0.6, size * 0.4, size * 0.18)
    return
  }
  ctx.fillStyle = '#c0261c'
  roundRect(ctx, -0.5 + inset, y, size, size * 0.5, 0.02)
  ctx.fill()
  roundRect(ctx, 0.5 - inset - size, y, size, size * 0.5, 0.02)
  ctx.fill()
  ctx.fillStyle = '#ff8a6a'
  ctx.fillRect(-0.5 + inset + size * 0.1, y + size * 0.1, size * 0.3, size * 0.14)
  ctx.fillRect(0.5 - inset - size * 0.4, y + size * 0.1, size * 0.3, size * 0.14)
}

function paintCar(ctx: CanvasRenderingContext2D, front: boolean, paint: string) {
  tyre(ctx, -0.4, 0.16, 0.12)
  tyre(ctx, 0.4, 0.16, 0.12)

  ctx.fillStyle = mixHex(paint, '#000000', 0.35)
  roundRect(ctx, -0.46, -0.22, 0.92, 0.14, 0.04)
  ctx.fill()

  ctx.fillStyle = paint
  roundRect(ctx, -0.5, -0.5, 1, 0.32, 0.08)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.fillRect(-0.46, -0.48, 0.92, 0.05)

  ctx.fillStyle = mixHex(paint, '#111111', 0.22)
  ctx.beginPath()
  ctx.moveTo(-0.38, -0.48)
  ctx.lineTo(-0.26, -0.78)
  ctx.lineTo(0.26, -0.78)
  ctx.lineTo(0.38, -0.48)
  ctx.closePath()
  ctx.fill()

  const glass = ctx.createLinearGradient(0, -0.76, 0, -0.5)
  glass.addColorStop(0, front ? '#6d8f9c' : '#24343a')
  glass.addColorStop(1, front ? '#b3d0d6' : '#12181c')
  ctx.fillStyle = glass
  ctx.beginPath()
  ctx.moveTo(-0.32, -0.5)
  ctx.lineTo(-0.22, -0.74)
  ctx.lineTo(0.22, -0.74)
  ctx.lineTo(0.32, -0.5)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = mixHex(paint, '#ffffff', 0.08)
  ctx.fillRect(-0.18, -0.72, 0.36, 0.08)

  if (front) {
    ctx.fillStyle = '#1a120b'
    ctx.beginPath()
    ctx.arc(-0.12, -0.58, 0.055, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-0.2, -0.54, 0.14, 0.03)
    ctx.fillStyle = '#1c1c1c'
    roundRect(ctx, -0.18, -0.4, 0.36, 0.1, 0.02)
    ctx.fill()
    ctx.fillStyle = '#9aa0a6'
    ctx.fillRect(-0.16, -0.36, 0.32, 0.015)
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(-0.2, -0.7, 0.12, 0.03)
  }

  lights(ctx, front, -0.42, 0.04, 0.2)

  ctx.fillStyle = '#1e1e1e'
  roundRect(ctx, -0.5, -0.16, 1, 0.08, 0.03)
  ctx.fill()
  ctx.fillStyle = '#f4f1e6'
  ctx.fillRect(-0.14, -0.26, 0.28, 0.08)
  ctx.fillStyle = '#1b4d3e'
  ctx.fillRect(-0.14, -0.26, 0.28, 0.018)
}

function paintDanfo(ctx: CanvasRenderingContext2D, front: boolean, label: string, px: number) {
  tyre(ctx, -0.37, 0.15, 0.15)
  tyre(ctx, 0.37, 0.15, 0.15)

  ctx.fillStyle = '#f5c400'
  roundRect(ctx, -0.5, -1.08, 1, 0.96, 0.08)
  ctx.fill()
  ctx.fillStyle = mixHex('#f5c400', '#000000', 0.18)
  ctx.beginPath()
  ctx.moveTo(-0.42, -1.02)
  ctx.lineTo(-0.3, -1.28)
  ctx.lineTo(0.3, -1.28)
  ctx.lineTo(0.42, -1.02)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#5a3a22'
  ctx.fillRect(-0.36, -1.3, 0.72, 0.05)
  ctx.fillStyle = '#8c6239'
  ctx.fillRect(-0.3, -1.4, 0.22, 0.1)
  ctx.fillStyle = '#c4a574'
  ctx.fillRect(-0.04, -1.37, 0.18, 0.07)
  ctx.fillStyle = '#2f6a3e'
  ctx.fillRect(0.16, -1.39, 0.14, 0.09)
  ctx.fillStyle = '#d9a900'
  ctx.fillRect(-0.5, -0.22, 1, 0.08)

  ctx.fillStyle = '#1a120b'
  ctx.fillRect(-0.5, -0.52, 1, 0.045)
  ctx.fillRect(-0.5, -0.45, 1, 0.025)

  const glass = ctx.createLinearGradient(0, -1.22, 0, -0.62)
  glass.addColorStop(0, front ? '#5d7f8c' : '#1b2a2a')
  glass.addColorStop(1, front ? '#a7c6cc' : '#0e1616')
  ctx.fillStyle = glass
  roundRect(ctx, -0.4, front ? -0.9 : -1.18, 0.8, front ? 0.32 : 0.28, 0.04)
  ctx.fill()

  if (front) {
    ctx.fillStyle = '#1a120b'
    roundRect(ctx, -0.42, -0.99, 0.84, 0.11, 0.03)
    ctx.fill()
    if (px > 40) {
      ctx.save()
      ctx.translate(0, -0.935)
      ctx.scale(1 / px, 1 / px)
      labelText(ctx, (label || 'IBADAN').slice(0, 10), 0, px * 0.78, Math.max(7, px * 0.08), '#f5c400')
      ctx.restore()
    }
    ctx.fillStyle = '#1a120b'
    ctx.beginPath()
    ctx.arc(-0.2, -0.66, 0.07, 0, Math.PI * 2)
    ctx.arc(0.18, -0.68, 0.065, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#2b2b2b'
    roundRect(ctx, -0.22, -0.38, 0.44, 0.12, 0.02)
    ctx.fill()
    lights(ctx, true, -0.38, 0.04, 0.16)
  } else {
    ctx.fillStyle = 'rgba(244, 230, 200, 0.75)'
    ctx.beginPath()
    ctx.arc(-0.22, -0.72, 0.07, 0, Math.PI * 2)
    ctx.arc(0, -0.74, 0.07, 0, Math.PI * 2)
    ctx.arc(0.22, -0.71, 0.07, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#b8860b'
    ctx.fillRect(-0.01, -0.58, 0.02, 0.36)
    if (px > 40) {
      ctx.save()
      ctx.translate(0, -0.33)
      ctx.scale(1 / px, 1 / px)
      labelText(ctx, 'NO KING AS GOD', 0, px * 0.6, Math.max(6, px * 0.055), '#1a120b')
      ctx.restore()
    }
    ctx.fillStyle = '#9a2218'
    roundRect(ctx, -0.46, -0.42, 0.1, 0.18, 0.02)
    ctx.fill()
    roundRect(ctx, 0.36, -0.42, 0.1, 0.18, 0.02)
    ctx.fill()
  }

  ctx.fillStyle = '#1e1e1e'
  roundRect(ctx, -0.5, -0.17, 1, 0.08, 0.03)
  ctx.fill()
}

function paintKeke(ctx: CanvasRenderingContext2D, front: boolean) {
  if (front) {
    tyre(ctx, 0, 0.12, 0.16)
    tyre(ctx, -0.4, 0.1, 0.12)
    tyre(ctx, 0.4, 0.1, 0.12)
  } else {
    tyre(ctx, -0.4, 0.14, 0.16)
    tyre(ctx, 0.4, 0.14, 0.16)
  }

  ctx.fillStyle = '#1b4d3e'
  ctx.beginPath()
  ctx.moveTo(-0.48, -0.14)
  ctx.lineTo(-0.5, -0.86)
  ctx.quadraticCurveTo(-0.48, -1.08, 0, -1.1)
  ctx.quadraticCurveTo(0.48, -1.08, 0.5, -0.86)
  ctx.lineTo(0.48, -0.14)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = BRAND.gold
  ctx.fillRect(-0.5, -0.88, 1, 0.06)
  ctx.fillRect(-0.48, -0.36, 0.96, 0.05)

  if (front) {
    const glass = ctx.createLinearGradient(0, -0.84, 0, -0.5)
    glass.addColorStop(0, '#6f9099')
    glass.addColorStop(1, '#b6d2d6')
    ctx.fillStyle = glass
    roundRect(ctx, -0.36, -0.8, 0.72, 0.36, 0.05)
    ctx.fill()
    ctx.fillStyle = '#1a120b'
    ctx.beginPath()
    ctx.arc(0, -0.6, 0.08, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(-0.12, -0.52, 0.24, 0.08)
    ctx.save()
    ctx.shadowColor = 'rgba(255, 240, 190, 0.9)'
    ctx.shadowBlur = 8
    ctx.fillStyle = '#fff4cf'
    ctx.beginPath()
    ctx.arc(0, -0.24, 0.06, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  } else {
    ctx.fillStyle = '#d7efe4'
    roundRect(ctx, -0.3, -0.8, 0.6, 0.2, 0.04)
    ctx.fill()
    ctx.fillStyle = '#1a120b'
    ctx.beginPath()
    ctx.arc(-0.14, -0.66, 0.06, 0, Math.PI * 2)
    ctx.arc(0.14, -0.67, 0.06, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#0f3329'
    roundRect(ctx, -0.4, -0.54, 0.8, 0.16, 0.03)
    ctx.fill()
    ctx.fillStyle = '#121010'
    ctx.beginPath()
    ctx.arc(0, -0.46, 0.09, 0, Math.PI * 2)
    ctx.fill()
    lights(ctx, false, -0.3, 0.06, 0.14)
  }
  ctx.fillStyle = '#1e1e1e'
  ctx.fillRect(-0.46, -0.18, 0.92, 0.05)
}

function paintOkada(ctx: CanvasRenderingContext2D, front: boolean, seed: number) {
  const shirts = ['#c4512c', '#2f3e57', '#1b4d3e', '#e8e4da']
  tyre(ctx, 0, 0.26, 0.5)
  ctx.fillStyle = '#2a2a2a'
  roundRect(ctx, -0.32, -0.9, 0.64, 0.4, 0.08)
  ctx.fill()
  ctx.fillStyle = '#1a120b'
  ctx.fillRect(-0.9, -1.12, 1.8, 0.07)

  ctx.fillStyle = '#1a120b'
  ctx.fillRect(-0.36, -0.72, 0.18, 0.36)
  ctx.fillRect(0.18, -0.72, 0.18, 0.36)

  ctx.fillStyle = shirts[seed % shirts.length]
  ctx.beginPath()
  ctx.moveTo(-0.48, -0.78)
  ctx.lineTo(-0.56, -1.5)
  ctx.quadraticCurveTo(0, -1.66, 0.56, -1.5)
  ctx.lineTo(0.48, -0.78)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = shirts[seed % shirts.length]
  ctx.lineWidth = 0.16
  ctx.beginPath()
  ctx.moveTo(-0.5, -1.42)
  ctx.lineTo(-0.82, -1.12)
  ctx.moveTo(0.5, -1.42)
  ctx.lineTo(0.82, -1.12)
  ctx.stroke()

  ctx.fillStyle = front ? '#6b4a2a' : '#1a120b'
  ctx.beginPath()
  ctx.arc(0, -1.78, 0.24, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#f5c400'
  ctx.beginPath()
  ctx.arc(0, -1.84, 0.26, Math.PI, 0)
  ctx.fill()
  ctx.fillRect(-0.28, -1.86, 0.56, 0.06)

  if (front) {
    ctx.save()
    ctx.shadowColor = 'rgba(255, 240, 190, 0.95)'
    ctx.shadowBlur = 10
    ctx.fillStyle = '#fff4cf'
    ctx.beginPath()
    ctx.arc(0, -0.9, 0.16, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  } else {
    ctx.fillStyle = '#c0261c'
    roundRect(ctx, -0.14, -0.56, 0.28, 0.12, 0.03)
    ctx.fill()
    ctx.fillStyle = '#f4f1e6'
    ctx.fillRect(-0.18, -0.42, 0.36, 0.14)
  }
}

function paintTruck(ctx: CanvasRenderingContext2D, front: boolean, paint: string, px: number) {
  tyre(ctx, -0.4, 0.16, 0.17)
  tyre(ctx, -0.24, 0.12, 0.15)
  tyre(ctx, 0.24, 0.12, 0.15)
  tyre(ctx, 0.4, 0.16, 0.17)

  if (front) {
    ctx.fillStyle = mixHex(paint, '#000000', 0.2)
    ctx.fillRect(-0.48, -1.46, 0.96, 0.22)
    ctx.fillStyle = paint
    roundRect(ctx, -0.5, -1.28, 1, 1.14, 0.06)
    ctx.fill()
    ctx.fillStyle = mixHex(paint, '#000000', 0.25)
    ctx.beginPath()
    ctx.moveTo(-0.4, -1.22)
    ctx.lineTo(-0.28, -1.52)
    ctx.lineTo(0.28, -1.52)
    ctx.lineTo(0.4, -1.22)
    ctx.closePath()
    ctx.fill()
    const glass = ctx.createLinearGradient(0, -1.2, 0, -0.74)
    glass.addColorStop(0, '#5d7f8c')
    glass.addColorStop(1, '#a7c6cc')
    ctx.fillStyle = glass
    roundRect(ctx, -0.42, -1.16, 0.84, 0.36, 0.04)
    ctx.fill()
    ctx.fillStyle = '#1a120b'
    ctx.fillRect(-0.01, -1.12, 0.02, 0.36)
    ctx.beginPath()
    ctx.arc(-0.22, -0.88, 0.07, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#2b2b2b'
    roundRect(ctx, -0.3, -0.64, 0.6, 0.3, 0.03)
    ctx.fill()
    ctx.fillStyle = '#8a8f86'
    for (let i = 0; i < 4; i++) ctx.fillRect(-0.26, -0.6 + i * 0.07, 0.52, 0.025)
    lights(ctx, true, -0.34, 0.03, 0.14)
  } else {
    ctx.fillStyle = paint
    roundRect(ctx, -0.5, -1.52, 1, 1.26, 0.04)
    ctx.fill()
    ctx.fillStyle = mixHex(paint, '#000000', 0.22)
    ctx.fillRect(-0.01, -1.46, 0.02, 1.16)
    ctx.fillRect(-0.44, -1.44, 0.03, 1.12)
    ctx.fillRect(0.41, -1.44, 0.03, 1.12)
    ctx.fillStyle = mixHex(paint, '#ffffff', 0.08)
    ctx.fillRect(-0.36, -1.48, 0.72, 0.16)
    ctx.fillStyle = '#d7cbb8'
    ctx.fillRect(-0.1, -0.86, 0.06, 0.12)
    ctx.fillRect(0.04, -0.86, 0.06, 0.12)
    if (px > 46) {
      ctx.save()
      ctx.translate(0, -1.18)
      ctx.scale(1 / px, 1 / px)
      labelText(ctx, 'GOD DEY', 0, px * 0.7, Math.max(7, px * 0.08), '#f4e6c8')
      ctx.restore()
    }
    ctx.fillStyle = '#2b2b2b'
    ctx.fillRect(-0.5, -0.28, 1, 0.1)
    ctx.fillStyle = '#f5c400'
    for (let i = 0; i < 6; i++) ctx.fillRect(-0.48 + i * 0.17, -0.27, 0.08, 0.08)
    lights(ctx, false, -0.42, 0.03, 0.12)
    ctx.fillStyle = '#121010'
    ctx.fillRect(-0.48, -0.18, 0.12, 0.14)
    ctx.fillRect(0.36, -0.18, 0.12, 0.14)
  }
}

function paintPothole(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(30, 22, 16, 0.85)'
  ctx.beginPath()
  ctx.moveTo(-0.5, -0.02)
  ctx.lineTo(-0.36, -0.1)
  ctx.lineTo(-0.1, -0.12)
  ctx.lineTo(0.12, -0.09)
  ctx.lineTo(0.42, -0.11)
  ctx.lineTo(0.5, -0.03)
  ctx.lineTo(0.3, 0.03)
  ctx.lineTo(-0.2, 0.04)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(126, 160, 170, 0.55)'
  ctx.beginPath()
  ctx.ellipse(0.02, -0.04, 0.26, 0.04, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(244, 230, 200, 0.35)'
  ctx.fillRect(-0.48, -0.03, 0.08, 0.02)
  ctx.fillRect(0.38, -0.08, 0.1, 0.02)
}

/* ------------------------------------------------------------------ */
/* The Micra                                                           */
/* ------------------------------------------------------------------ */

export interface CarPose {
  brake: boolean
  reverse: boolean
  spin: number
  bob: number
  riders: number
  boost: boolean
}

/** Speed streaks and a warm edge when the Micra is boosted. */
export function drawBoostVibe(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  clock: number,
  power: number,
) {
  if (power <= 0.04) return
  ctx.save()
  const streaks = 16
  ctx.strokeStyle = '#ffe08a'
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.28 * power
  for (let i = 0; i < streaks; i++) {
    const x = ((i * 137 + clock * 1400 * power) % (width + 120)) - 60
    const y = ((i * 83) % Math.max(1, height - 40)) + 10
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - 36 * power, y + 84)
    ctx.stroke()
  }
  const glow = ctx.createRadialGradient(width / 2, height * 0.78, height * 0.08, width / 2, height * 0.62, height * 0.78)
  glow.addColorStop(0, 'rgba(255, 160, 40, 0)')
  glow.addColorStop(1, `rgba(255, 90, 10, ${0.28 * power})`)
  ctx.globalAlpha = 1
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

export interface Walker {
  kind: 'in' | 'out'
  offset: number
  z: number
  t: number
  shirt: number
}

const SHIRTS = ['#c4512c', '#1b4d3e', '#f5c400', '#2f3e57', '#e8e4da']

/** K11 Micra from behind, based on rear and 3/4 reference photos. `carW` is body width in pixels. */
export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  cx: number,
  base: number,
  lean: number,
  carW: number,
  pose: CarPose,
) {
  const u = carW / 160
  ctx.save()
  ctx.translate(cx, base + pose.bob + (pose.brake ? 2 * u : 0))
  ctx.rotate(lean)

  ctx.fillStyle = 'rgba(0,0,0,0.32)'
  ctx.beginPath()
  ctx.ellipse(0, 4 * u, 78 * u, 10 * u, 0, 0, Math.PI * 2)
  ctx.fill()

  hubcap(ctx, -62 * u, -6 * u, u, pose.spin)
  hubcap(ctx, 62 * u, -6 * u, u, pose.spin)

  ctx.fillStyle = '#1a1a1a'
  roundRect(ctx, -78 * u, -28 * u, 156 * u, 26 * u, 8 * u)
  ctx.fill()
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(-74 * u, -26 * u, 148 * u, 6 * u)

  ctx.fillStyle = pose.brake ? '#ff2d1f' : '#7a1c16'
  roundRect(ctx, -70 * u, -24 * u, 18 * u, 8 * u, 2 * u)
  ctx.fill()
  roundRect(ctx, 52 * u, -24 * u, 18 * u, 8 * u, 2 * u)
  ctx.fill()
  ctx.fillStyle = pose.reverse ? '#fff6df' : '#cbb892'
  ctx.fillRect(-50 * u, -22 * u, 8 * u, 5 * u)
  ctx.fillRect(42 * u, -22 * u, 8 * u, 5 * u)

  ctx.fillStyle = '#f7f4ea'
  roundRect(ctx, -28 * u, -22 * u, 56 * u, 16 * u, 2)
  ctx.fill()
  ctx.fillStyle = '#1b4d3e'
  ctx.fillRect(-28 * u, -22 * u, 56 * u, 3.2 * u)
  labelText(ctx, 'AKD 214 OY', -11 * u, 50 * u, Math.max(7, 7.5 * u), '#1a120b')

  const body = ctx.createLinearGradient(0, -150 * u, 0, -28 * u)
  body.addColorStop(0, '#ffe98a')
  body.addColorStop(0.45, '#f5c400')
  body.addColorStop(1, '#c99200')
  ctx.fillStyle = body
  roundRect(ctx, -72 * u, -148 * u, 144 * u, 124 * u, 16 * u)
  ctx.fill()

  ctx.fillStyle = '#d7a400'
  ctx.beginPath()
  ctx.moveTo(-58 * u, -146 * u)
  ctx.quadraticCurveTo(0, -162 * u, 58 * u, -146 * u)
  ctx.lineTo(52 * u, -138 * u)
  ctx.quadraticCurveTo(0, -150 * u, -52 * u, -138 * u)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#1b4d3e'
  ctx.fillRect(-72 * u, -72 * u, 144 * u, 7 * u)

  ctx.fillStyle = '#c0261c'
  roundRect(ctx, -74 * u, -118 * u, 16 * u, 42 * u, 3 * u)
  ctx.fill()
  roundRect(ctx, 58 * u, -118 * u, 16 * u, 42 * u, 3 * u)
  ctx.fill()
  ctx.fillStyle = '#f5a623'
  ctx.fillRect(-71 * u, -88 * u, 10 * u, 8 * u)
  ctx.fillRect(61 * u, -88 * u, 10 * u, 8 * u)
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fillRect(-72 * u, -116 * u, 6 * u, 12 * u)
  ctx.fillRect(60 * u, -116 * u, 6 * u, 12 * u)

  const glass = ctx.createLinearGradient(0, -144 * u, 0, -78 * u)
  glass.addColorStop(0, '#24584c')
  glass.addColorStop(0.5, '#16352e')
  glass.addColorStop(1, '#0d1c18')
  ctx.fillStyle = glass
  roundRect(ctx, -52 * u, -140 * u, 104 * u, 62 * u, 8 * u)
  ctx.fill()
  ctx.fillStyle = 'rgba(244,230,200,0.16)'
  ctx.fillRect(-46 * u, -136 * u, 40 * u, 6 * u)

  const heads = Math.max(0, Math.min(4, pose.riders))
  for (let i = 0; i < heads; i++) {
    const hx = -24 * u + (i % 2) * 30 * u + (i > 1 ? 8 * u : 0)
    const hy = -108 * u - (i > 1 ? 10 * u : 0)
    ctx.fillStyle = '#1a120b'
    ctx.beginPath()
    ctx.arc(hx, hy, 7 * u, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = SHIRTS[i % SHIRTS.length]
    roundRect(ctx, hx - 8 * u, hy + 6 * u, 16 * u, 10 * u, 2)
    ctx.fill()
  }

  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = Math.max(1.4, 2.2 * u)
  ctx.beginPath()
  ctx.moveTo(-18 * u, -128 * u)
  ctx.lineTo(-28 * u, -86 * u)
  ctx.quadraticCurveTo(-8 * u, -82 * u, 6 * u, -92 * u)
  ctx.stroke()
  ctx.fillStyle = '#2a2a2a'
  ctx.beginPath()
  ctx.arc(-18 * u, -128 * u, 3 * u, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#c0261c'
  ctx.beginPath()
  ctx.arc(0, -132 * u, 6 * u, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#f4e6c8'
  ctx.beginPath()
  ctx.arc(0, -132 * u, 3.2 * u, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#14352c'
  labelText(ctx, 'MICRA', -58 * u, 36 * u, Math.max(7, 8 * u), '#14352c')

  ctx.fillStyle = '#f4e6c8'
  roundRect(ctx, 18 * u, -74 * u, 28 * u, 12 * u, 2)
  ctx.fill()
  ctx.save()
  ctx.translate(32 * u, -68 * u)
  labelText(ctx, 'DROP', 0, 24 * u, Math.max(6, 6.5 * u), '#1a120b')
  ctx.restore()

  ctx.fillStyle = '#d7a400'
  roundRect(ctx, -86 * u, -100 * u, 14 * u, 10 * u, 2)
  ctx.fill()
  roundRect(ctx, 72 * u, -100 * u, 14 * u, 10 * u, 2)
  ctx.fill()
  ctx.fillStyle = '#163028'
  ctx.fillRect(-83 * u, -98 * u, 8 * u, 6 * u)
  ctx.fillRect(75 * u, -98 * u, 8 * u, 6 * u)

  if (pose.boost) {
    const flick = 0.65 + Math.abs(Math.sin(performance.now() / 32)) * 0.55
    for (const side of [-34, 34]) {
      ctx.fillStyle = '#ff4d00'
      ctx.beginPath()
      ctx.moveTo(side * u - 9 * u, -4 * u)
      ctx.lineTo(side * u, 26 * u * flick)
      ctx.lineTo(side * u + 9 * u, -4 * u)
      ctx.fill()
      ctx.fillStyle = '#ffe08a'
      ctx.beginPath()
      ctx.moveTo(side * u - 4 * u, -2 * u)
      ctx.lineTo(side * u, 12 * u * flick)
      ctx.lineTo(side * u + 4 * u, -2 * u)
      ctx.fill()
    }
  }

  ctx.restore()
}

function hubcap(ctx: CanvasRenderingContext2D, x: number, y: number, u: number, spin: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = '#121010'
  ctx.beginPath()
  ctx.ellipse(0, 2 * u, 16 * u, 12 * u, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#c5c5c5'
  ctx.beginPath()
  ctx.ellipse(0, 0, 13 * u, 10 * u, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.save()
  ctx.rotate(spin)
  ctx.strokeStyle = '#9a9a9a'
  ctx.lineWidth = Math.max(1, 1.2 * u)
  for (let i = 0; i < 8; i++) {
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, 8 * u)
    ctx.stroke()
    ctx.rotate(Math.PI / 4)
  }
  ctx.restore()
  ctx.fillStyle = '#f5c400'
  ctx.beginPath()
  ctx.arc(0, 0, 3 * u, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function drawWalker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  walker: Walker,
) {
  const s = Math.max(6, scale)
  const bounce = Math.sin(walker.t * 18) * s * 0.04
  ctx.save()
  ctx.translate(x, y + bounce)
  ctx.globalAlpha = walker.kind === 'in' ? Math.max(0, 1 - walker.t) : Math.min(1, walker.t * 1.4)
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  ctx.beginPath()
  ctx.ellipse(0, 0, s * 0.16, s * 0.04, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1a120b'
  ctx.beginPath()
  ctx.arc(0, -s * 0.7, s * 0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = SHIRTS[walker.shirt % SHIRTS.length]
  roundRect(ctx, -s * 0.12, -s * 0.58, s * 0.24, s * 0.34, 3)
  ctx.fill()
  ctx.fillStyle = '#1a120b'
  ctx.fillRect(-s * 0.1, -s * 0.24, s * 0.07, s * 0.24)
  ctx.fillRect(s * 0.03, -s * 0.24, s * 0.07, s * 0.24)
  ctx.restore()
}
