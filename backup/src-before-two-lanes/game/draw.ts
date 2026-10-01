import { BRAND, type SpriteKind } from './districts'
import { LANE_MARKS, MEDIAN_LEFT, MEDIAN_RIGHT, RIGHT_EDGE } from './lanes'
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

export function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  playerX: number,
  skyTop: string,
  skyBottom: string,
  grass: string,
  haze: number,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.58)
  sky.addColorStop(0, skyTop)
  sky.addColorStop(1, skyBottom)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)

  const sunX = width * 0.78 + playerX * 28
  const sunY = height * 0.16
  const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, width * 0.28)
  glow.addColorStop(0, 'rgba(245, 196, 0, 0.95)')
  glow.addColorStop(0.35, 'rgba(245, 180, 80, 0.35)')
  glow.addColorStop(1, 'rgba(245, 180, 80, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(sunX, sunY, width * 0.28, 0, Math.PI * 2)
  ctx.fill()

  const horizon = height * 0.46
  hillLayer(ctx, width, horizon, 110, BRAND.rustDeep, playerX * 18, 0.55)
  hillLayer(ctx, width, horizon + 28, 78, BRAND.rust, playerX * 36, 1)
  roofTicks(ctx, width, horizon + 18, playerX * 36)

  if (haze > 0.02) {
    ctx.fillStyle = `rgba(244, 226, 190, ${Math.min(0.55, haze * 0.7)})`
    ctx.fillRect(0, horizon - 80, width, 160)
  }

  ctx.fillStyle = grass
  ctx.fillRect(0, horizon + 70, width, height)
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
  ctx.moveTo(-40, base + 80)
  const steps = 8
  for (let i = 0; i <= steps; i++) {
    const wave = Math.sin(i * 1.3 + lumps + shift * 0.01) * amp
    const y = base - Math.abs(wave)
    if (i === 0) ctx.lineTo(-40, y)
    else ctx.lineTo((i / steps) * width, y)
  }
  ctx.lineTo(width + 40, base + 80)
  ctx.closePath()
  ctx.fill()
}

function roofTicks(
  ctx: CanvasRenderingContext2D,
  width: number,
  base: number,
  shift: number,
) {
  const rusts = ['#6e3018', '#a34422', '#8c3b22', '#c4512c']
  for (let i = 0; i < 22; i++) {
    const x = ((i * 68 + shift) % (width + 90)) - 24
    const w = 16 + (i % 3) * 8
    const h = 8 + (i % 4) * 4
    ctx.fillStyle = rusts[i % rusts.length]
    ctx.fillRect(x, base - h, w, h)
    ctx.beginPath()
    ctx.moveTo(x - 2, base - h)
    ctx.lineTo(x + w / 2, base - h - 7)
    ctx.lineTo(x + w + 2, base - h)
    ctx.closePath()
    ctx.fill()
  }
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
) {
  const top = Math.min(y1, y2)
  const bottom = Math.max(y1, y2)
  ctx.fillStyle = grass
  ctx.fillRect(0, top, width, Math.max(1, bottom - top))

  ctx.fillStyle = rumble
  poly(
    ctx,
    x1 - w1 * rumbleWidth,
    y1,
    x1 + w1 * rumbleWidth,
    y1,
    x2 + w2 * rumbleWidth,
    y2,
    x2 - w2 * rumbleWidth,
    y2,
  )

  ctx.fillStyle = road
  poly(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2)

  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  poly(
    ctx,
    x1 - w1,
    y1,
    x1 + MEDIAN_LEFT * w1,
    y1,
    x2 + MEDIAN_LEFT * w2,
    y2,
    x2 - w2,
    y2,
  )

  ctx.fillStyle = grass
  poly(
    ctx,
    x1 + MEDIAN_LEFT * w1,
    y1,
    x1 + MEDIAN_RIGHT * w1,
    y1,
    x2 + MEDIAN_RIGHT * w2,
    y2,
    x2 + MEDIAN_LEFT * w2,
    y2,
  )

  ctx.fillStyle = 'rgba(0,0,0,0.16)'
  poly(ctx, x1 - w1 * 0.98, y1, x1 - w1 * 0.9, y1, x2 - w2 * 0.9, y2, x2 - w2 * 0.98, y2)

  if (w1 < 10) return

  ctx.fillStyle = edge
  const e1 = Math.max(1.2, w1 / 48)
  const e2 = Math.max(1.2, w2 / 48)
  for (const side of [-1, 1]) {
    poly(
      ctx,
      x1 + side * w1 * 0.97 - e1,
      y1,
      x1 + side * w1 * 0.97 + e1,
      y1,
      x2 + side * w2 * 0.97 + e2,
      y2,
      x2 + side * w2 * 0.97 - e2,
      y2,
    )
  }

  ctx.fillStyle = edge
  const curb1 = Math.max(1.1, w1 / 64)
  const curb2 = Math.max(1.1, w2 / 64)
  for (const at of [MEDIAN_LEFT, MEDIAN_RIGHT]) {
    poly(
      ctx,
      x1 + at * w1 - curb1,
      y1,
      x1 + at * w1 + curb1,
      y1,
      x2 + at * w2 + curb2,
      y2,
      x2 + at * w2 - curb2,
      y2,
    )
  }

  if (!dashed || w1 < 22) return
  ctx.fillStyle = lane
  const lw1 = Math.max(1.4, w1 / 36)
  const lw2 = Math.max(1.4, w2 / 36)
  for (const at of LANE_MARKS) {
    poly(
      ctx,
      x1 + at * w1 - lw1,
      y1,
      x1 + at * w1 + lw1,
      y1,
      x2 + at * w2 + lw2,
      y2,
      x2 + at * w2 - lw2,
      y2,
    )
  }
}

let dropHot = false

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  scale: number,
  hot: boolean,
) {
  const size = Math.max(6, scale)
  dropHot = hot
  ctx.save()
  ctx.translate(x, y)
  painters[sprite.kind](ctx, size, sprite.label || '')
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

function paintBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  face: string,
  top: string,
  side: string,
  depth: number,
) {
  ctx.fillStyle = side
  ctx.beginPath()
  ctx.moveTo(x + w, y)
  ctx.lineTo(x + w + depth, y - depth * 0.7)
  ctx.lineTo(x + w + depth, y + h - depth * 0.18)
  ctx.lineTo(x + w, y + h)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = top
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + depth * 0.28, y - depth * 0.7)
  ctx.lineTo(x + w + depth, y - depth * 0.7)
  ctx.lineTo(x + w, y)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = face
  ctx.fillRect(x, y, w, h)
}

function paintWheel(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  ctx.fillStyle = '#0e0c0a'
  ctx.beginPath()
  ctx.ellipse(x + rx * 0.45, y + ry * 0.12, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#2c2824'
  ctx.beginPath()
  ctx.ellipse(x, y, rx * 0.78, ry * 0.88, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#d7cbb8'
  ctx.beginPath()
  ctx.ellipse(x - rx * 0.08, y - ry * 0.06, rx * 0.28, ry * 0.32, 0, 0, Math.PI * 2)
  ctx.fill()
}

const painters: Record<SpriteKind, (ctx: CanvasRenderingContext2D, s: number, label: string) => void> = {
  palm: (ctx, s) => {
    ctx.fillStyle = '#6b4a2a'
    ctx.fillRect(-s * 0.05, -s * 0.78, s * 0.1, s * 0.78)
    ctx.fillStyle = '#1b4d3e'
    for (let i = 0; i < 6; i++) {
      ctx.beginPath()
      ctx.ellipse(0, -s * 0.82, s * 0.4, s * 0.11, (i * Math.PI) / 3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#c4512c'
    ctx.beginPath()
    ctx.arc(-s * 0.12, -s * 0.7, s * 0.05, 0, Math.PI * 2)
    ctx.arc(s * 0.14, -s * 0.66, s * 0.045, 0, Math.PI * 2)
    ctx.fill()
  },
  tree: (ctx, s) => {
    ctx.fillStyle = '#5a3a22'
    ctx.fillRect(-s * 0.07, -s * 0.55, s * 0.14, s * 0.55)
    ctx.fillStyle = '#2f6a3e'
    ctx.beginPath()
    ctx.arc(0, -s * 0.7, s * 0.32, 0, Math.PI * 2)
    ctx.arc(-s * 0.16, -s * 0.58, s * 0.18, 0, Math.PI * 2)
    ctx.fill()
  },
  umbrella: (ctx, s) => {
    ctx.fillStyle = '#6b4a2a'
    ctx.fillRect(-s * 0.04, -s * 0.7, s * 0.08, s * 0.7)
    ctx.fillStyle = s > 20 ? '#c4512c' : '#1b4d3e'
    ctx.beginPath()
    ctx.ellipse(0, -s * 0.72, s * 0.46, s * 0.16, 0, Math.PI, 0)
    ctx.fill()
    ctx.fillStyle = BRAND.gold
    ctx.fillRect(-s * 0.46, -s * 0.74, s * 0.92, s * 0.06)
  },
  roof: (ctx, s) => {
    const rusts = ['#a34422', '#c4512c', '#8c3b22', '#6e3018']
    for (let i = 0; i < 4; i++) {
      const rw = s * (0.22 + (i % 2) * 0.08)
      const rh = s * (0.18 + (i % 3) * 0.07)
      const x = -s * 0.46 + i * s * 0.2
      const y = -rh - (i % 2) * 5
      ctx.fillStyle = '#f4e6c8'
      ctx.fillRect(x, y, rw, rh * 0.55)
      ctx.fillStyle = rusts[i % rusts.length]
      ctx.beginPath()
      ctx.moveTo(x - 2, y)
      ctx.lineTo(x + rw / 2, y - rh * 0.45)
      ctx.lineTo(x + rw + 2, y)
      ctx.closePath()
      ctx.fill()
    }
  },
  keke: (ctx, s) => {
    paintWheel(ctx, 0, -s * 0.06, s * 0.11, s * 0.11)
    paintWheel(ctx, -s * 0.24, -s * 0.04, s * 0.08, s * 0.08)
    paintWheel(ctx, s * 0.28, -s * 0.02, s * 0.08, s * 0.08)
    paintBox(ctx, -s * 0.3, -s * 0.58, s * 0.6, s * 0.42, '#1b4d3e', '#2f6d58', '#0f3329', s * 0.14)
    ctx.fillStyle = '#d7efe4'
    roundRect(ctx, -s * 0.16, -s * 0.5, s * 0.32, s * 0.16, 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.28)'
    ctx.fillRect(-s * 0.16, -s * 0.5, s * 0.32, s * 0.04)
    ctx.fillStyle = BRAND.gold
    ctx.fillRect(-s * 0.22, -s * 0.2, s * 0.08, s * 0.05)
    ctx.fillRect(s * 0.16, -s * 0.2, s * 0.1, s * 0.05)
  },
  okada: (ctx, s) => {
    paintWheel(ctx, -s * 0.26, -s * 0.08, s * 0.12, s * 0.12)
    paintWheel(ctx, s * 0.24, -s * 0.1, s * 0.1, s * 0.1)
    ctx.fillStyle = '#3a2a1c'
    ctx.beginPath()
    ctx.moveTo(-s * 0.2, -s * 0.16)
    ctx.lineTo(s * 0.16, -s * 0.16)
    ctx.lineTo(s * 0.32, -s * 0.34)
    ctx.lineTo(s * 0.22, -s * 0.34)
    ctx.lineTo(s * 0.08, -s * 0.2)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#1a120b'
    ctx.lineWidth = Math.max(2, s * 0.06)
    ctx.beginPath()
    ctx.moveTo(-s * 0.28, -s * 0.14)
    ctx.lineTo(s * 0.16, -s * 0.14)
    ctx.lineTo(s * 0.28, -s * 0.32)
    ctx.stroke()
    paintBox(ctx, -s * 0.12, -s * 0.4, s * 0.2, s * 0.24, '#1b4d3e', '#246454', '#0f3329', s * 0.08)
    ctx.fillStyle = '#e7c07a'
    ctx.beginPath()
    ctx.arc(0, -s * 0.5, s * 0.11, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f5c400'
    ctx.beginPath()
    ctx.arc(-s * 0.02, -s * 0.56, s * 0.1, Math.PI, 0)
    ctx.fill()
    ctx.fillStyle = '#1a120b'
    ctx.fillRect(-s * 0.1, -s * 0.58, s * 0.16, s * 0.045)
  },
  danfo: (ctx, s, text) => {
    paintWheel(ctx, -s * 0.24, -s * 0.08, s * 0.11, s * 0.11)
    paintWheel(ctx, s * 0.26, -s * 0.08, s * 0.11, s * 0.11)
    paintBox(ctx, -s * 0.38, -s * 0.86, s * 0.76, s * 0.72, '#f5c400', '#ffe98a', '#b8860b', s * 0.18)
    ctx.fillStyle = '#1a120b'
    ctx.fillRect(-s * 0.38, -s * 0.52, s * 0.76, s * 0.08)
    ctx.fillStyle = '#163028'
    roundRect(ctx, -s * 0.22, -s * 0.78, s * 0.44, s * 0.16, 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(215, 239, 228, 0.35)'
    ctx.fillRect(-s * 0.22, -s * 0.78, s * 0.44, s * 0.04)
    labelText(ctx, (text || 'IBADAN').slice(0, 9), -s * 0.7, s * 0.4, Math.max(8, s * 0.09), '#f4e6c8')
    ctx.fillStyle = '#9a2218'
    roundRect(ctx, -s * 0.32, -s * 0.28, s * 0.16, s * 0.08, 2)
    ctx.fill()
    roundRect(ctx, s * 0.16, -s * 0.28, s * 0.16, s * 0.08, 2)
    ctx.fill()
    ctx.fillStyle = '#ffd2b0'
    ctx.fillRect(-s * 0.28, -s * 0.26, s * 0.08, s * 0.035)
    ctx.fillRect(s * 0.2, -s * 0.26, s * 0.08, s * 0.035)
  },
  passenger: (ctx, s) => {
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
    ctx.fillStyle = '#f4e6c8'
    ctx.fillRect(-s * 0.16, -s * 0.22, s * 0.08, s * 0.16)
  },
  hawker: (ctx, s) => {
    ctx.fillStyle = '#d7efe4'
    ctx.fillRect(-s * 0.16, -s * 1.05, s * 0.07, s * 0.12)
    ctx.fillRect(-s * 0.04, -s * 1.08, s * 0.07, s * 0.14)
    ctx.fillRect(s * 0.08, -s * 1.02, s * 0.07, s * 0.1)
    ctx.fillStyle = '#c4512c'
    ctx.fillRect(-s * 0.24, -s * 0.94, s * 0.48, s * 0.06)
    ctx.fillStyle = '#1a120b'
    ctx.beginPath()
    ctx.arc(0, -s * 0.74, s * 0.1, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f5c400'
    roundRect(ctx, -s * 0.14, -s * 0.62, s * 0.28, s * 0.38, 4)
    ctx.fill()
    ctx.fillStyle = '#1b4d3e'
    ctx.fillRect(-s * 0.14, -s * 0.42, s * 0.28, s * 0.06)
  },
  pothole: (ctx, s) => {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.beginPath()
    ctx.ellipse(0, -s * 0.08, s * 0.32, s * 0.12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(244, 230, 200, 0.25)'
    ctx.beginPath()
    ctx.ellipse(-s * 0.06, -s * 0.1, s * 0.12, s * 0.04, 0, 0, Math.PI * 2)
    ctx.fill()
  },
  kiosk: (ctx, s, text) => {
    ctx.fillStyle = '#f4e6c8'
    ctx.fillRect(-s * 0.34, -s * 0.46, s * 0.68, s * 0.4)
    ctx.fillStyle = '#8c3b22'
    ctx.beginPath()
    ctx.moveTo(-s * 0.42, -s * 0.46)
    ctx.lineTo(0, -s * 0.74)
    ctx.lineTo(s * 0.42, -s * 0.46)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#1b4d3e'
    roundRect(ctx, -s * 0.28, -s * 0.42, s * 0.56, s * 0.16, 2)
    ctx.fill()
    labelText(ctx, (text || 'POS').slice(0, 11), -s * 0.34, s * 0.5, Math.max(8, s * 0.1), '#f5c400')
    ctx.fillStyle = '#6b4a2a'
    ctx.fillRect(-s * 0.08, -s * 0.08, s * 0.16, s * 0.08)
  },
  drop: (ctx, s) => {
    const hot = dropHot
    ctx.fillStyle = '#5a3a22'
    ctx.fillRect(-s * 0.03, -s * 0.72, s * 0.06, s * 0.72)
    if (hot) {
      ctx.shadowColor = '#f5c400'
      ctx.shadowBlur = Math.min(16, s * 0.2)
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
}

export function drawGantry(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  label: string,
  viewWidth: number,
) {
  if (w < 14) return
  const center = x + ((MEDIAN_RIGHT + RIGHT_EDGE) / 2) * w
  const span = (RIGHT_EDGE - MEDIAN_RIGHT) * w
  if (span < 32 || span > viewWidth * 1.8) return
  const boardW = Math.min(span * 0.94, viewWidth * 0.58)
  const boardH = Math.max(18, Math.min(boardW * 0.2, viewWidth * 0.072))
  const rise = Math.max(boardH + 8, Math.min(w * 0.42, viewWidth * 0.2))
  const post = Math.max(2.5, Math.min(w * 0.03, 10))
  const left = center - boardW / 2
  const right = center + boardW / 2
  const top = y - rise
  const boardY = top - boardH * 0.15

  ctx.fillStyle = '#2c261f'
  ctx.fillRect(left - post * 0.2, top, post, y - top)
  ctx.fillRect(right - post * 0.8, top, post, y - top)
  ctx.fillStyle = '#4a4036'
  ctx.fillRect(left, top, post * 0.35, y - top)
  ctx.fillRect(right - post * 0.45, top, post * 0.35, y - top)

  const boardX = left
  ctx.fillStyle = '#1a1612'
  ctx.fillRect(left - post, top + boardH * 0.15, boardW + post * 2, Math.max(3, w * 0.045))
  ctx.fillStyle = '#3d342c'
  ctx.fillRect(left - post, top, boardW + post * 2, Math.max(3, w * 0.035))

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
  ctx.translate(boardX + boardW / 2, boardY + boardH * 0.58)
  labelText(
    ctx,
    (label || 'IBADAN').toUpperCase(),
    0,
    boardW * 0.88,
    Math.max(8, boardH * 0.42),
    '#f5c400',
  )
  ctx.restore()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

export interface CarPose {
  brake: boolean
  reverse: boolean
  spin: number
  bob: number
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  cx: number,
  base: number,
  lean: number,
  laneWidth: number,
  pose: CarPose,
) {
  const carW = Math.max(88, Math.min(230, laneWidth * 0.86))
  const u = carW / 220
  ctx.save()
  ctx.translate(cx, base + pose.bob + (pose.brake ? 3 * u : 0))
  ctx.rotate(lean)

  ctx.fillStyle = 'rgba(0,0,0,0.32)'
  ctx.beginPath()
  ctx.ellipse(8 * u, 8, carW * 0.42, u * 12, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#8f6a00'
  ctx.beginPath()
  ctx.moveTo(72 * u, -150 * u)
  ctx.lineTo(104 * u, -132 * u)
  ctx.lineTo(118 * u, -78 * u)
  ctx.lineTo(126 * u, -28 * u)
  ctx.lineTo(108 * u, -8 * u)
  ctx.lineTo(94 * u, -8 * u)
  ctx.lineTo(100 * u, -24 * u)
  ctx.lineTo(96 * u, -78 * u)
  ctx.lineTo(84 * u, -124 * u)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#d7a400'
  ctx.beginPath()
  ctx.moveTo(78 * u, -146 * u)
  ctx.lineTo(100 * u, -132 * u)
  ctx.lineTo(112 * u, -86 * u)
  ctx.lineTo(90 * u, -96 * u)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#ffe7a1'
  ctx.beginPath()
  ctx.moveTo(-36 * u, -168 * u)
  ctx.lineTo(46 * u, -166 * u)
  ctx.lineTo(78 * u, -146 * u)
  ctx.lineTo(52 * u, -136 * u)
  ctx.lineTo(-40 * u, -138 * u)
  ctx.closePath()
  ctx.fill()

  const body = ctx.createLinearGradient(-40 * u, -168 * u, 70 * u, -6 * u)
  body.addColorStop(0, '#ffe98a')
  body.addColorStop(0.42, '#f5c400')
  body.addColorStop(1, '#c99200')
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.moveTo(-52 * u, -158 * u)
  ctx.lineTo(52 * u, -158 * u)
  ctx.quadraticCurveTo(78 * u, -150 * u, 86 * u, -118 * u)
  ctx.lineTo(96 * u, -78 * u)
  ctx.quadraticCurveTo(104 * u, -40 * u, 100 * u, -22 * u)
  ctx.lineTo(94 * u, -8 * u)
  ctx.lineTo(-94 * u, -8 * u)
  ctx.lineTo(-100 * u, -22 * u)
  ctx.quadraticCurveTo(-104 * u, -40 * u, -96 * u, -78 * u)
  ctx.lineTo(-86 * u, -118 * u)
  ctx.quadraticCurveTo(-78 * u, -150 * u, -52 * u, -158 * u)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.beginPath()
  ctx.ellipse(-8 * u, -148 * u, 26 * u, 7 * u, -0.3, 0, Math.PI * 2)
  ctx.fill()

  const glass = ctx.createLinearGradient(0, -150 * u, 0, -108 * u)
  glass.addColorStop(0, '#24584c')
  glass.addColorStop(1, '#10241f')
  ctx.fillStyle = glass
  roundRect(ctx, -46 * u, -148 * u, 92 * u, 40 * u, 6 * u)
  ctx.fill()

  ctx.fillStyle = '#1a120b'
  ctx.beginPath()
  ctx.arc(-10 * u, -126 * u, 8 * u, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#14352c'
  ctx.fillRect(-20 * u, -132 * u, 18 * u, 5 * u)

  ctx.fillStyle = '#f4e6c8'
  roundRect(ctx, 16 * u, -144 * u, 24 * u, 12 * u, 2)
  ctx.fill()
  ctx.save()
  ctx.translate(28 * u, -138 * u)
  labelText(ctx, 'DROP', 0, 20 * u, Math.max(6, 6.5 * u), '#1a120b')
  ctx.restore()

  ctx.strokeStyle = 'rgba(244,230,200,0.7)'
  ctx.lineWidth = Math.max(1, 1.3 * u)
  ctx.beginPath()
  ctx.moveTo(-28 * u, -114 * u)
  ctx.lineTo(16 * u, -132 * u)
  ctx.stroke()

  ctx.fillStyle = pose.brake ? '#ff3b2a' : '#6e1c16'
  ctx.fillRect(-18 * u, -110 * u, 36 * u, 3 * u)

  ctx.fillStyle = '#1b4d3e'
  ctx.fillRect(-96 * u, -76 * u, 192 * u, 8 * u)

  ctx.strokeStyle = 'rgba(90, 58, 10, 0.35)'
  ctx.lineWidth = Math.max(1, u)
  ctx.beginPath()
  ctx.moveTo(-88 * u, -64 * u)
  ctx.lineTo(88 * u, -64 * u)
  ctx.stroke()

  lamp(ctx, -92 * u, u, pose)
  lamp(ctx, 54 * u, u, pose)

  labelText(ctx, 'MICRA', -40 * u, 52 * u, Math.max(8, 10 * u), '#14352c')

  ctx.fillStyle = '#3a3024'
  ctx.beginPath()
  ctx.moveTo(-96 * u, -30 * u)
  ctx.lineTo(-78 * u, -46 * u)
  ctx.lineTo(92 * u, -46 * u)
  ctx.lineTo(112 * u, -30 * u)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#1a120b'
  roundRect(ctx, -100 * u, -28 * u, 200 * u, 22 * u, 6 * u)
  ctx.fill()
  ctx.fillStyle = '#2e2418'
  ctx.beginPath()
  ctx.moveTo(94 * u, -28 * u)
  ctx.lineTo(112 * u, -18 * u)
  ctx.lineTo(112 * u, -8 * u)
  ctx.lineTo(94 * u, -6 * u)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(90, 58, 24, 0.38)'
  ctx.fillRect(-88 * u, -12 * u, 176 * u, 5 * u)

  ctx.fillStyle = '#f7f4ea'
  roundRect(ctx, -34 * u, -26 * u, 68 * u, 16 * u, 2)
  ctx.fill()
  ctx.fillStyle = '#1b4d3e'
  ctx.fillRect(-34 * u, -26 * u, 68 * u, 3.5 * u)
  labelText(ctx, 'AKD 214 OY', -15 * u, 58 * u, Math.max(7, 8 * u), '#1a120b')

  drawWheel(ctx, -108 * u, -14 * u, u, pose.spin)
  drawWheel(ctx, 118 * u, -16 * u, u, pose.spin)

  mirror(ctx, -116 * u, u)
  mirror(ctx, 100 * u, u)

  ctx.strokeStyle = '#1a120b'
  ctx.lineWidth = Math.max(1, u)
  ctx.beginPath()
  ctx.moveTo(-28 * u, -158 * u)
  ctx.lineTo(-36 * u, -184 * u)
  ctx.stroke()

  ctx.restore()
}

function lamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  u: number,
  pose: CarPose,
) {
  ctx.save()
  if (pose.brake) {
    ctx.shadowColor = 'rgba(255, 42, 24, 0.85)'
    ctx.shadowBlur = 14 * u
  }
  ctx.fillStyle = pose.brake ? '#ff2d1f' : '#8e1d16'
  roundRect(ctx, x, -56 * u, 38 * u, 16 * u, 3 * u)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle = pose.reverse ? '#fff6df' : '#cbb892'
  ctx.fillRect(x + 26 * u, -52 * u, 8 * u, 8 * u)
  ctx.fillStyle = pose.brake ? '#ffd2b0' : '#5c2418'
  ctx.fillRect(x + 4 * u, -52 * u, 18 * u, 4 * u)
  ctx.restore()
}

function mirror(ctx: CanvasRenderingContext2D, x: number, u: number) {
  ctx.fillStyle = '#d7a400'
  roundRect(ctx, x, -116 * u, 16 * u, 10 * u, 2)
  ctx.fill()
  ctx.fillStyle = '#163028'
  ctx.fillRect(x + 2 * u, -114 * u, 12 * u, 6 * u)
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  u: number,
  spin: number,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = '#0c0a08'
  ctx.beginPath()
  ctx.ellipse(6 * u, 2 * u, 14 * u, 20 * u, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#14110e'
  ctx.beginPath()
  ctx.ellipse(0, 0, 14 * u, 20 * u, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#3a342e'
  ctx.beginPath()
  ctx.ellipse(-3 * u, -2 * u, 9 * u, 13 * u, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#2c2824'
  ctx.beginPath()
  ctx.ellipse(0, 0, 8 * u, 12 * u, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.rotate(spin)
  ctx.strokeStyle = '#f4e6c8'
  ctx.lineWidth = Math.max(1.5, 2 * u)
  ctx.beginPath()
  ctx.moveTo(0, -8 * u)
  ctx.lineTo(0, 8 * u)
  ctx.moveTo(-6 * u, 0)
  ctx.lineTo(6 * u, 0)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 0, 2.2 * u, 0, Math.PI * 2)
  ctx.fillStyle = '#f5c400'
  ctx.fill()
  ctx.restore()
}
