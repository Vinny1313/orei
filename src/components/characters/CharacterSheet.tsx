// Ficha completa de um personagem. Recebe a ficha inicial + um callback de persistência
// (vindo do useCharacter) e cuida de todo o estado/edição/autosave.
//
// Esta é a refatoração do antigo App.tsx: mesma funcionalidade, agora quebrada em seções
// e plugada no characterService via a prop onSave.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { ArrowLeft, Download, RotateCcw, Save, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CLASS_DATA, createDefaultSheet } from '../../data/characterData'
import type {
  AttributeKey,
  CharacterSheet as CharacterSheetType,
  Item,
  RollResult,
} from '../../types/character'
import { rollD20 } from '../../utils/dice'
import { IdentitySection } from './sections/IdentitySection'
import { AttributesSection } from './sections/AttributesSection'
import { CombatSection } from './sections/CombatSection'
import { LastRollPanel } from './sections/LastRollPanel'
import { SkillsSection } from './sections/SkillsSection'
import { AbilitiesSection } from './sections/AbilitiesSection'
import { InventorySection } from './sections/InventorySection'
import { NotesSection } from './sections/NotesSection'
import { DiceRoller } from './DiceRoller'

const AUTOSAVE_DELAY = 700

type CharacterSheetProps = {
  initialSheet: CharacterSheetType
  onSave: (sheet: CharacterSheetType) => Promise<unknown>
}

export function CharacterSheet({ initialSheet, onSave }: CharacterSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [sheet, setSheet] = useState<CharacterSheetType>(initialSheet)
  const [roll, setRoll] = useState<RollResult | null>(null)
  const [savedAt, setSavedAt] = useState('—')
  const [saving, setSaving] = useState(false)

  // Pula o autosave do primeiro render (a ficha acabou de ser carregada, não há o que salvar).
  const skipNextAutosave = useRef(true)

  const persist = useCallback(
    async (next: CharacterSheetType) => {
      setSaving(true)
      try {
        await onSave(next)
        setSavedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
      } finally {
        setSaving(false)
      }
    },
    [onSave],
  )

  // Autosave com debounce: persiste ~700ms após a última mudança da ficha.
  useEffect(() => {
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false
      return
    }
    const handle = window.setTimeout(() => {
      void persist(sheet)
    }, AUTOSAVE_DELAY)
    return () => window.clearTimeout(handle)
  }, [sheet, persist])

  const updateIdentity = <K extends keyof CharacterSheetType['identity']>(
    key: K,
    value: CharacterSheetType['identity'][K],
  ) => {
    setSheet((current) => ({ ...current, identity: { ...current.identity, [key]: value } }))
  }

  const updateCombat = <K extends keyof CharacterSheetType['combat']>(key: K, value: number) => {
    setSheet((current) => ({ ...current, combat: { ...current.combat, [key]: value } }))
  }

  const updateAttribute = (key: AttributeKey, field: 'value' | 'mod', value: number) => {
    setSheet((current) => ({
      ...current,
      attributes: {
        ...current.attributes,
        [key]: { ...current.attributes[key], [field]: value },
      },
    }))
  }

  const toggleSkill = (name: string) => {
    setSheet((current) => {
      const exists = current.trainedSkills.includes(name)
      return {
        ...current,
        trainedSkills: exists
          ? current.trainedSkills.filter((skill) => skill !== name)
          : [...current.trainedSkills, name],
      }
    })
  }

  const trainSuggestedSkills = () => {
    setSheet((current) => {
      const classInfo = CLASS_DATA[current.identity.className]
      const skills = [...(classInfo.fixed ?? []), ...classInfo.suggested]
      return { ...current, trainedSkills: Array.from(new Set([...current.trainedSkills, ...skills])) }
    })
  }

  const updateItem = <K extends keyof Item>(id: string, key: K, value: Item[K]) => {
    setSheet((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }))
  }

  const addItem = () => {
    setSheet((current) => ({
      ...current,
      items: [...current.items, { id: crypto.randomUUID(), name: '', weight: 0, quantity: 1 }],
    }))
  }

  const removeItem = (id: string) => {
    setSheet((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }))
  }

  const updateTextList = (key: 'customSkills' | 'passives', index: number, value: string) => {
    setSheet((current) => ({
      ...current,
      [key]: current[key].map((entry, entryIndex) => (entryIndex === index ? value : entry)),
    }))
  }

  const rollDice = (label: string, bonus = 0) => {
    const result = rollD20(bonus)
    setRoll({ label, ...result })
  }

  const exportSheet = () => {
    const blob = new Blob([JSON.stringify(sheet, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${sheet.identity.characterName || 'ficha-orei'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importSheet = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result))
        setSheet({ ...createDefaultSheet(), ...imported })
      } catch {
        window.alert('Não consegui importar esse arquivo JSON.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const resetSheet = () => {
    if (window.confirm('Restaurar esta ficha para o padrão?')) {
      setSheet(createDefaultSheet())
      setRoll(null)
    }
  }

  const saveNow = () => {
    void persist(sheet)
  }

  return (
    <>
      <header className="topbar">
        <div>
          <Link to="/agentes" className="back-link">
            <ArrowLeft size={16} aria-hidden />
            Voltar aos agentes
          </Link>
          <h1>O Rei Mandou</h1>
        </div>
        <div className="toolbar">
          <span className="autosave">
            <Save size={16} aria-hidden />
            {saving ? 'Salvando…' : `Salvo ${savedAt}`}
          </span>
          <button type="button" className="save-button" onClick={saveNow} title="Salvar agora">
            <Save size={16} aria-hidden />
            Salvar
          </button>
          <button type="button" className="icon-button" onClick={exportSheet} title="Exportar JSON">
            <Download size={18} aria-hidden />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => fileInputRef.current?.click()}
            title="Importar JSON"
          >
            <Upload size={18} aria-hidden />
          </button>
          <button type="button" className="icon-button danger" onClick={resetSheet} title="Restaurar padrão">
            <RotateCcw size={18} aria-hidden />
          </button>
          <input ref={fileInputRef} className="sr-only" type="file" accept="application/json" onChange={importSheet} />
        </div>
      </header>

      <section className="hero-strip">
        <div>
          <p className="eyebrow">Personagem</p>
          <input
            className="hero-name"
            value={sheet.identity.characterName}
            onChange={(event) => updateIdentity('characterName', event.target.value)}
            placeholder="Nome do personagem"
          />
        </div>
        <DiceRoller onRoll={rollDice} />
      </section>

      <section className="dashboard-grid">
        <IdentitySection sheet={sheet} updateIdentity={updateIdentity} />
        <AttributesSection sheet={sheet} updateAttribute={updateAttribute} rollDice={rollDice} />
        <CombatSection sheet={sheet} updateCombat={updateCombat} rollDice={rollDice} />
        <LastRollPanel roll={roll} />
        <SkillsSection
          sheet={sheet}
          toggleSkill={toggleSkill}
          trainSuggestedSkills={trainSuggestedSkills}
          rollDice={rollDice}
        />
        <AbilitiesSection sheet={sheet} updateTextList={updateTextList} />
        <InventorySection
          sheet={sheet}
          updateItem={updateItem}
          addItem={addItem}
          removeItem={removeItem}
          setGold={(value) => setSheet((current) => ({ ...current, gold: value }))}
        />
        <NotesSection
          sheet={sheet}
          setNotes={(value) => setSheet((current) => ({ ...current, notes: value }))}
        />
      </section>
    </>
  )
}
