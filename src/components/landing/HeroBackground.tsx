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

function RainLayer() {
  return (
    <div className="hero-rain" aria-hidden>
      <span className="hero-rain__sheet hero-rain__sheet--front" />
      <span className="hero-rain__sheet hero-rain__sheet--mid" />
      <span className="hero-rain__sheet hero-rain__sheet--back" />
    </div>
  )
}

function LightningLayer() {
  return (
    <div className="hero-lightning" aria-hidden>
      <span className="hero-lightning__flash hero-lightning__flash--left" />
      <span className="hero-lightning__flash hero-lightning__flash--right" />
      <span className="hero-lightning__vein hero-lightning__vein--left" />
      <span className="hero-lightning__vein hero-lightning__vein--right" />
    </div>
  )
}

function StormKeepLayer() {
  return (
    <div className="hero-keep" aria-hidden>
      <span className="hero-keep__tower hero-keep__tower--left" />
      <span className="hero-keep__tower hero-keep__tower--right" />
      <span className="hero-keep__arch" />
      <span className="hero-keep__ridge" />
    </div>
  )
}

export function HeroBackground() {
  return (
    <div className="hero-background" aria-hidden>
      <div className="hero-gradient" />
      <div className="hero-noise" />
      <StormKeepLayer />
      <RainLayer />
      <FogLayer />
      <LightningLayer />
      <div className="hero-vignette" />
    </div>
  )
}
