// Dados estáticos da ficha: rótulos de atributos, lista de perícias, dados por classe
// e a fábrica da ficha padrão. Movidos do antigo App.tsx.

import type { AttributeKey, CharacterSheet, ClassName, Skill } from '../types/character'

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  forca: 'Força',
  destreza: 'Destreza',
  constituicao: 'Constituição',
  inteligencia: 'Inteligência',
  sabedoria: 'Sabedoria',
  carisma: 'Carisma',
}

export const SKILLS: Skill[] = [
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

export const CLASS_DATA: Record<
  ClassName,
  { ability: string; picks: string; suggested: string[]; fixed?: string[] }
> = {
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

export const createDefaultSheet = (): CharacterSheet => ({
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
