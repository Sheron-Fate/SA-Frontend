import { type FC, useEffect } from 'react'
import { Container, Table, Spinner, Alert, Button, Badge } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { BreadCrumbs } from '../components/common/BreadCrumbs/BreadCrumbs'
import { ROUTES, ROUTE_LABELS } from '../Routes'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchAnalysesAsync } from '../features/analyses/analysesSlice'
import { selectAnalyses, selectAnalysesError, selectAnalysesLoading } from '../features/analyses/selectors'
import { selectApplicationDraft } from '../features/applicationDraft/selectors'
import { selectIsAuthenticated, selectIsModerator } from '../features/auth/selectors'
import { getCartInfoAsync } from '../features/applicationDraft/applicationDraftSlice'
import './SpectrumAnalysisListPage.css'

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  created: 'Сформирована',
  completed: 'Завершена',
  rejected: 'Отклонена',
}

const statusVariant: Record<string, string> = {
  draft: 'secondary',
  created: 'warning',
  completed: 'success',
  rejected: 'danger',
}

const SpectrumAnalysisListPage: FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isModerator = useAppSelector(selectIsModerator)
  const analyses = useAppSelector(selectAnalyses)
  const loading = useAppSelector(selectAnalysesLoading)
  const error = useAppSelector(selectAnalysesError)
  const { analysis_id, has_active_cart, applicationData, isDraft, loading: draftLoading } =
    useAppSelector(selectApplicationDraft)

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }
    const statusFilter = isModerator ? { status: 'created' } : undefined
    dispatch(fetchAnalysesAsync(statusFilter))
    dispatch(getCartInfoAsync())
  }, [dispatch, isAuthenticated, isModerator])

  const handleOpenAnalysis = (analysisId: string | null) => {
    if (!analysisId) return
    navigate(`${ROUTES.APPLICATION}/${analysisId}`)
  }

  const renderStatus = (status: string) => (
    <Badge bg={statusVariant[status] || 'secondary'}>{statusLabels[status] || status}</Badge>
  )

  if (!isAuthenticated) {
    return (
      <Container className="spectrum-list">
        <BreadCrumbs crumbs={[{ label: ROUTE_LABELS.SPECTRUM }]} />
        <Alert variant="warning">Для просмотра заявок необходимо авторизоваться.</Alert>
      </Container>
    )
  }

  return (
    <Container className="spectrum-list">
      <BreadCrumbs crumbs={[{ label: ROUTE_LABELS.SPECTRUM }]} />

      {!isModerator && has_active_cart && analysis_id && (
        <div className="draft-card">
          <div>
            <p className="draft-label">Активный черновик</p>
            <h3>{applicationData?.name || 'Черновик заявки'}</h3>
            <p className="draft-description">
              {isDraft
                ? 'Можно продолжить редактирование и добавить новые пигменты.'
                : 'Черновик найден, но заявка уже сформирована.'}
            </p>
          </div>
          <div>
            <Button variant="primary" disabled={draftLoading} onClick={() => handleOpenAnalysis(analysis_id)}>
              Продолжить
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="spectrum-list-loader">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : analyses.length === 0 ? (
        <Alert variant="info">
          {isModerator
            ? 'Нет заявок в статусе "Сформирована", закреплённых за вами.'
            : 'У вас пока нет подтверждённых заявок.'}
        </Alert>
      ) : (
        <Table striped hover responsive className="analyses-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Статус</th>
              <th>Создана</th>
              <th>Сформирована</th>
              {isModerator && <th>Автор</th>}
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {analyses.map((analysis) => (
              <tr key={analysis.id}>
                <td>{analysis.name || 'Без названия'}</td>
                <td>{renderStatus(analysis.status)}</td>
                <td>{new Date(analysis.created_at).toLocaleDateString('ru-RU')}</td>
                <td>
                  {analysis.formed_at
                    ? new Date(analysis.formed_at).toLocaleDateString('ru-RU')
                    : '—'}
                </td>
                {isModerator && <td>{analysis.creator_id}</td>}
                <td>
                  <Button
                    size="sm"
                    variant={analysis.status === 'draft' ? 'primary' : 'outline-primary'}
                    onClick={() => handleOpenAnalysis(analysis.id)}
                  >
                    {analysis.status === 'draft'
                      ? 'Продолжить'
                      : isModerator
                        ? 'Открыть'
                        : 'Просмотр'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  )
}

export default SpectrumAnalysisListPage
