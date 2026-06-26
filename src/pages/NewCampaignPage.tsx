// Criação de campanha (/campanhas/nova): formulário -> cria -> abre o detalhe.

import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CampaignForm } from '../components/campaigns/CampaignForm'
import type { CampaignFormValues } from '../components/campaigns/CampaignForm'
import { createCampaign } from '../services/campaignService'

export function NewCampaignPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<CampaignFormValues>({ name: '', description: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!values.name.trim()) {
      setError('O nome da campanha é obrigatório.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const campaign = await createCampaign({
        name: values.name.trim(),
        description: values.description.trim(),
      })
      navigate(`/campanhas/${campaign.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a campanha.')
      setSubmitting(false)
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
          <h1>Nova campanha</h1>
        </div>
      </header>

      <CampaignForm
        values={values}
        error={error}
        submitting={submitting}
        onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
        onSubmit={() => void handleSubmit()}
        onCancel={() => navigate('/campanhas')}
      />
    </main>
  )
}
