// Modal de confirmação temático (substitui window.confirm). Controlado via `open`.
// Acessível: role="alertdialog", Escape cancela, clique no fundo cancela, foco
// inicial no botão Cancelar (seguro para ações destrutivas).

import { AlertTriangle } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

type ConfirmDialogProps = {
  open: boolean
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    cancelRef.current?.focus()

    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="dialog-backdrop" onClick={onCancel} role="presentation">
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog__header">
          <span className={tone === 'danger' ? 'dialog__icon is-danger' : 'dialog__icon'}>
            <AlertTriangle size={20} aria-hidden />
          </span>
          <h2 className="dialog__title">{title}</h2>
        </div>

        {description && <p className="dialog__desc">{description}</p>}

        <div className="dialog__actions">
          <button ref={cancelRef} type="button" className="ghost-button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === 'danger' ? 'roll-button danger-button' : 'roll-button'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
