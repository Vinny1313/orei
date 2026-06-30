import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

// ───────────────── Knobs da tempestade (canvas) ─────────────────
// Ajuste fino de chuva, vento, cinzas e relampagos num lugar so.
const RAIN_COUNT = 360 // densidade da chuva (desktop)
const RAIN_COUNT_MOBILE = 130 // densidade no mobile
const RAIN_SPEED = 1 // multiplicador de velocidade da chuva
const RAIN_ANGLE = 0.26 // inclinacao base em rad (~15deg)
const WIND = 0.16 // amplitude da oscilacao de vento (rad)
const GUST_CHANCE = 0.5 // prob. de rajada a cada janela de vento
const ASH_COUNT = 28 // motas de cinza/poeira (desktop)
const LIGHTNING_MIN_MS = 8000 // intervalo minimo entre relampagos
const LIGHTNING_MAX_MS = 16000 // intervalo maximo entre relampagos
const LIGHTNING_FLASH = 0.24 // intensidade maxima do clarao (0–1)
const SHEET_CHANCE = 0.42 // prob. de ser clarao distante (sem raio)
const PARALLAX = 1 // 0 desliga o parallax de mouse
// ─────────────────────────────────────────────────────────────────

type Drop = { x: number; y: number; len: number; vy: number; w: number; o: number }
type Ash = { x: number; y: number; vx: number; vy: number; r: number; o: number; ph: number }
type Bolt = { paths: Array<Array<[number, number]>>; life: number }

const rand = (a: number, b: number) => a + Math.random() * (b - a)

export function StormCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const parent = canvas.parentElement as HTMLElement | null
    const isMobile = window.matchMedia('(max-width: 760px)').matches
    const rainCount = isMobile ? RAIN_COUNT_MOBILE : RAIN_COUNT
    const ashCount = isMobile ? Math.round(ASH_COUNT / 2) : ASH_COUNT

    let w = 0
    let h = 0
    let drops: Drop[] = []
    let ashes: Ash[] = []

    const makeDrop = (initial: boolean): Drop => {
      const speed = rand(7, 15) * RAIN_SPEED
      return {
        x: rand(-0.15 * w, 1.15 * w),
        y: initial ? rand(-h, h) : rand(-0.25 * h, -10),
        len: rand(13, 32),
        vy: speed,
        w: rand(0.6, 1.5),
        o: rand(0.14, 0.5),
      }
    }

    const makeAsh = (): Ash => ({
      x: rand(0, w),
      y: rand(0, h),
      vx: rand(-0.15, 0.15),
      vy: rand(-0.28, -0.05),
      r: rand(0.6, 1.7),
      o: rand(0.08, 0.32),
      ph: rand(0, Math.PI * 2),
    })

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drops = Array.from({ length: rainCount }, () => makeDrop(true))
      ashes = Array.from({ length: ashCount }, makeAsh)
    }

    // ── Parallax (mouse) → escreve --mx/--my no .hero-background ──
    let tgtMx = 0
    let tgtMy = 0
    let curMx = 0
    let curMy = 0
    const onPointer = (e: PointerEvent) => {
      tgtMx = (e.clientX / window.innerWidth - 0.5) * 2
      tgtMy = (e.clientY / window.innerHeight - 0.5) * 2
    }
    if (PARALLAX && parent && !isMobile) window.addEventListener('pointermove', onPointer)

    // ── Vento + rajadas ──
    let windPhase = rand(0, 10)
    let gust = 0 // 0..1
    let gustTarget = 0
    let nextGust = performance.now() + rand(5000, 11000)

    // ── Relampago ──
    let flash = 0
    let flashX = 0.5
    let flashPeak = LIGHTNING_FLASH
    let bolt: Bolt | null = null
    let nextStrike = performance.now() + rand(LIGHTNING_MIN_MS, LIGHTNING_MAX_MS)
    const timers: number[] = []

    const buildPath = (x0: number, fromY: number, toY: number, jitter: number) => {
      const pts: Array<[number, number]> = [[x0, fromY]]
      let x = x0
      let y = fromY
      const segs = 7
      for (let i = 1; i <= segs; i++) {
        y += (toY - fromY) / segs
        x += rand(-jitter, jitter)
        pts.push([x, y])
      }
      return pts
    }

    const strike = (now: number) => {
      nextStrike = now + rand(LIGHTNING_MIN_MS, LIGHTNING_MAX_MS)
      flashX = rand(0.18, 0.82)

      if (Math.random() < SHEET_CHANCE) {
        // Clarao distante difuso, sem raio (variedade)
        flashPeak = LIGHTNING_FLASH * 0.6
        flash = 0.6
        timers.push(window.setTimeout(() => (flash = Math.max(flash, 0.9)), 80))
        bolt = null
        return
      }

      // Raio fragmentado com forquilhas
      flashPeak = LIGHTNING_FLASH
      flash = 0.55
      timers.push(window.setTimeout(() => (flash = Math.max(flash, 1)), 95))
      const x0 = flashX * w
      const target = rand(h * 0.42, h * 0.66)
      const main = buildPath(x0, -20, target, 46)
      const paths = [main]
      // 1–2 ramos saindo de um ponto medio do raio principal
      const forks = Math.random() < 0.65 ? 2 : 1
      for (let f = 0; f < forks; f++) {
        const anchor = main[2 + Math.floor(Math.random() * 3)]
        paths.push(buildPath(anchor[0], anchor[1], anchor[1] + rand(h * 0.14, h * 0.28), 34))
      }
      bolt = { paths, life: 1 }
    }

    let raf = 0
    let last = performance.now()

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 2.5)
      last = now
      ctx.clearRect(0, 0, w, h)

      // Parallax suave
      if (parent) {
        curMx += (tgtMx - curMx) * 0.05 * dt
        curMy += (tgtMy - curMy) * 0.05 * dt
        parent.style.setProperty('--mx', curMx.toFixed(3))
        parent.style.setProperty('--my', curMy.toFixed(3))
      }

      // Vento: oscilacao continua + rajadas
      windPhase += 0.004 * dt
      if (now >= nextGust) {
        gustTarget = Math.random() < GUST_CHANCE ? rand(0.6, 1) : 0
        nextGust = now + rand(4000, 9000)
      }
      gust += (gustTarget - gust) * 0.02 * dt
      const windEnv = Math.sin(windPhase) * 0.7 + Math.sin(windPhase * 0.37) * 0.3
      const angle = RAIN_ANGLE + windEnv * WIND + gust * 0.22
      const sinA = Math.sin(angle)
      const cosA = Math.cos(angle)
      const speedMul = 1 + gust * 0.45

      // Chuva
      ctx.lineCap = 'round'
      for (const d of drops) {
        d.y += d.vy * speedMul * dt
        d.x += d.vy * speedMul * sinA * dt
        if (d.y - d.len > h || d.x < -0.2 * w || d.x > 1.2 * w) Object.assign(d, makeDrop(false))
        ctx.strokeStyle = `rgba(202, 220, 240, ${d.o})`
        ctx.lineWidth = d.w
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - sinA * d.len, d.y - cosA * d.len)
        ctx.stroke()
      }

      // Cinzas/poeira
      for (const a of ashes) {
        a.ph += 0.01 * dt
        a.x += (a.vx + Math.sin(a.ph) * 0.15 + windEnv * 0.2) * dt
        a.y += a.vy * dt
        if (a.y < -10) {
          a.y = h + 10
          a.x = rand(0, w)
        }
        ctx.fillStyle = `rgba(150, 140, 124, ${a.o})`
        ctx.beginPath()
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Dispara relampago
      if (now >= nextStrike) strike(now)

      // Raio + forquilhas
      if (bolt) {
        ctx.save()
        ctx.strokeStyle = `rgba(224, 236, 255, ${0.6 * bolt.life})`
        ctx.lineCap = 'round'
        ctx.shadowColor = 'rgba(190, 210, 255, 0.9)'
        ctx.shadowBlur = 20
        for (const path of bolt.paths) {
          ctx.lineWidth = path === bolt.paths[0] ? 2.2 : 1.2
          ctx.beginPath()
          ctx.moveTo(path[0][0], path[0][1])
          for (const p of path) ctx.lineTo(p[0], p[1])
          ctx.stroke()
        }
        ctx.restore()
        bolt.life -= 0.085 * dt
        if (bolt.life <= 0) bolt = null
      }

      // Clarao que irradia da posicao do raio (ilumina a cena)
      if (flash > 0.01) {
        const fx = flashX * w
        const grad = ctx.createRadialGradient(fx, h * 0.03, 0, fx, h * 0.03, h * 1.15)
        const a = flash * flashPeak
        grad.addColorStop(0, `rgba(208, 224, 255, ${a})`)
        grad.addColorStop(0.45, `rgba(150, 172, 214, ${a * 0.4})`)
        grad.addColorStop(1, 'rgba(120, 140, 180, 0)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
        flash *= Math.pow(0.85, dt)
      }

      raf = requestAnimationFrame(frame)
    }

    resize()
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      timers.forEach(clearTimeout)
      parent?.style.removeProperty('--mx')
      parent?.style.removeProperty('--my')
    }
  }, [reduce])

  return <canvas ref={ref} className="hero-storm-canvas" aria-hidden />
}
