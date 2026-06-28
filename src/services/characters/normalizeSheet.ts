// Garante que uma ficha lida (de qualquer backend) tenha todos os campos atuais,
// fazendo merge com o padrão. Protege contra fichas antigas/parciais (migração da
// chave v1) e contra colunas JSONB que tenham sido gravadas antes de algum campo existir.

import { createDefaultSheet } from '../../data/characterData'
import type { CharacterSheet } from '../../types/character'

export const normalizeSheet = (raw: unknown): CharacterSheet => ({
  ...createDefaultSheet(),
  ...(raw as Partial<CharacterSheet>),
})
