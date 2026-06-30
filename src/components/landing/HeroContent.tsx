import { LogIn, ScrollText, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

// Conteudo da hero. A entrada (fade/sobe/escala com stagger) e o hover dos CTAs
// sao 100% CSS (ver .hero-content__* e .hero-cta em App.css) — sem JS de animacao
// no caminho critico, o que melhora LCP/INP e respeita prefers-reduced-motion.
export function HeroContent() {
  return (
    <div className="landing__inner hero-content">
      <p className="eyebrow hero-content__eyebrow">Ficha digital de RPG</p>

      <h1 className="landing__title hero-content__title">
        <span className="hero-content__sigil" aria-hidden>
          <Shield size={44} />
        </span>
        O Rei Mandou
      </h1>

      <p className="landing__lead hero-content__lead">
        Crie, gerencie e role os dados das suas fichas de personagem. Seu reino de aventureiros,
        sempre à mão.
      </p>

      <div className="landing__actions hero-content__actions">
        <Link to="/login" className="roll-button hero-cta hero-cta--primary">
          <LogIn size={18} aria-hidden />
          Entrar
        </Link>
        <Link to="/agentes" className="ghost-button hero-cta hero-cta--secondary">
          <ScrollText size={18} aria-hidden />
          Ver meus agentes
        </Link>
      </div>
    </div>
  )
}
