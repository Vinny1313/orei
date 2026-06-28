// Ficha completa de personagem: estado local, autosave, abas, rolagens e import/export.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  Archive,
  ArrowLeft,
  Download,
  Dice5,
  History,
  ListChecks,
  RotateCcw,
  Save,
  Shield,
  Upload,
  Wand2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  CLASS_DATA,
  createBlankAbility,
  createBlankPassive,
  createDefaultSheet,
} from '../../data/characterData'
import { normalizeSheet } from '../../services/characters/normalizeSheet'
import type {
  AbilityEntry,
  AttributeKey,
  CharacterSheet as CharacterSheetType,
  Item,
  PassiveEntry,
  RollHistoryEntry,
  RollSource,
  SheetTab,
} from '../../types/character'
import { rollFormula } from '../../utils/dice'
import { AbilitiesSection } from './sections/AbilitiesSection'
import { AttributesSection } from './sections/AttributesSection'
import { CombatSection } from './sections/CombatSection'
import { InventorySection } from './sections/InventorySection'
import { SkillsSection } from './sections/SkillsSection'
import { CharacterIdentityHeader } from './CharacterIdentityHeader'
import { NotesRail } from './NotesRail'
import { RollHistoryDrawer } from './RollHistoryDrawer'
import { RollToast } from './RollToast'

const AUTOSAVE_DELAY = 700
const ROLL_HISTORY_LIMIT = 50

type CharacterSheetProps = {
  initialSheet: CharacterSheetType
  onSave: (sheet: CharacterSheetType) => Promise<unknown>
}

type TabDefinition = {
  id: SheetTab
  label: string
  Icon: typeof Shield
}

const TABS: TabDefinition[] = [
  { id: 'principal', label: 'Principal', Icon: Shield },
  { id: 'pericias', label: 'Pericias', Icon: ListChecks },
  { id: 'habilidades', label: 'Habilidades', Icon: Wand2 },
  { id: 'mochila', label: 'Mochila', Icon: Archive },
]

const formulaForBonus = (bonus = 0): string =>
  `d20${bonus ? (bonus > 0 ? `+${bonus}` : `${bonus}`) : ''}`

export function CharacterSheet({ initialSheet, onSave }: CharacterSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [sheet, setSheet] = useState<CharacterSheetType>(initialSheet)
  const [activeTab, setActiveTab] = useState<SheetTab>('principal')
  const [toastRoll, setToastRoll] = useState<RollHistoryEntry | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [savedAt, setSavedAt] = useState('-')
  const [saving, setSaving] = useState(false)

  // Pula o autosave do primeiro render: a ficha acabou de ser carregada.
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

  useEffect(() => {
    if (!toastRoll) return
    const handle = window.setTimeout(() => setToastRoll(null), 3600)
    return () => window.clearTimeout(handle)
  }, [toastRoll])

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

  const updateSkillAttribute = (skillName: string, attribute: AttributeKey) => {
    setSheet((current) => ({
      ...current,
      skillAttributeOverrides: { ...current.skillAttributeOverrides, [skillName]: attribute },
    }))
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

  const updateAbility = <K extends Exclude<keyof AbilityEntry, 'id'>>(
    id: string,
    key: K,
    value: AbilityEntry[K],
  ) => {
    setSheet((current) => ({
      ...current,
      abilities: current.abilities.map((ability) =>
        ability.id === id ? { ...ability, [key]: value } : ability,
      ),
    }))
  }

  const addAbility = () => {
    setSheet((current) => ({ ...current, abilities: [...current.abilities, createBlankAbility()] }))
  }

  const removeAbility = (id: string) => {
    setSheet((current) => ({
      ...current,
      abilities: current.abilities.filter((ability) => ability.id !== id),
    }))
  }

  const updatePassive = <K extends Exclude<keyof PassiveEntry, 'id'>>(
    id: string,
    key: K,
    value: PassiveEntry[K],
  ) => {
    setSheet((current) => ({
      ...current,
      passives: current.passives.map((passive) =>
        passive.id === id ? { ...passive, [key]: value } : passive,
      ),
    }))
  }

  const addPassive = () => {
    setSheet((current) => ({ ...current, passives: [...current.passives, createBlankPassive()] }))
  }

  const removePassive = (id: string) => {
    setSheet((current) => ({
      ...current,
      passives: current.passives.filter((passive) => passive.id !== id),
    }))
  }

  const performRoll = useCallback(
    (label: string, formula: string, source: RollSource): boolean => {
      const result = rollFormula(formula)
      if (!result) return false

      const entry: RollHistoryEntry = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        label,
        source,
        ...result,
      }

      setSheet((current) => ({
        ...current,
        rollHistory: [entry, ...current.rollHistory].slice(0, ROLL_HISTORY_LIMIT),
      }))
      setToastRoll(entry)
      return true
    },
    [],
  )

  const rollDice = useCallback(
    (label: string, bonus = 0, source: RollSource = 'generic') => {
      performRoll(label, formulaForBonus(bonus), source)
    },
    [performRoll],
  )

  const rollDamage = useCallback(
    (label: string, formula: string): boolean => performRoll(`${label} - dano`, formula, 'damage'),
    [performRoll],
  )

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
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result))
        setSheet(normalizeSheet(imported))
        setActiveTab('principal')
      } catch {
        window.alert('Nao consegui importar esse arquivo JSON.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const resetSheet = () => {
    if (window.confirm('Restaurar esta ficha para o padrao?')) {
      setSheet(createDefaultSheet())
      setToastRoll(null)
      setActiveTab('principal')
    }
  }

  const saveNow = () => {
    void persist(sheet)
  }

  const clearHistory = () => {
    setSheet((current) => ({ ...current, rollHistory: [] }))
  }

  return (
    <>
      <header className="topbar character-topbar">
        <div>
          <Link to="/agentes" className="back-link">
            <ArrowLeft size={16} aria-hidden />
            Voltar aos agentes
          </Link>
          <h1>Ficha</h1>
        </div>
        <div className="toolbar">
          <span className="autosave">
            <Save size={16} aria-hidden />
            {saving ? 'Salvando...' : `Salvo ${savedAt}`}
          </span>
          <button type="button" className="ghost-button" onClick={() => setHistoryOpen(true)}>
            <History size={16} aria-hidden />
            Historico
          </button>
          <button type="button" className="dry-d20-button" onClick={() => rollDice('d20 seco', 0, 'generic')}>
            <Dice5 size={18} aria-hidden />
            d20 seco
          </button>
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
          <button type="button" className="icon-button danger" onClick={resetSheet} title="Restaurar padrao">
            <RotateCcw size={18} aria-hidden />
          </button>
          <input ref={fileInputRef} className="sr-only" type="file" accept="application/json" onChange={importSheet} />
        </div>
      </header>

      <CharacterIdentityHeader sheet={sheet} updateIdentity={updateIdentity} />

      <nav className="sheet-tabs" aria-label="Abas da ficha">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={activeTab === id ? 'active' : ''}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} aria-hidden />
            {label}
          </button>
        ))}
      </nav>

      <section className="sheet-workspace">
        <div className="sheet-main-panel">
          {activeTab === 'principal' && (
            <div className="principal-layout">
              <AttributesSection sheet={sheet} updateAttribute={updateAttribute} rollDice={rollDice} />
              <CombatSection sheet={sheet} updateCombat={updateCombat} rollDice={rollDice} />
            </div>
          )}

          {activeTab === 'pericias' && (
            <SkillsSection
              sheet={sheet}
              toggleSkill={toggleSkill}
              trainSuggestedSkills={trainSuggestedSkills}
              updateSkillAttribute={updateSkillAttribute}
              rollDice={rollDice}
            />
          )}

          {activeTab === 'habilidades' && (
            <AbilitiesSection
              abilities={sheet.abilities}
              passives={sheet.passives}
              updateAbility={updateAbility}
              addAbility={addAbility}
              removeAbility={removeAbility}
              updatePassive={updatePassive}
              addPassive={addPassive}
              removePassive={removePassive}
              rollDamage={rollDamage}
            />
          )}

          {activeTab === 'mochila' && (
            <InventorySection
              sheet={sheet}
              updateItem={updateItem}
              addItem={addItem}
              removeItem={removeItem}
              setGold={(value) => setSheet((current) => ({ ...current, gold: value }))}
            />
          )}
        </div>

        <NotesRail
          sheet={sheet}
          setNotes={(value) => setSheet((current) => ({ ...current, notes: value }))}
        />
      </section>

      <RollHistoryDrawer
        open={historyOpen}
        rolls={sheet.rollHistory}
        onClose={() => setHistoryOpen(false)}
        onClear={clearHistory}
      />
      <RollToast roll={toastRoll} onDismiss={() => setToastRoll(null)} />
    </>
  )
}
