// Atmosfera cinematografica da landing — tempestade medieval dark fantasy.
// Camadas decorativas (aria-hidden + pointer-events:none). Chuva, cinzas e
// relampagos rodam num <canvas> leve (StormCanvas); nevoa/horizonte/vinheta
// sao CSS. Knobs de chuva/raio em StormCanvas.tsx; nevoa/vinheta/brilho em
// App.css (variaveis em `.landing`).
import { StormCanvas } from './StormCanvas'

// Horizonte difuso: profundidade no rodape sem nenhuma forma reconhecivel.
function HorizonLayer() {
  return (
    <div className="hero-horizon" aria-hidden>
      <span className="hero-horizon__haze" />
      <span className="hero-horizon__base" />
    </div>
  )
}

// Feixes de luar sutis atravessando a tempestade (atmosfera, sem poluir).
function RaysLayer() {
  return (
    <div className="hero-rays" aria-hidden>
      <span className="hero-rays__beam hero-rays__beam--a" />
      <span className="hero-rays__beam hero-rays__beam--b" />
    </div>
  )
}

// Nevoa densa e fria em camadas com deriva lenta.
function FogLayer() {
  return (
    <div className="hero-fog" aria-hidden>
      <span className="hero-fog__veil" />
      <span className="hero-fog__veil hero-fog__veil--low" />
      <span className="hero-fog__bank hero-fog__bank--near" />
      <span className="hero-fog__bank hero-fog__bank--mid" />
      <span className="hero-fog__bank hero-fog__bank--far" />
    </div>
  )
}

export function HeroBackground() {
  return (
    <div className="hero-background" aria-hidden>
      <div className="hero-gradient" />
      <div className="hero-noise" />
      <HorizonLayer />
      <RaysLayer />
      <FogLayer />
      <StormCanvas />
      <div className="hero-vignette" />
    </div>
  )
}
