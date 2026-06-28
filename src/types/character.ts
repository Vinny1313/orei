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

export type Item = {
  id: string
  name: string
  weight: number
  quantity: number
}

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
  customSkills: string[]
  passives: string[]
  items: Item[]
  gold: number
  notes: string
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
  createdAt: string
  updatedAt: string
  sheet: CharacterSheet
}

// Resumo leve para o dashboard de agentes (evita carregar a ficha inteira na lista).
export type CharacterSummary = {
  id: string
  characterName: string
  className: ClassName
  level: number
  playerName: string
  currentHp: number
  maxHp: number
  sanity: number
}
