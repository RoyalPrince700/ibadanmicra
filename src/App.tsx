import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { createGame, vehicleName, type AheadMark, type Hud } from './game/game'
import { DISTRICTS, type TrafficKind } from './game/districts'
import './index.css'

const SHORT: Record<TrafficKind, string> = {
  keke: 'KEKE',
  okada: 'OKADA',
  danfo: 'DANFO',
  car: 'CAR',
  truck: 'TRAILER',
  pothole: 'HOLE',
}

function describe(mark: AheadMark) {
  const name = vehicleName(mark.kind)
  if (mark.kind === 'pothole') return mark.oncoming ? 'Pothole, oncoming' : `Pothole, lane ${mark.lane + 1}`
  if (mark.oncoming) return `${name} coming`
  if (mark.parked) return `${name} stopped to load`
  return `Slow ${name.toLowerCase()}, lane ${mark.lane + 1}`
}

function Timeline({ hud }: { hud: Hud }) {
  const next = hud.ahead.slice(0, 4)
  const ticks = [0.75, 0.5, 0.25]
  return (
    <aside className="timeline" aria-label="Traffic timeline">
      <div className="timeline-head five">
        <span>On</span>
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>Wait</span>
      </div>
      <div className="timeline-track five">
        <div className="timeline-lane" />
        <div className="timeline-lane" />
        <div className="timeline-lane" />
        <div className="timeline-lane" />
        <div className="timeline-lane wait" />
        {ticks.map((share) => (
          <span key={share} className="tick" style={{ top: `${(1 - share) * 100}%` }}>
            {Math.round(hud.windowMetres * share)}
          </span>
        ))}
        {hud.ahead.map((mark) => (
          <i
            key={mark.id}
            className={[
              'blip',
              `kind-${mark.kind}`,
              mark.oncoming ? 'oncoming col-on' : `col-${mark.lane}`,
              mark.parked ? 'parked' : '',
            ].join(' ')}
            style={{ top: `${(1 - mark.share) * 100}%` }}
          >
            {SHORT[mark.kind]}
          </i>
        ))}
        <span className={`you col-${hud.lane}`} aria-hidden />
      </div>
      <div className="timeline-scale">
        <span>{hud.windowMetres} m</span>
        <span>you</span>
      </div>
      <ol className="timeline-next">
        {next.length === 0 ? <li className="clear">Road clear</li> : null}
        {next.map((mark) => (
          <li key={mark.id} className={mark.lane === hud.lane && !mark.oncoming ? 'mine' : ''}>
            <span>{describe(mark)}</span>
            <b>{mark.metres} m</b>
          </li>
        ))}
      </ol>
    </aside>
  )
}

const HIGHLIGHTS = new Set(['challenge', 'iwo', 'ojoo', 'cocoa'])

const emptyHud: Hud = {
  phase: 'title',
  district: 'Toll Gate',
  street: 'Lagos–Ibadan Expressway',
  address: 'Toll Gate, Ibadan',
  subtitle: 'Lagos don finish. Ibadan dey start.',
  radio: 'Ibadan lo mo, o mo layipo.',
  fare: 0,
  lives: 3,
  speed: 0,
  maxSpeed: 1,
  progress: 0,
  districtIndex: 0,
  districtCount: DISTRICTS.length,
  banner: '',
  bannerSub: '',
  toast: '',
  job: '',
  jobPay: 0,
  best: 0,
  stalled: false,
  paused: false,
  lane: 1,
  ahead: [],
  warning: '',
  windowMetres: 800,
  riders: [],
  seats: 4,
  waiting: false,
}

function naira(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}

function isCoarse() {
  return window.matchMedia('(max-width: 800px), (pointer: coarse)').matches
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<ReturnType<typeof createGame> | null>(null)
  const [hud, setHud] = useState<Hud>(emptyHud)
  const preview = DISTRICTS.filter((street) => HIGHLIGHTS.has(street.id))
  const finish = DISTRICTS[DISTRICTS.length - 1]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const game = createGame(canvas, { onHud: setHud })
    gameRef.current = game
    return () => game.destroy()
  }, [])

  function hold(event: PointerEvent<HTMLButtonElement>, control: 'left' | 'right' | 'brake' | 'honk', down: boolean) {
    event.preventDefault()
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // pointer already released
    }
    gameRef.current?.setHeld(control, down)
  }

  function steerTo(event: PointerEvent<HTMLCanvasElement>, active: boolean) {
    if (!isCoarse()) return
    if (!active) {
      gameRef.current?.setSteer('none')
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5
    gameRef.current?.setSteer(ratio < 0.4 ? 'left' : ratio > 0.6 ? 'right' : 'none')
  }

  const speedRatio = Math.max(0, hud.speed) / hud.maxSpeed

  function pad(control: 'left' | 'right' | 'brake' | 'honk', label: string, className: string) {
    return (
      <button
        type="button"
        className={className}
        onPointerDown={(event) => hold(event, control, true)}
        onPointerUp={() => gameRef.current?.setHeld(control, false)}
        onPointerCancel={() => gameRef.current?.setHeld(control, false)}
        onLostPointerCapture={() => gameRef.current?.setHeld(control, false)}
      >
        {label}
      </button>
    )
  }

  return (
    <main className={hud.paused ? 'app is-paused' : 'app'} onContextMenu={(event) => event.preventDefault()}>
      <canvas
        ref={canvasRef}
        className="road"
        onPointerDown={(event) => {
          if (!isCoarse()) return
          try {
            event.currentTarget.setPointerCapture(event.pointerId)
          } catch {
            // already captured
          }
          steerTo(event, true)
        }}
        onPointerMove={(event) => {
          if (!isCoarse()) return
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
          steerTo(event, true)
        }}
        onPointerUp={() => gameRef.current?.setSteer('none')}
        onPointerCancel={() => gameRef.current?.setSteer('none')}
        onLostPointerCapture={() => gameRef.current?.setSteer('none')}
      />

      {hud.phase === 'drive' ? (
        <header className="hud">
          <div className="where">
            <p className="kicker">{hud.street}</p>
            <h1>{hud.district}</h1>
            <p className="addr">{hud.address}</p>
          </div>
          <div className="fare">
            <span>Fare</span>
            <strong>{naira(hud.fare)}</strong>
          </div>
          <div className="hud-side">
            <div className="lives" aria-label={`${hud.lives} lives left`}>
              {Array.from({ length: 3 }, (_, i) => (
                <i key={i} className={i < hud.lives ? 'on' : ''} />
              ))}
            </div>
            <button
              type="button"
              className="pause"
              aria-pressed={hud.paused}
              onClick={() => gameRef.current?.togglePause()}
            >
              {hud.paused ? 'Resume' : 'Pause'}
            </button>
          </div>
        </header>
      ) : null}

      {hud.phase === 'drive' ? (
        <div className="job" aria-live="polite">
          {hud.job ? (
            <>
              <span>Drop {hud.job}</span>
              <strong>{naira(hud.jobPay)}</strong>
            </>
          ) : (
            <>
              <span>Empty boot · pull the yellow lane</span>
              <em>Hail a passenger</em>
            </>
          )}
        </div>
      ) : null}

      {hud.phase === 'drive' ? (
        <div className="seats" aria-label={`${hud.riders.length} of ${hud.seats} passengers`}>
          {Array.from({ length: hud.seats }, (_, i) => (
            <i key={i} className={i < hud.riders.length ? 'on' : ''} title={hud.riders[i]?.name} />
          ))}
          <button type="button" className="owa" onClick={() => gameRef.current?.owa()}>
            Owa
          </button>
        </div>
      ) : null}

      {hud.phase === 'drive' ? (
        <div className="progress" aria-label={`Street ${hud.districtIndex + 1} of ${hud.districtCount}`}>
          {Array.from({ length: hud.districtCount }, (_, i) => (
            <span key={i} className={i <= hud.districtIndex ? 'on' : ''} />
          ))}
        </div>
      ) : null}

      {hud.phase === 'drive' ? <Timeline hud={hud} /> : null}
      {hud.phase === 'drive' && hud.warning ? <div className="warning">{hud.warning}</div> : null}

      {hud.banner ? (
        <div className="banner">
          <strong>{hud.banner}</strong>
          {hud.bannerSub ? <em>{hud.bannerSub}</em> : null}
        </div>
      ) : null}
      {hud.toast ? <div className="toast">{hud.toast}</div> : null}
      {hud.stalled ? <div className="stall">Rolling back on {hud.district}</div> : null}

      {hud.phase === 'drive' ? (
        <footer className="radio">
          <div className="meter" aria-hidden>
            <span style={{ width: `${Math.min(100, speedRatio * 100)}%` }} />
          </div>
          <p>{hud.radio}</p>
        </footer>
      ) : null}

      {hud.phase === 'title' ? (
        <section className="panel">
          <img src="/brand/logo.svg" alt="" width="84" height="84" />
          <p className="kicker">Ibadan Micra</p>
          <h1>Seven Hills</h1>
          <p className="lead">
            Nine streets, one Micra. Hail a passenger, drop them on the street they call, and do not roll back on Mokola.
          </p>
          <button type="button" onClick={() => gameRef.current?.startShift()}>
            Start shift
          </button>
          {hud.best > 0 ? <p className="best">Best fare {naira(hud.best)}</p> : null}
          <p className="sheet">{DISTRICTS.map((street) => street.name).join(' · ')}</p>
          <ul className="route">
            {preview.map((street) => (
              <li key={street.id}>
                <b>{street.name}</b>
                <span>
                  {street.street}, {street.address}
                </span>
              </li>
            ))}
          </ul>
          <p className="more">
            The shift ends at {finish.name}, {finish.address}. Mapo Hill is on the way up.
          </p>
          <ul className="how">
            <li>Dual carriageway with a walkway in the middle. High boards stand on that walkway.</li>
            <li>Your side is four lanes. White lines split them. The last lane on the right is yellow wait.</li>
            <li>Left and right step one lane. Pull into yellow, slow down, and people enter. Max four.</li>
            <li>Press Owa, or the Owa button, to drop them. That is how you shout “owa!”</li>
            <li>Honk sends keke off your line. Brake for the hill. Pause with P.</li>
          </ul>
        </section>
      ) : null}

      {hud.phase === 'drive' && hud.paused ? (
        <div className="pause-scrim" />
      ) : null}

      {hud.phase === 'drive' && hud.paused ? (
        <section className="panel pause-panel">
          <p className="kicker">Shift paused</p>
          <h1>Hold am</h1>
          <p className="lead">The Micra dey wait. Your fare stays where you left it.</p>
          <button type="button" onClick={() => gameRef.current?.togglePause()}>
            Resume
          </button>
        </section>
      ) : null}

      {hud.phase === 'over' || hud.phase === 'win' ? (
        <section className="panel">
          <p className="kicker">{hud.phase === 'win' ? 'Shift complete' : 'Shift over'}</p>
          <h1>{hud.phase === 'win' ? 'You don reach Oke Are' : 'The Micra don tire'}</h1>
          <p className="lead">
            {hud.phase === 'win'
              ? `${finish.address}. From up here the roofs are rust, and the road behind you is Ibadan.`
              : `Three hits on ${hud.street}. ${hud.address}. The hill is still there.`}
          </p>
          <p className="fare-end">{naira(hud.fare)}</p>
          <button type="button" onClick={() => gameRef.current?.startShift()}>
            Drive again
          </button>
        </section>
      ) : null}

      <div className="controls">
        {pad('left', 'Left', 'steer')}
        <div className="cluster">
          {pad('brake', 'Brake', 'brake')}
          {pad('honk', 'Honk', 'honk')}
          <button type="button" className="owa-pad" onClick={() => gameRef.current?.owa()}>
            Owa
          </button>
        </div>
        {pad('right', 'Right', 'steer')}
      </div>
    </main>
  )
}
