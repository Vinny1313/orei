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
  Bold,
  Italic,
  Underline,
  Image as ImageIcon,
  X,
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
    avatarUrl?: string
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
  id: string
  label: string
  d20: number
  bonus: number
  total: number
}

const STORAGE_KEY = 'orei-character-sheet-v2'

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
  Guerreiro: { ability: 'Golpe Destruidor: rola dano 2x e usa qualquer armadura.', picks: 'Escolha 2', suggested: ['Atletismo', 'Intimidação', 'Acrobacia', 'Sobrevivência'] },
  Mago: { ability: 'Chance de usar uma habilidade mais uma vez caso erre.', picks: 'Escolha 2', suggested: ['Investigação', 'História', 'Medicina', 'Religião'] },
  Ladino: { ability: 'Ataque Furtivo: +1d6 se atacar escondido.', picks: 'Furtividade + escolha 2', fixed: ['Furtividade'], suggested: ['Acrobacia', 'Enganação', 'Investigação'] },
  Clérigo: { ability: 'O tentáculo te guiará.', picks: 'Escolha 2', suggested: ['Medicina', 'Religião', 'Persuasão', 'História'] },
  Arqueiro: { ability: 'Ignora algumas coberturas e soma +10 de dano em acertos críticos.', picks: 'Escolha 2', suggested: ['Percepção', 'Furtividade', 'Natureza', 'Sobrevivência'] },
  Bardo: { ability: 'Canção da Bravura: dá +2 no dado de um aliado.', picks: 'Escolha 3', suggested: ['Persuasão', 'Enganação', 'Acrobacia', 'Percepção', 'História'] },
  Necromante: { ability: 'Despertar Ossos: invoca mortos-vivos aliados.', picks: 'Escolha 2', suggested: ['Medicina', 'Religião', 'Intimidação', 'Natureza'] },
  Paladino: { ability: 'Aura Sagrada: +1 CA para aliados próximos.', picks: 'Escolha 2', suggested: ['Atletismo', 'Religião', 'Persuasão', 'Medicina'] },
  Druida: { ability: 'Magia da selva: pode falar com animais.', picks: 'Escolha 2', suggested: ['Natureza', 'Sobrevivência', 'Medicina', 'Percepção'] },
  Monge: { ability: 'Ataca 2x por turno se estiver desarmado. Muito rápido.', picks: 'Escolha 2', suggested: ['Acrobacia', 'Atletismo', 'Percepção', 'Furtividade'] },
}

const createDefaultSheet = (): CharacterSheet => ({
  identity: { characterName: '', playerName: '', className: 'Guerreiro', level: 1, proficiency: 2, avatarUrl: '' },
  attributes: {
    forca: { label: 'Força', value: 10, mod: 0 },
    destreza: { label: 'Destreza', value: 10, mod: 0 },
    constituicao: { label: 'Constituição', value: 10, mod: 0 },
    inteligencia: { label: 'Inteligência', value: 10, mod: 0 },
    sabedoria: { label: 'Sabedoria', value: 10, mod: 0 },
    carisma: { label: 'Carisma', value: 10, mod: 0 },
  },
  combat: { maxHp: 10, currentHp: 10, armorClass: 10, initiative: 0, sanity: 100, movement: 9 },
  trainedSkills: [],
  customSkills: ['', ''],
  passives: ['', ''],
  items: [{ id: crypto.randomUUID(), name: 'Tocha', weight: 1, quantity: 1 }],
  gold: 0,
  notes: '',
})

const asNumber = (value: string) => Number(value) || 0
const signed = (value: number) => (value >= 0 ? `+${value}` : `${value}`)

function RichTextEditor({ initialValue, onChange }: { initialValue: string, onChange: (val: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null)

  const exec = (command: string) => {
    document.execCommand(command, false, undefined)
    editorRef.current?.focus()
  }

  const handleBlur = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  return (
    <div className="rich-text-container">
      <div className="rich-text-toolbar">
        <button type="button" onClick={() => exec('bold')} aria-label="Negrito"><Bold size={16} /></button>
        <button type="button" onClick={() => exec('italic')} aria-label="Itálico"><Italic size={16} /></button>
        <button type="button" onClick={() => exec('underline')} aria-label="Sublinhado"><Underline size={16} /></button>
      </div>
      <div
        ref={editorRef}
        className="rich-text-editor notes-area"
        contentEditable
        onBlur={handleBlur}
        dangerouslySetInnerHTML={{ __html: initialValue || '<i>Escreva suas anotações aqui...</i>' }}
      />
    </div>
  )
}

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  
  const [sheet, setSheet] = useState<CharacterSheet>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return createDefaultSheet()
    try {
      return { ...createDefaultSheet(), ...JSON.parse(saved) }
    } catch {
      return createDefaultSheet()
    }
  })
  
  const [rollHistory, setRollHistory] = useState<RollResult[]>([])
  const [popupRoll, setPopupRoll] = useState<RollResult | null>(null)
  const popupTimeoutRef = useRef<number | null>(null)
  const [savedAt, setSavedAt] = useState('agora')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sheet))
    setSavedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
  }, [sheet])

  const classInfo = CLASS_DATA[sheet.identity.className]
  const carriedWeight = useMemo(() => sheet.items.reduce((t, i) => t + i.weight * i.quantity, 0), [sheet.items])
  const carryLimit = sheet.attributes.forca.value * 5
  const overloaded = carriedWeight > carryLimit

  const updateIdentity = <K extends keyof CharacterSheet['identity']>(key: K, value: CharacterSheet['identity'][K]) => {
    setSheet((current) => ({ ...current, identity: { ...current.identity, [key]: value } }))
  }

  const updateCombat = <K extends keyof CharacterSheet['combat']>(key: K, value: number) => {
    setSheet((current) => ({ ...current, combat: { ...current.combat, [key]: value } }))
  }

  const updateAttribute = (key: AttributeKey, field: 'value' | 'mod', value: number) => {
    setSheet((current) => ({
      ...current,
      attributes: { ...current.attributes, [key]: { ...current.attributes[key], [field]: value } },
    }))
  }

  const toggleSkill = (name: string) => {
    setSheet((current) => ({
      ...current,
      trainedSkills: current.trainedSkills.includes(name)
        ? current.trainedSkills.filter((s) => s !== name)
        : [...current.trainedSkills, name],
    }))
  }

  const trainSuggestedSkills = () => {
    const skills = [...(classInfo.fixed ?? []), ...classInfo.suggested]
    setSheet((c) => ({ ...c, trainedSkills: Array.from(new Set([...c.trainedSkills, ...skills])) }))
  }

  const updateItem = <K extends keyof Item>(id: string, key: K, value: Item[K]) => {
    setSheet((c) => ({
      ...c,
      items: c.items.map((i) => (i.id === id ? { ...i, [key]: value } : i)),
    }))
  }

  const addItem = () => setSheet((c) => ({ ...c, items: [...c.items, { id: crypto.randomUUID(), name: '', weight: 0, quantity: 1 }] }))
  const removeItem = (id: string) => setSheet((c) => ({ ...c, items: c.items.filter((i) => i.id !== id) }))
  
  const updateTextList = (key: 'customSkills' | 'passives', index: number, value: string) => {
    setSheet((c) => ({ ...c, [key]: c[key].map((e, i) => (i === index ? value : e)) }))
  }

  const rollDice = (label: string, bonus = 0) => {
    const d20 = Math.floor(Math.random() * 20) + 1
    const newRoll: RollResult = { id: crypto.randomUUID(), label, d20, bonus, total: d20 + bonus }
    
    // Adiciona ao histórico (limitando a 10)
    setRollHistory(prev => [newRoll, ...prev].slice(0, 10))
    
    // Ativa o Pop-up
    setPopupRoll(newRoll)
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current)
    popupTimeoutRef.current = window.setTimeout(() => {
      setPopupRoll(null)
    }, 25000)
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => updateIdentity('avatarUrl', reader.result as string)
      reader.readAsDataURL(file)
    }
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
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        setSheet({ ...createDefaultSheet(), ...JSON.parse(String(reader.result)) })
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
      setRollHistory([])
    }
  }

  return (
    <>
      <main className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Ficha digital</p>
            <h1>O Rei Mandou</h1>
          </div>
          <div className="toolbar">
            <span className="autosave"><Save size={16} aria-hidden /> Salvo {savedAt}</span>
            <button type="button" className="icon-button" onClick={exportSheet} title="Exportar JSON"><Download size={18} /></button>
            <button type="button" className="icon-button" onClick={() => fileInputRef.current?.click()} title="Importar JSON"><Upload size={18} /></button>
            <button type="button" className="icon-button danger" onClick={resetSheet} title="Resetar ficha"><RotateCcw size={18} /></button>
            <input ref={fileInputRef} className="sr-only" type="file" accept="application/json" onChange={importSheet} />
          </div>
        </header>

        <section className="hero-strip">
          <div className="hero-identity">
            <div className="avatar-container" onClick={() => imageInputRef.current?.click()}>
              {sheet.identity.avatarUrl ? (
                <img src={sheet.identity.avatarUrl} alt="Avatar" className="character-avatar" />
              ) : (
                <div className="avatar-placeholder"><ImageIcon size={32} /></div>
              )}
              <input ref={imageInputRef} type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
            </div>
            
            <div className="hero-name-wrap">
              <p className="eyebrow">Personagem</p>
              <input
                className="hero-name"
                value={sheet.identity.characterName}
                onChange={(e) => updateIdentity('characterName', e.target.value)}
                placeholder="Nome do personagem"
              />
            </div>
          </div>
          <button type="button" className="primary-button" onClick={() => rollDice('d20 sem bônus')}>
            <Dice5 size={20} aria-hidden /> Rolar d20
          </button>
        </section>

        <section className="dashboard-grid">
          {/* 1. Identidade */}
          <Panel icon={<UserRound size={18} />} title="Identidade" className="identity-panel">
            <div className="field-grid two">
              <label>Jogador
                <input value={sheet.identity.playerName} onChange={(e) => updateIdentity('playerName', e.target.value)} placeholder="Seu nome" />
              </label>
              <label>Classe
                <span className="select-wrap">
                  <select value={sheet.identity.className} onChange={(e) => updateIdentity('className', e.target.value as ClassName)}>
                    {Object.keys(CLASS_DATA).map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={16} aria-hidden />
                </span>
              </label>
              <NumberField label="Nível" value={sheet.identity.level} onChange={(v) => updateIdentity('level', v)} />
              <NumberField label="Proficiência" value={sheet.identity.proficiency} onChange={(v) => updateIdentity('proficiency', v)} />
            </div>
            {/* Caixa de Destaque da Classe */}
            <div className="class-note info-box">
              <strong>{sheet.identity.className}</strong>
              <span>{classInfo.ability}</span>
            </div>
          </Panel>

          {/* 2. Lore do Personagem */}
          <Panel icon={<BookOpen size={18} />} title="Lore do Personagem" className="notes-panel">
            <RichTextEditor 
              initialValue={sheet.notes} 
              onChange={(val) => setSheet(c => ({ ...c, notes: val }))} 
            />
          </Panel>

          {/* 3. Combate e Vida */}
          <Panel icon={<HeartPulse size={18} />} title="Combate e vida">
            <div className="stat-grid">
              <NumberField label="Vida atual" value={sheet.combat.currentHp} onChange={(v) => updateCombat('currentHp', v)} />
              <NumberField label="Vida máxima" value={sheet.combat.maxHp} onChange={(v) => updateCombat('maxHp', v)} />
              <NumberField label="CA" value={sheet.combat.armorClass} onChange={(v) => updateCombat('armorClass', v)} />
              <NumberField label="Iniciativa" value={sheet.combat.initiative} onChange={(v) => updateCombat('initiative', v)} />
              <NumberField label="Sanidade" value={sheet.combat.sanity} onChange={(v) => updateCombat('sanity', v)} />
              <NumberField label="Deslocamento" value={sheet.combat.movement} onChange={(v) => updateCombat('movement', v)} />
            </div>
            <div className="quick-rolls">
              <button type="button" className="primary-button small" onClick={() => rollDice('Iniciativa', sheet.attributes.destreza.mod + sheet.combat.initiative)}><Swords size={16} /> Iniciativa</button>
              <button type="button" className="primary-button small" onClick={() => rollDice('Sanidade')}><Brain size={16} /> Sanidade</button>
            </div>
          </Panel>

          {/* 4. Atributos */}
          <Panel icon={<Activity size={18} />} title="Atributos">
            <div className="attributes-list">
              {(Object.keys(sheet.attributes) as AttributeKey[]).map((key) => (
                <div className="attribute-row" key={key}>
                  <button type="button" onClick={() => rollDice(ATTRIBUTE_LABELS[key], sheet.attributes[key].mod)}><Dice5 size={15} /></button>
                  <span>{sheet.attributes[key].label}</span>
                  <input type="number" value={sheet.attributes[key].value} onChange={(e) => updateAttribute(key, 'value', asNumber(e.target.value))} />
                  <input type="number" value={sheet.attributes[key].mod} onChange={(e) => updateAttribute(key, 'mod', asNumber(e.target.value))} />
                </div>
              ))}
            </div>
          </Panel>

          {/* 5. Perícias */}
          <Panel icon={<Check size={18} />} title="Perícias" className="skills-panel">
            {/* Caixa de Destaque das Sugestões */}
            <div className="skill-helper info-box">
              <span>{classInfo.picks}: {classInfo.suggested.join(', ')}</span>
              <button type="button" className="primary-button small" onClick={trainSuggestedSkills}>Marcar sugestões</button>
            </div>
            <div className="skills-list">
              {SKILLS.map((skill) => {
                const trained = sheet.trainedSkills.includes(skill.name)
                const bonus = sheet.attributes[skill.attribute].mod + (trained ? sheet.identity.proficiency : 0)
                return (
                  <div className={`skill-row ${trained ? 'trained' : ''}`} key={skill.name}>
                    <label className="skill-label">
                      <input type="checkbox" checked={trained} onChange={() => toggleSkill(skill.name)} /> 
                      <span className="skill-name">{skill.name}</span>
                    </label>
                    <div className="skill-stats">
                      <span className="skill-attr">{ATTRIBUTE_LABELS[skill.attribute].slice(0, 3)}</span>
                      <button type="button" className="skill-bonus" onClick={() => rollDice(skill.name, bonus)}>{signed(bonus)}</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>

          {/* 6. Habilidades */}
          <Panel icon={<Wand2 size={18} />} title="Habilidades" className="abilities-panel">
            <div className="text-stack">
              {sheet.customSkills.map((entry, index) => (
                <div key={`skill-${index}`} className="ability-editor-wrapper">
                  <label>Habilidade criada {index + 1}</label>
                  <RichTextEditor initialValue={entry} onChange={(val) => updateTextList('customSkills', index, val)} />
                </div>
              ))}
              {sheet.passives.map((entry, index) => (
                <div key={`passive-${index}`} className="ability-editor-wrapper">
                  <label>Passiva {index + 1}</label>
                  <RichTextEditor initialValue={entry} onChange={(val) => updateTextList('passives', index, val)} />
                </div>
              ))}
            </div>
          </Panel>

          {/* 7. Mochila */}
          <Panel 
            icon={<Archive size={18} />} 
            title="Mochila" 
            className="inventory-panel"
            action={
              <button type="button" className="primary-button small" onClick={addItem}>
                <Plus size={16} /> Item
              </button>
            }
          >
            {/* Caixa de Destaque da Carga */}
            <div className={`carry-warning info-box ${overloaded ? 'active' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={16} /> {carriedWeight.toFixed(1)} kg / {carryLimit} kg
              </div>
              {overloaded && <strong style={{ color: 'var(--red)' }}>Sobrecarga</strong>}
            </div>
            <div className="items-list">
              {sheet.items.map((item) => (
                <div className="item-row" key={item.id}>
                  <input value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} placeholder="Item" />
                  <input type="number" step="0.1" value={item.weight} onChange={(e) => updateItem(item.id, 'weight', asNumber(e.target.value))} />
                  <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', asNumber(e.target.value))} />
                  <button type="button" className="icon-button small danger" onClick={() => removeItem(item.id)}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
            <div className="inventory-actions">
              <NumberField label="Ouro (PO)" value={sheet.gold} onChange={(v) => setSheet((c) => ({ ...c, gold: v }))} />
            </div>
          </Panel>

          {/* 8. Últimas Rolagens */}
          <Panel icon={<Sparkles size={18} />} title="Últimas rolagens" className="roll-panel">
            {rollHistory.length > 0 ? (
              <div className="roll-history">
                {rollHistory.map((roll) => (
                  <div className="roll-result" key={roll.id}>
                    <span>{roll.label}</span>
                    <strong>{roll.total}</strong>
                    <small>d20 {roll.d20} {signed(roll.bonus)}</small>
                  </div>
                ))}
              </div>
            ) : <div className="empty-state">Role um teste para ver o resultado.</div>}
          </Panel>

        </section>
      </main>

      {/* Pop-up do Dado */}
      {popupRoll && (
        <div className="dice-popup-overlay" onClick={() => setPopupRoll(null)}>
          <div className="dice-popup-content" onClick={e => e.stopPropagation()}>
            <button className="close-popup" onClick={() => setPopupRoll(null)}><X size={20}/></button>
            <Dice5 size={48} className="popup-icon" />
            <h3>{popupRoll.label}</h3>
            <div className="popup-total">{popupRoll.total}</div>
            <p>Dado: {popupRoll.d20} | Bônus: {signed(popupRoll.bonus)}</p>
          </div>
        </div>
      )}
    </>
  )
}

function Panel({ title, icon, action, className = '', children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-header">
        <div className="panel-title">
          <span>{icon}</span>
          <h2>{title}</h2>
        </div>
        {action && <div className="panel-action">{action}</div>}
      </header>
      {children}
    </section>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="number-field">{label}
      <span>
        <button type="button" onClick={() => onChange(value - 1)}>-</button>
        <input type="number" value={value} onChange={(e) => onChange(asNumber(e.target.value))} />
        <button type="button" onClick={() => onChange(value + 1)}>+</button>
      </span>
    </label>
  )
}

export default App