// Detalhe da campanha (/campanhas/:id): dados, jogadores, personagens vinculados,
// convite (só mestre), vincular personagem próprio, sair, e controles do mestre.

import { ArrowLeft, Copy, DoorOpen, Pencil, ScrollText, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CampaignCharacters } from '../components/campaigns/CampaignCharacters'
import { CampaignForm } from '../components/campaigns/CampaignForm'
import type { CampaignFormValues } from '../components/campaigns/CampaignForm'
import { CampaignMembers } from '../components/campaigns/CampaignMembers'
import { useAuth } from '../hooks/useAuth'
import { useCampaign } from '../hooks/useCampaigns'
import { useCharacters } from '../hooks/useCharacters'
import {
  deleteCampaign,
  leaveCampaign,
  linkCharacter,
  removeMember,
  unlinkCharacter,
  updateCampaign,
} from '../services/campaignService'
import type { CampaignCharacter, CampaignMember, CampaignStatus } from '../types/campaign'

const STATUS_LABEL: Record<CampaignStatus, string> = {
  ativa: 'Ativa',
  pausada: 'Pausada',
  encerrada: 'Encerrada',
}

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { campaign, members, characters, loading, error, reload } = useCampaign(id)
  const { characters: myCharacters } = useCharacters()

  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState<CampaignFormValues>({ name: '', description: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  if (loading) {
    return (
      <main className="page">
        <div className="empty-state large">Carregando a campanha…</div>
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

  const handleRemoveMember = (member: CampaignMember) => {
    const label = member.displayName || member.username || 'este jogador'
    if (window.confirm(`Remover ${label} da campanha?`)) {
      void runAction(() => removeMember(campaign.id, member.userId))
    }
  }

  const handleLeave = () => {
    if (window.confirm('Sair desta campanha?')) {
      void runAction(() => leaveCampaign(campaign.id), () => navigate('/campanhas'))
    }
  }

  const handleClose = () => {
    if (window.confirm('Encerrar a campanha? Ela ficará marcada como encerrada.')) {
      void runAction(() => updateCampaign(campaign.id, { status: 'encerrada' }))
    }
  }

  const handleDelete = () => {
    if (window.confirm('Excluir a campanha permanentemente? Esta ação não pode ser desfeita.')) {
      void runAction(() => deleteCampaign(campaign.id), () => navigate('/campanhas'))
    }
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
        <span className={`status-badge status-${campaign.status}`}>{STATUS_LABEL[campaign.status]}</span>
      </header>

      {actionError && <p className="form-error">{actionError}</p>}

      {editing ? (
        <CampaignForm
          values={editValues}
          error={editError}
          submitting={savingEdit}
          submitLabel="Salvar alterações"
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
                <button type="button" className="ghost-button" onClick={startEdit}>
                  <Pencil size={15} aria-hidden />
                  Editar
                </button>
                {!closed && (
                  <button type="button" className="ghost-button" onClick={handleClose}>
                    Encerrar
                  </button>
                )}
                <button type="button" className="ghost-button danger" onClick={handleDelete}>
                  <Trash2 size={15} aria-hidden />
                  Excluir
                </button>
              </>
            ) : (
              <button type="button" className="ghost-button danger" onClick={handleLeave}>
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
          onUnlink={handleUnlink}
        />
        {!closed && (
          <div className="link-character">
            <span className="select-wrap">
              <select value={selectedCharacter} onChange={(event) => setSelectedCharacter(event.target.value)}>
                <option value="">Vincular meu personagem…</option>
                {linkableCharacters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.sheet.identity.characterName.trim() || 'Personagem sem nome'}
                  </option>
                ))}
              </select>
            </span>
            <button type="button" className="ghost-button" onClick={handleLink} disabled={!selectedCharacter}>
              Vincular
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
