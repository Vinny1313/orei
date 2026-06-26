// Lista de membros de uma campanha. O mestre pode remover jogadores.

import { Crown, Swords, UserMinus } from 'lucide-react'
import type { CampaignMember } from '../../types/campaign'

type CampaignMembersProps = {
  members: CampaignMember[]
  isMaster: boolean
  currentUserId?: string
  onRemove: (member: CampaignMember) => void
}

const memberLabel = (m: CampaignMember): string =>
  m.displayName?.trim() || m.username?.trim() || m.email?.trim() || 'Jogador'

export function CampaignMembers({
  members,
  isMaster,
  currentUserId,
  onRemove,
}: CampaignMembersProps) {
  if (members.length === 0) {
    return <p className="muted-note">Nenhum membro ainda.</p>
  }

  return (
    <ul className="member-list">
      {members.map((member) => {
        const master = member.role === 'MASTER'
        return (
          <li key={member.id} className="member-row">
            <span className="member-role" title={master ? 'Mestre' : 'Jogador'}>
              {master ? <Crown size={16} aria-hidden /> : <Swords size={16} aria-hidden />}
            </span>
            <span className="member-name">
              {memberLabel(member)}
              {member.userId === currentUserId && <small> (você)</small>}
            </span>
            <span className={`member-tag ${master ? 'is-master' : ''}`}>
              {master ? 'Mestre' : 'Jogador'}
            </span>
            {isMaster && !master && (
              <button
                type="button"
                className="icon-button small danger"
                title="Remover jogador"
                onClick={() => onRemove(member)}
              >
                <UserMinus size={15} aria-hidden />
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
