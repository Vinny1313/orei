import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { LogIn, ScrollText, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

const cinematicEase = [0.16, 1, 0.3, 1] as const

const contentVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.18,
      staggerChildren: 0.16,
    },
  },
}

const titleVariants: Variants = {
  hidden: {
    opacity: 0,
    filter: 'blur(14px)',
    scale: 0.96,
    y: 18,
  },
  show: {
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: cinematicEase,
    },
  },
}

const textVariants: Variants = {
  hidden: {
    opacity: 0,
    filter: 'blur(8px)',
    y: 14,
  },
  show: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: {
      duration: 0.7,
      ease: cinematicEase,
    },
  },
}

const actionsVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.62,
      ease: cinematicEase,
    },
  },
}

export function HeroContent() {
  const reduceMotion = useReducedMotion()
  const ctaHover = reduceMotion ? undefined : { y: -2, scale: 1.02 }
  const ctaTap = reduceMotion ? undefined : { scale: 0.98 }

  return (
    <motion.div
      className="landing__inner hero-content"
      variants={contentVariants}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <motion.p className="eyebrow hero-content__eyebrow" variants={textVariants}>
        Ficha digital de RPG
      </motion.p>

      <motion.h1 className="landing__title hero-content__title" variants={titleVariants}>
        <span className="hero-content__sigil" aria-hidden>
          <Shield size={44} />
        </span>
        O Rei Mandou
      </motion.h1>

      <motion.p className="landing__lead hero-content__lead" variants={textVariants}>
        Crie, gerencie e role os dados das suas fichas de personagem. Seu reino de aventureiros,
        sempre à mão.
      </motion.p>

      <motion.div className="landing__actions hero-content__actions" variants={actionsVariants}>
        <motion.div whileHover={ctaHover} whileTap={ctaTap}>
          <Link to="/login" className="roll-button hero-cta hero-cta--primary">
            <LogIn size={18} aria-hidden />
            Entrar
          </Link>
        </motion.div>
        <motion.div whileHover={ctaHover} whileTap={ctaTap}>
          <Link to="/agentes" className="ghost-button hero-cta hero-cta--secondary">
            <ScrollText size={18} aria-hidden />
            Ver meus agentes
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
