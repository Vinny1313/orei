// Detalhe da campanha (/campanhas/:id): dados, membros, personagens e acoes.

import { ArrowLeft, Copy, DoorOpen, Pencil, ScrollText, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CampaignCharacters } from '../components/campaigns/CampaignCharacters'
import { CampaignForm } from '../components/campaigns/CampaignForm'
import type { CampaignFormValues } from '../components/campaigns/CampaignForm'
import { CampaignMembers } from '../components/campaigns/CampaignMembers'
import { CampaignsUnavailable } from '../components/campaigns/CampaignsUnavailable'
import { useAuth } from '../hooks/useAuth'
import { useCampaign } from '../hooks/useCampaigns'
import { useCharacters } from '../hooks/useCharacters'
import {
  campaignsEnabled,
  deleteCampaign,
  leaveCampaign,
  linkCharacter,
  removeMember,
  setCharacterShared,
  unlinkCharacter,
  updateCampaign,
} from '../services/campaignService'
import type { CampaignCharacter, CampaignMember, CampaignStatus } from '../types/campaign'
import { Badge } from '../components/ui/Badge'
import type { BadgeTone } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

const STATUS_LABEL: Record<CampaignStatus, string> = {
  ativa: 'Ativa',
  pausada: 'Pausada',
  encerrada: 'Encerrada',
}

const STATUS_TONE: Record<CampaignStatus, BadgeTone> = {
  ativa: 'success',
  pausada: 'warning',
  encerrada: 'danger',
}

type PendingConfirm = {
  title: string
  description?: string
  confirmLabel?: string
  tone?: 'default' | 'danger'
  action: () => void
}

export function CampaignDetailPage() {
  if (!campaignsEnabled) {
    return <CampaignsUnavailable showBackLink />
  }

  return <CampaignDetailPageContent />
}

function CampaignDetailPageContent() {
  const { routeKey } = useParams<{ routeKey: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { campaign, members, characters, loading, error, reload } = useCampaign(routeKey)
  const {
    characters: myCharacters,
    loading: loadingMyCharacters,
    error: myCharactersError,
  } = useCharacters()

  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState<CampaignFormValues>({ name: '', description: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)

  if (loading) {
    return (
      <main className="page">
        <div className="empty-state large">Carregando a campanha...</div>
      </main>
    )
  }

  if (error || !campaign) {
    return (
      <main className="page">
        <div className="empty-state large">
          <p>{error ?? 'Campanha não encontrada.'}</p>
          <Link to="/campanhas" className="roll-button">
            <ArrowLeft size={18} aria-hidden />
            Voltar às campanhas
          </Link>
        </div>
      </main>
    )
  }

  const isMaster = campaign.role === 'MASTER'
  const closed = campaign.status === 'encerrada'
  const linkedIds = new Set(characters.map((character) => character.characterId))
  const linkableCharacters = myCharacters.filter((character) => !linkedIds.has(character.id))

  const runAction = async (fn: () => Promise<unknown>, after?: () => void) => {
    if (actionBusy) return
    setActionBusy(true)
    setActionError(null)
    try {
      await fn()
      if (after) {
        after()
      } else {
        await reload()
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'A ação falhou.')
    } finally {
      setActionBusy(false)
    }
  }

  const startEdit = () => {
    setEditValues({ name: campaign.name, description: campaign.description })
    setEditError(null)
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!editValues.name.trim()) {
      setEditError('O nome é obrigatório.')
      return
    }
    setSavingEdit(true)
    setEditError(null)
    try {
      await updateCampaign(campaign.id, {
        name: editValues.name.trim(),
        description: editValues.description.trim(),
      })
      setEditing(false)
      await reload()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleCopyCode = () => {
    void navigator.clipboard?.writeText(campaign.inviteCode)
    toast.success('Código de convite copiado.')
  }

  const handleLink = () => {
    if (!selectedCharacter) {
      return
    }
    void runAction(
      () => linkCharacter(campaign.id, selectedCharacter),
      () => {
        setSelectedCharacter('')
        void reload()
      },
    )
  }

  const handleUnlink = (link: CampaignCharacter) => {
    void runAction(() => unlinkCharacter(link.id))
  }

  const handleToggleShare = (link: CampaignCharacter, shared: boolean) => {
    void runAction(() => setCharacterShared(link.id, shared))
  }

  const handleRemoveMember = (member: CampaignMember) => {
    const label = member.displayName || member.username || 'este jogador'
    setPendingConfirm({
      title: 'Remover jogador?',
      description: `${label} será removido da campanha.`,
      confirmLabel: 'Remover',
      tone: 'danger',
      action: () => void runAction(() => removeMember(campaign.id, member.userId)),
    })
  }

  const handleLeave = () => {
    setPendingConfirm({
      title: 'Sair da campanha?',
      description: 'Você deixará de participar desta campanha.',
      confirmLabel: 'Sair',
      tone: 'danger',
      action: () => void runAction(() => leaveCampaign(campaign.id), () => navigate('/campanhas')),
    })
  }

  const handleClose = () => {
    setPendingConfirm({
      title: 'Encerrar campanha?',
      description: 'Ela ficará marcada como encerrada.',
      confirmLabel: 'Encerrar',
      action: () => void runAction(() => updateCampaign(campaign.id, { status: 'encerrada' })),
    })
  }

  const handleDelete = () => {
    setPendingConfirm({
      title: 'Excluir campanha?',
      description: 'A campanha será removida permanentemente. Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      tone: 'danger',
      action: () => void runAction(() => deleteCampaign(campaign.id), () => navigate('/campanhas')),
    })
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <Link to="/campanhas" className="back-link">
            <ArrowLeft size={16} aria-hidden />
            Voltar às campanhas
          </Link>
          <h1>{campaign.name}</h1>
        </div>
        <Badge tone={STATUS_TONE[campaign.status]}>{STATUS_LABEL[campaign.status]}</Badge>
      </header>

      {actionError && <p className="form-error">{actionError}</p>}

      {editing ? (
        <CampaignForm
          values={editValues}
          error={editError}
          submitting={savingEdit}
          submitLabel="Salvar alteracoes"
          onChange={(key, value) => setEditValues((current) => ({ ...current, [key]: value }))}
          onSubmit={() => void saveEdit()}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <section className="panel campaign-detail">
          {campaign.description ? (
            <p>{campaign.description}</p>
          ) : (
            <p className="muted-note">Sem descrição.</p>
          )}

          {isMaster && (
            <div className="invite-box">
              <span>Código de convite</span>
              <code>{campaign.inviteCode}</code>
              <button type="button" className="icon-button small" title="Copiar código" onClick={handleCopyCode}>
                <Copy size={15} aria-hidden />
              </button>
            </div>
          )}

          <div className="form-actions">
            {isMaster ? (
              <>
                <button type="button" className="ghost-button" onClick={startEdit} disabled={actionBusy}>
                  <Pencil size={15} aria-hidden />
                  Editar
                </button>
                {!closed && (
                  <button type="button" className="ghost-button" onClick={handleClose} disabled={actionBusy}>
                    Encerrar
                  </button>
                )}
                <button type="button" className="ghost-button danger" onClick={handleDelete} disabled={actionBusy}>
                  <Trash2 size={15} aria-hidden />
                  Excluir
                </button>
              </>
            ) : (
              <button type="button" className="ghost-button danger" onClick={handleLeave} disabled={actionBusy}>
                <DoorOpen size={15} aria-hidden />
                Sair da campanha
              </button>
            )}
          </div>
        </section>
      )}

      <section className="panel">
        <header className="panel-header">
          <Users size={18} aria-hidden />
          <h2>Jogadores</h2>
        </header>
        <CampaignMembers
          members={members}
          isMaster={isMaster}
          currentUserId={user?.id}
          disabled={actionBusy}
          onRemove={handleRemoveMember}
        />
      </section>

      <section className="panel">
        <header className="panel-header">
          <ScrollText size={18} aria-hidden />
          <h2>Personagens vinculados</h2>
        </header>
        <CampaignCharacters
          characters={characters}
          isMaster={isMaster}
          currentUserId={user?.id}
          campaignRouteKey={campaign.routeKey}
          disabled={actionBusy}
          onUnlink={handleUnlink}
          onToggleShare={handleToggleShare}
        />
        {!closed && (
          <div className="link-character">
            <span className="select-wrap">
              <select
                value={selectedCharacter}
                onChange={(event) => setSelectedCharacter(event.target.value)}
                disabled={loadingMyCharacters || !!myCharactersError || actionBusy}
              >
                <option value="">
                  {loadingMyCharacters
                    ? 'Carregando personagens...'
                    : myCharactersError
                      ? 'Não foi possível carregar personagens'
                      : 'Vincular meu personagem...'}
                </option>
                {linkableCharacters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.sheet.identity.characterName.trim() || 'Personagem sem nome'}
                  </option>
                ))}
              </select>
            </span>
            <button
              type="button"
              className="ghost-button"
              onClick={handleLink}
              disabled={!selectedCharacter || loadingMyCharacters || !!myCharactersError || actionBusy}
            >
              Vincular
            </button>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={pendingConfirm !== null}
        title={pendingConfirm?.title ?? ''}
        description={pendingConfirm?.description}
        confirmLabel={pendingConfirm?.confirmLabel}
        tone={pendingConfirm?.tone}
        onConfirm={() => {
          pendingConfirm?.action()
          setPendingConfirm(null)
        }}
        onCancel={() => setPendingConfirm(null)}
      />
    </main>
  )
}
