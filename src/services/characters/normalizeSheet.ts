// Garante que uma ficha lida (de qualquer backend) tenha todos os campos atuais,
// fazendo merge com o padrão. Protege contra fichas antigas/parciais (migração da
// chave v1) e contra colunas JSONB que tenham sido gravadas antes de algum campo existir.

import {
  CLASS_DATA,
  createBlankAbility,
  createBlankPassive,
  createDefaultSheet,
} from '../../data/characterData'
import type {
  AbilityEntry,
  AttributeKey,
  CharacterSheet,
  ClassName,
  Item,
  PassiveEntry,
  RollHistoryEntry,
  RollSource,
} from '../../types/character'

const ATTRIBUTE_KEYS: AttributeKey[] = [
  'forca',
  'destreza',
  'constituicao',
  'inteligencia',
  'sabedoria',
  'carisma',
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const text = (value: unknown): string => (typeof value === 'string' ? value : '')

const numberValue = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const withId = (value: unknown): string => text(value) || crypto.randomUUID()

const normalizeAbility = (entry: unknown, index: number): AbilityEntry => {
  const blank = createBlankAbility()
  if (typeof entry === 'string') {
    return { ...blank, name: entry.trim() ? `Habilidade ${index + 1}` : '', description: entry }
  }
  if (!isRecord(entry)) return blank
  return {
    id: withId(entry.id),
    name: text(entry.name),
    range: text(entry.range),
    area: text(entry.area),
    effect: text(entry.effect),
    description: text(entry.description),
    damageFormula: text(entry.damageFormula),
  }
}

const normalizePassive = (entry: unknown, index: number): PassiveEntry => {
  const blank = createBlankPassive()
  if (typeof entry === 'string') {
    return { ...blank, name: entry.trim() ? `Passiva ${index + 1}` : '', description: entry }
  }
  if (!isRecord(entry)) return blank
  return {
    id: withId(entry.id),
    name: text(entry.name),
    range: text(entry.range),
    area: text(entry.area),
    effect: text(entry.effect),
    description: text(entry.description),
    damageFormula: text(entry.damageFormula),
  }
}

const normalizeHistory = (value: unknown): RollHistoryEntry[] => {
  if (!Array.isArray(value)) return []
  return value
    .filter(isRecord)
    .map((entry) => {
      const source: RollSource =
        entry.source === 'attribute' ||
        entry.source === 'skill' ||
        entry.source === 'initiative' ||
        entry.source === 'damage' ||
        entry.source === 'generic'
          ? entry.source
          : 'generic'
      return {
        id: withId(entry.id),
        createdAt: text(entry.createdAt) || new Date().toISOString(),
        label: text(entry.label),
        formula: text(entry.formula),
        rolls: Array.isArray(entry.rolls)
          ? entry.rolls.map((roll) => numberValue(roll, 0)).filter((roll) => roll > 0)
          : [],
        kept: numberValue(entry.kept, 0),
        bonus: numberValue(entry.bonus, 0),
        total: numberValue(entry.total, 0),
        source,
      }
    })
    .slice(0, 50)
}

const normalizeItems = (value: unknown, fallback: Item[]): Item[] => {
  if (!Array.isArray(value)) return fallback
  const items = value.filter(isRecord).map((item) => ({
    id: withId(item.id),
    name: text(item.name),
    weight: numberValue(item.weight, 0),
    quantity: numberValue(item.quantity, 1),
  }))
  return items.length > 0 ? items : fallback
}

/** Normaliza profundamente fichas antigas/parciais sem exigir migration SQL. */
export const normalizeSheet = (raw: unknown): CharacterSheet => {
  const defaults = createDefaultSheet()
  if (!isRecord(raw)) return defaults

  const identity = isRecord(raw.identity) ? raw.identity : {}
  const combat = isRecord(raw.combat) ? raw.combat : {}
  const attributes = isRecord(raw.attributes) ? raw.attributes : {}

  const normalizedAttributes = { ...defaults.attributes }
  for (const key of ATTRIBUTE_KEYS) {
    const current = isRecord(attributes[key]) ? attributes[key] : {}
    normalizedAttributes[key] = {
      ...defaults.attributes[key],
      label: text(current.label) || defaults.attributes[key].label,
      value: numberValue(current.value, defaults.attributes[key].value),
      mod: numberValue(current.mod, defaults.attributes[key].mod),
    }
  }

  const overrides: CharacterSheet['skillAttributeOverrides'] = {}
  if (isRecord(raw.skillAttributeOverrides)) {
    for (const [skillName, attribute] of Object.entries(raw.skillAttributeOverrides)) {
      if (ATTRIBUTE_KEYS.includes(attribute as AttributeKey)) {
        overrides[skillName] = attribute as AttributeKey
      }
    }
  }

  const legacyCustomSkills = Array.isArray(raw.customSkills) ? raw.customSkills : []
  const abilitySource = Array.isArray(raw.abilities) ? raw.abilities : legacyCustomSkills
  const passiveSource = Array.isArray(raw.passives) ? raw.passives : []

  const abilities = abilitySource.map(normalizeAbility)
  const passives = passiveSource.map(normalizePassive)
  const className = text(identity.className)

  return {
    ...defaults,
    identity: {
      ...defaults.identity,
      characterName: text(identity.characterName),
      playerName: text(identity.playerName),
      className: className in CLASS_DATA ? (className as ClassName) : defaults.identity.className,
      level: numberValue(identity.level, defaults.identity.level),
      proficiency: numberValue(identity.proficiency, defaults.identity.proficiency),
    },
    attributes: normalizedAttributes,
    combat: {
      ...defaults.combat,
      maxHp: numberValue(combat.maxHp, defaults.combat.maxHp),
      currentHp: numberValue(combat.currentHp, defaults.combat.currentHp),
      armorClass: numberValue(combat.armorClass, defaults.combat.armorClass),
      initiative: numberValue(combat.initiative, defaults.combat.initiative),
      sanity: numberValue(combat.sanity, defaults.combat.sanity),
      movement: numberValue(combat.movement, defaults.combat.movement),
    },
    trainedSkills: Array.isArray(raw.trainedSkills) ? raw.trainedSkills.map(text) : [],
    skillAttributeOverrides: overrides,
    abilities: abilities.length > 0 ? abilities : defaults.abilities,
    passives: passives.length > 0 ? passives : defaults.passives,
    items: normalizeItems(raw.items, defaults.items),
    gold: numberValue(raw.gold, defaults.gold),
    notes: text(raw.notes),
    rollHistory: normalizeHistory(raw.rollHistory),
  }
}
