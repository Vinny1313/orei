// Painel da Mochila: itens (nome/peso/quantidade), aviso de sobrecarga e ouro.

import { useMemo } from 'react'
import { Archive, Plus, Shield, Trash2 } from 'lucide-react'
import type { CharacterSheet, Item } from '../../../types/character'
import { asNumber } from '../../../utils/formatters'
import { NumberField } from '../../ui/NumberField'
import { Panel } from '../../ui/Panel'

type InventorySectionProps = {
  sheet: CharacterSheet
  updateItem: <K extends keyof Item>(id: string, key: K, value: Item[K]) => void
  addItem: () => void
  removeItem: (id: string) => void
  setGold: (value: number) => void
}

export function InventorySection({
  sheet,
  updateItem,
  addItem,
  removeItem,
  setGold,
}: InventorySectionProps) {
  const carriedWeight = useMemo(
    () => sheet.items.reduce((total, item) => total + item.weight * item.quantity, 0),
    [sheet.items],
  )
  const carryLimit = sheet.attributes.forca.value * 5
  const overloaded = carriedWeight > carryLimit

  return (
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
            <button
              type="button"
              className="icon-button small danger"
              onClick={() => removeItem(item.id)}
              title="Remover item"
            >
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
        <NumberField label="Ouro (PO)" value={sheet.gold} onChange={setGold} />
      </div>
    </Panel>
  )
}
