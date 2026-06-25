import {
  Activity,
  Archive,
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  Dice5,
  Download,
  HeartPulse,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Upload,
  UserRound,
  Wand2,
} from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type AttributeKey = 'forca' | 'destreza' | 'constituicao' | 'inteligencia' | 'sabedoria' | 'carisma'
type ClassName =
  | 'Guerreiro'
  | 'Mago'
  | 'Ladino'
  | 'Clérigo'
  | 'Arqueiro'
  | 'Bardo'
  | 'Necromante'
  | 'Paladino'
  | 'Druida'
  | 'Monge'

type Attribute = {
  label: string
  value: number
  mod: number
}

type Skill = {
  name: string
  attribute: AttributeKey
}

type Item = {
  id: string
  name: string
  weight: number
  quantity: number
}

type CharacterSheet = {
  identity: {
    characterName: string
    playerName: string
    className: ClassName
    level: number
    proficiency: number
  }
  attributes: Record<AttributeKey, Attribute>
  combat: {
    maxHp: number
    currentHp: number
    armorClass: number
    initiative: number
    sanity: number
    movement: number
  }
  trainedSkills: string[]
  customSkills: string[]
  passives: string[]
  items: Item[]
  gold: number
  notes: string
}

type RollResult = {
  label: string
  d20: number
  bonus: number
  total: number
}

const STORAGE_KEY = 'orei-character-sheet-v1'

const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  forca: 'Força',
  destreza: 'Destreza',
  constituicao: 'Constituição',
  inteligencia: 'Inteligência',
  sabedoria: 'Sabedoria',
  carisma: 'Carisma',
}

const SKILLS: Skill[] = [
  { name: 'Acrobacia', attribute: 'destreza' },
  { name: 'Atletismo', attribute: 'forca' },
  { name: 'Enganação', attribute: 'carisma' },
  { name: 'Furtividade', attribute: 'destreza' },
  { name: 'História', attribute: 'inteligencia' },
  { name: 'Intimidação', attribute: 'carisma' },
  { name: 'Investigação', attribute: 'inteligencia' },
  { name: 'Medicina', attribute: 'sabedoria' },
  { name: 'Natureza', attribute: 'inteligencia' },
  { name: 'Percepção', attribute: 'sabedoria' },
  { name: 'Persuasão', attribute: 'carisma' },
  { name: 'Religião', attribute: 'inteligencia' },
  { name: 'Sobrevivência', attribute: 'sabedoria' },
]

const CLASS_DATA: Record<ClassName, { ability: string; picks: string; suggested: string[]; fixed?: string[] }> = {
  Guerreiro: {
    ability: 'Golpe Destruidor: rola dano 2x e usa qualquer armadura.',
    picks: 'Escolha 2',
    suggested: ['Atletismo', 'Intimidação', 'Acrobacia', 'Sobrevivência'],
  },
  Mago: {
    ability: 'Chance de usar uma habilidade mais uma vez caso erre.',
    picks: 'Escolha 2',
    suggested: ['Investigação', 'História', 'Medicina', 'Religião'],
  },
  Ladino: {
    ability: 'Ataque Furtivo: +1d6 se atacar escondido.',
    picks: 'Furtividade + escolha 2',
    fixed: ['Furtividade'],
    suggested: ['Acrobacia', 'Enganação', 'Investigação'],
  },
  Clérigo: {
    ability: 'O tentáculo te guiará.',
    picks: 'Escolha 2',
    suggested: ['Medicina', 'Religião', 'Persuasão', 'História'],
  },
  Arqueiro: {
    ability: 'Ignora algumas coberturas e soma +10 de dano em acertos críticos.',
    picks: 'Escolha 2',
    suggested: ['Percepção', 'Furtividade', 'Natureza', 'Sobrevivência'],
  },
  Bardo: {
    ability: 'Canção da Bravura: dá +2 no dado de um aliado.',
    picks: 'Escolha 3',
    suggested: ['Persuasão', 'Enganação', 'Acrobacia', 'Percepção', 'História'],
  },
  Necromante: {
    ability: 'Despertar Ossos: invoca mortos-vivos aliados.',
    picks: 'Escolha 2',
    suggested: ['Medicina', 'Religião', 'Intimidação', 'Natureza'],
  },
  Paladino: {
    ability: 'Aura Sagrada: +1 CA para aliados próximos.',
    picks: 'Escolha 2',
    suggested: ['Atletismo', 'Religião', 'Persuasão', 'Medicina'],
  },
  Druida: {
    ability: 'Magia da selva: pode falar com animais.',
    picks: 'Escolha 2',
    suggested: ['Natureza', 'Sobrevivência', 'Medicina', 'Percepção'],
  },
  Monge: {
    ability: 'Ataca 2x por turno se estiver desarmado. Muito rápido.',
    picks: 'Escolha 2',
    suggested: ['Acrobacia', 'Atletismo', 'Percepção', 'Furtividade'],
  },
}

const createDefaultSheet = (): CharacterSheet => ({
  identity: {
    characterName: '',
    playerName: '',
    className: 'Guerreiro',
    level: 1,
    proficiency: 2,
  },
  attributes: {
    forca: { label: 'Força', value: 10, mod: 0 },
    destreza: { label: 'Destreza', value: 10, mod: 0 },
    constituicao: { label: 'Constituição', value: 10, mod: 0 },
    inteligencia: { label: 'Inteligência', value: 10, mod: 0 },
    sabedoria: { label: 'Sabedoria', value: 10, mod: 0 },
    carisma: { label: 'Carisma', value: 10, mod: 0 },
  },
  combat: {
    maxHp: 10,
    currentHp: 10,
    armorClass: 10,
    initiative: 0,
    sanity: 100,
    movement: 9,
  },
  trainedSkills: [],
  customSkills: ['', ''],
  passives: ['', ''],
  items: [{ id: crypto.randomUUID(), name: 'Tocha', weight: 1, quantity: 1 }],
  gold: 0,
  notes: '',
})

const asNumber = (value: string) => Number(value) || 0
const signed = (value: number) => (value >= 0 ? `+${value}` : `${value}`)

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [sheet, setSheet] = useState<CharacterSheet>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      return createDefaultSheet()
    }

    try {
      return { ...createDefaultSheet(), ...JSON.parse(saved) }
    } catch {
      return createDefaultSheet()
    }
  })
  const [roll, setRoll] = useState<RollResult | null>(null)
  const [savedAt, setSavedAt] = useState('agora')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sheet))
    setSavedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
  }, [sheet])

  const classInfo = CLASS_DATA[sheet.identity.className]
  const carriedWeight = useMemo(
    () => sheet.items.reduce((total, item) => total + item.weight * item.quantity, 0),
    [sheet.items],
  )
  const carryLimit = sheet.attributes.forca.value * 5
  const overloaded = carriedWeight > carryLimit

  const updateIdentity = <K extends keyof CharacterSheet['identity']>(
    key: K,
    value: CharacterSheet['identity'][K],
  ) => {
    setSheet((current) => ({ ...current, identity: { ...current.identity, [key]: value } }))
  }

  const updateCombat = <K extends keyof CharacterSheet['combat']>(key: K, value: number) => {
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
    const skills = [...(classInfo.fixed ?? []), ...classInfo.suggested]
    setSheet((current) => ({ ...current, trainedSkills: Array.from(new Set([...current.trainedSkills, ...skills])) }))
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
    const d20 = Math.floor(Math.random() * 20) + 1
    setRoll({ label, d20, bonus, total: d20 + bonus })
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
    if (window.confirm('Resetar a ficha atual?')) {
      setSheet(createDefaultSheet())
      setRoll(null)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Ficha digital</p>
          <h1>O Rei Mandou</h1>
        </div>
        <div className="toolbar">
          <span className="autosave">
            <Save size={16} aria-hidden />
            Salvo {savedAt}
          </span>
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
          <button type="button" className="icon-button danger" onClick={resetSheet} title="Resetar ficha">
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
        <button type="button" className="roll-button" onClick={() => rollDice('d20 sem bônus')}>
          <Dice5 size={20} aria-hidden />
          Rolar d20
        </button>
      </section>

      <section className="dashboard-grid">
        <Panel icon={<UserRound size={18} />} title="Identidade" className="identity-panel">
          <div className="field-grid two">
            <label>
              Jogador
              <input
                value={sheet.identity.playerName}
                onChange={(event) => updateIdentity('playerName', event.target.value)}
                placeholder="Seu nome"
              />
            </label>
            <label>
              Classe
              <span className="select-wrap">
                <select
                  value={sheet.identity.className}
                  onChange={(event) => updateIdentity('className', event.target.value as ClassName)}
                >
                  {Object.keys(CLASS_DATA).map((className) => (
                    <option key={className}>{className}</option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden />
              </span>
            </label>
            <NumberField
              label="Nível"
              value={sheet.identity.level}
              onChange={(value) => updateIdentity('level', value)}
            />
            <NumberField
              label="Proficiência"
              value={sheet.identity.proficiency}
              onChange={(value) => updateIdentity('proficiency', value)}
            />
          </div>
          <div className="class-note">
            <strong>{sheet.identity.className}</strong>
            <span>{classInfo.ability}</span>
          </div>
        </Panel>

        <Panel icon={<Activity size={18} />} title="Atributos">
          <div className="attributes-list">
            {(Object.keys(sheet.attributes) as AttributeKey[]).map((key) => (
              <div className="attribute-row" key={key}>
                <button type="button" onClick={() => rollDice(ATTRIBUTE_LABELS[key], sheet.attributes[key].mod)}>
                  <Dice5 size={15} aria-hidden />
                </button>
                <span>{sheet.attributes[key].label}</span>
                <input
                  aria-label={`${sheet.attributes[key].label} valor`}
                  type="number"
                  value={sheet.attributes[key].value}
                  onChange={(event) => updateAttribute(key, 'value', asNumber(event.target.value))}
                />
                <input
                  aria-label={`${sheet.attributes[key].label} modificador`}
                  type="number"
                  value={sheet.attributes[key].mod}
                  onChange={(event) => updateAttribute(key, 'mod', asNumber(event.target.value))}
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel icon={<HeartPulse size={18} />} title="Combate e vida">
          <div className="stat-grid">
            <NumberField label="Vida atual" value={sheet.combat.currentHp} onChange={(value) => updateCombat('currentHp', value)} />
            <NumberField label="Vida máxima" value={sheet.combat.maxHp} onChange={(value) => updateCombat('maxHp', value)} />
            <NumberField label="CA" value={sheet.combat.armorClass} onChange={(value) => updateCombat('armorClass', value)} />
            <NumberField label="Iniciativa" value={sheet.combat.initiative} onChange={(value) => updateCombat('initiative', value)} />
            <NumberField label="Sanidade" value={sheet.combat.sanity} onChange={(value) => updateCombat('sanity', value)} />
            <NumberField label="Deslocamento" value={sheet.combat.movement} onChange={(value) => updateCombat('movement', value)} />
          </div>
          <div className="quick-rolls">
            <button type="button" onClick={() => rollDice('Iniciativa', sheet.attributes.destreza.mod + sheet.combat.initiative)}>
              <Swords size={16} aria-hidden />
              Iniciativa
            </button>
            <button type="button" onClick={() => rollDice('Sanidade')}>
              <Brain size={16} aria-hidden />
              Sanidade
            </button>
          </div>
        </Panel>

        <Panel icon={<Sparkles size={18} />} title="Última rolagem" className="roll-panel">
          {roll ? (
            <div className="roll-result">
              <span>{roll.label}</span>
              <strong>{roll.total}</strong>
              <small>d20 {roll.d20} {signed(roll.bonus)}</small>
            </div>
          ) : (
            <div className="empty-state">Role um teste para ver o resultado aqui.</div>
          )}
        </Panel>

        <Panel icon={<Check size={18} />} title="Perícias" className="skills-panel">
          <div className="skill-helper">
            <span>{classInfo.picks}: {classInfo.suggested.join(', ')}</span>
            <button type="button" onClick={trainSuggestedSkills}>Marcar sugestões</button>
          </div>
          <div className="skills-list">
            {SKILLS.map((skill) => {
              const trained = sheet.trainedSkills.includes(skill.name)
              const bonus = sheet.attributes[skill.attribute].mod + (trained ? sheet.identity.proficiency : 0)
              return (
                <div className={trained ? 'skill-row trained' : 'skill-row'} key={skill.name}>
                  <label>
                    <input type="checkbox" checked={trained} onChange={() => toggleSkill(skill.name)} />
                    <span>{skill.name}</span>
                  </label>
                  <small>{ATTRIBUTE_LABELS[skill.attribute].slice(0, 3)}</small>
                  <button type="button" onClick={() => rollDice(skill.name, bonus)}>
                    {signed(bonus)}
                  </button>
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel icon={<Wand2 size={18} />} title="Habilidades" className="abilities-panel">
          <div className="text-stack">
            {sheet.customSkills.map((entry, index) => (
              <label key={`skill-${index}`}>
                Habilidade criada {index + 1}
                <textarea value={entry} onChange={(event) => updateTextList('customSkills', index, event.target.value)} />
              </label>
            ))}
            {sheet.passives.map((entry, index) => (
              <label key={`passive-${index}`}>
                Passiva {index + 1}
                <textarea value={entry} onChange={(event) => updateTextList('passives', index, event.target.value)} />
              </label>
            ))}
          </div>
        </Panel>

        <Panel icon={<Archive size={18} />} title="Mochila" className="inventory-panel">
          <div className={overloaded ? 'carry-warning active' : 'carry-warning'}>
            <Shield size={16} aria-hidden />
            {carriedWeight.toFixed(1)} kg / {carryLimit} kg
            {overloaded && <strong> Sobrecarga</strong>}
          </div>
          <div className="items-list">
            {sheet.items.map((item) => (
              <div className="item-row" key={item.id}>
                <input
                  value={item.name}
                  onChange={(event) => updateItem(item.id, 'name', event.target.value)}
                  placeholder="Item"
                />
                <input
                  aria-label="Peso"
                  type="number"
                  step="0.1"
                  value={item.weight}
                  onChange={(event) => updateItem(item.id, 'weight', asNumber(event.target.value))}
                />
                <input
                  aria-label="Quantidade"
                  type="number"
                  value={item.quantity}
                  onChange={(event) => updateItem(item.id, 'quantity', asNumber(event.target.value))}
                />
                <button type="button" className="icon-button small danger" onClick={() => removeItem(item.id)} title="Remover item">
                  <Trash2 size={15} aria-hidden />
                </button>
              </div>
            ))}
          </div>
          <div className="inventory-actions">
            <button type="button" onClick={addItem}>
              <Plus size={16} aria-hidden />
              Item
            </button>
            <NumberField label="Ouro (PO)" value={sheet.gold} onChange={(value) => setSheet((current) => ({ ...current, gold: value }))} />
          </div>
        </Panel>

        <Panel icon={<BookOpen size={18} />} title="Anotações, lore e magias" className="notes-panel">
          <textarea
            className="notes-area"
            value={sheet.notes}
            onChange={(event) => setSheet((current) => ({ ...current, notes: event.target.value }))}
            placeholder="NPCs, símbolos, pistas, magias, promessas perigosas..."
          />
        </Panel>
      </section>
    </main>
  )
}

function Panel({
  title,
  icon,
  className = '',
  children,
}: {
  title: string
  icon: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-header">
        <span>{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="number-field">
      {label}
      <span>
        <button type="button" onClick={() => onChange(value - 1)} aria-label={`Diminuir ${label}`}>
          -
        </button>
        <input type="number" value={value} onChange={(event) => onChange(asNumber(event.target.value))} />
        <button type="button" onClick={() => onChange(value + 1)} aria-label={`Aumentar ${label}`}>
          +
        </button>
      </span>
    </label>
  )
}

export default App
