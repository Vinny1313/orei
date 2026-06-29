// Tipos de domínio da ficha de personagem de "O Rei Mandou".
// Movidos do antigo App.tsx para serem compartilhados entre service, hooks e UI.

export type AttributeKey =
  | 'forca'
  | 'destreza'
  | 'constituicao'
  | 'inteligencia'
  | 'sabedoria'
  | 'carisma'

export type ClassName =
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

export type Attribute = {
  label: string
  value: number
  mod: number
}

export type Skill = {
  name: string
  attribute: AttributeKey
}

export type DiceFormula = string

export type RollSource = 'attribute' | 'skill' | 'initiative' | 'damage' | 'generic'

export type RollHistoryEntry = {
  id: string
  createdAt: string
  label: string
  formula: DiceFormula
  rolls: number[]
  kept: number
  bonus: number
  total: number
  source: RollSource
}

export type AbilityEntry = {
  id: string
  name: string
  range: string
  area: string
  effect: string
  description: string
  damageFormula: DiceFormula
}

export type PassiveEntry = Partial<Omit<AbilityEntry, 'id'>> & {
  id: string
}

export type Item = {
  id: string
  name: string
  weight: number
  quantity: number
}

export type SheetTab = 'principal' | 'pericias' | 'habilidades' | 'mochila'

export type CharacterSheet = {
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
  skillAttributeOverrides: Record<string, AttributeKey>
  abilities: AbilityEntry[]
  passives: PassiveEntry[]
  items: Item[]
  gold: number
  notes: string
  rollHistory: RollHistoryEntry[]
}

export type RollResult = {
  label: string
  d20: number
  bonus: number
  total: number
}

// Envelope persistido: a ficha + metadados de versionamento/identidade.
export type Character = {
  id: string
  routeKey: string
  createdAt: string
  updatedAt: string
  sheet: CharacterSheet
}

// Resumo leve para o dashboard de agentes (evita carregar a ficha inteira na lista).
export type CharacterSummary = {
  id: string
  routeKey: string
  characterName: string
  className: ClassName
  level: number
  playerName: string
  currentHp: number
  maxHp: number
  sanity: number
}
