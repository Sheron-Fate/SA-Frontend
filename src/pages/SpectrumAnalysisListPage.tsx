import { type FC, useEffect, useRef, useState } from 'react'
import { Container, Table, Spinner, Alert, Button, Badge } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { BreadCrumbs } from '../components/common/BreadCrumbs/BreadCrumbs'
import { ROUTES, ROUTE_LABELS } from '../Routes'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  fetchAnalysesAsync,
  setStatusFilter,
  setDateFromFilter,
  setDateToFilter,
  resetFilters,
} from '../features/analyses/analysesSlice'
import {
  selectAnalyses,
  selectAnalysesError,
  selectAnalysesLoading,
  selectAnalysesFilters,
} from '../features/analyses/selectors'
import { selectIsAuthenticated, selectIsModerator } from '../features/auth/selectors'
import { completeSpectrumAnalysisAsync } from '../features/spectrumAnalysisDraft/spectrumAnalysisDraftSlice'
import AnalysesFilters from '../components/analyses/AnalysesFilters/AnalysesFilters'
import { formatDateToDisplay } from '../utils/dateFormat'
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
  const filters = useAppSelector(selectAnalysesFilters)

  // Фильтрация по creator_id на фронтенде
  const [creatorIdFilter, setCreatorIdFilter] = useState<string>('')

  // Первоначальная загрузка
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }
    // Для модератора по умолчанию фильтр "created", если статус не задан
    const defaultStatus = isModerator && !filters.status ? 'created' : filters.status
    dispatch(fetchAnalysesAsync({ status: defaultStatus || undefined, dateFrom: filters.dateFrom, dateTo: filters.dateTo }))
  }, [dispatch, isAuthenticated, isModerator])

  // Short Polling - обновление каждые 3 секунды
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    // Очищаем предыдущий интервал
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // Устанавливаем новый интервал для polling
    pollingIntervalRef.current = setInterval(() => {
      const defaultStatus = isModerator && !filters.status ? 'created' : filters.status
      dispatch(fetchAnalysesAsync({ status: defaultStatus || undefined, dateFrom: filters.dateFrom, dateTo: filters.dateTo }))
    }, 3000) // 3 секунды

    // Очистка при размонтировании или изменении зависимостей
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [dispatch, isAuthenticated, isModerator, filters.status, filters.dateFrom, filters.dateTo])

  const handleApplyFilters = () => {
    const defaultStatus = isModerator && !filters.status ? 'created' : filters.status
    dispatch(fetchAnalysesAsync({ status: defaultStatus || undefined, dateFrom: filters.dateFrom, dateTo: filters.dateTo }))
  }

  const handleResetFilters = () => {
    dispatch(resetFilters())
    const defaultStatus = isModerator ? 'created' : undefined
    dispatch(fetchAnalysesAsync({ status: defaultStatus, dateFrom: null, dateTo: null }))
  }

  const handleOpenAnalysis = (analysisId: string | null) => {
    if (!analysisId) return
    navigate(`${ROUTES.APPLICATION}/${analysisId}`)
  }

  const handleCompleteAnalysis = async (analysisId: string) => {
    if (window.confirm('Завершить заявку?')) {
      await dispatch(completeSpectrumAnalysisAsync({ id: analysisId, action: 'complete' }))
      // Обновляем список заявок после завершения
      const defaultStatus = isModerator && !filters.status ? 'created' : filters.status
      dispatch(fetchAnalysesAsync({ status: defaultStatus || undefined, dateFrom: filters.dateFrom, dateTo: filters.dateTo }))
    }
  }

  const handleRejectAnalysis = async (analysisId: string) => {
    if (window.confirm('Отклонить заявку?')) {
      await dispatch(completeSpectrumAnalysisAsync({ id: analysisId, action: 'reject' }))
      // Обновляем список заявок после отклонения
      const defaultStatus = isModerator && !filters.status ? 'created' : filters.status
      dispatch(fetchAnalysesAsync({ status: defaultStatus || undefined, dateFrom: filters.dateFrom, dateTo: filters.dateTo }))
    }
  }

  // Фильтрация по creator_id на фронтенде
  const filteredAnalyses = creatorIdFilter
    ? analyses.filter((a) => a.creator_id.toString().includes(creatorIdFilter))
    : analyses

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

      <AnalysesFilters
        status={filters.status}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        setStatus={(value) => dispatch(setStatusFilter(value))}
        setDateFrom={(value) => dispatch(setDateFromFilter(value))}
        setDateTo={(value) => dispatch(setDateToFilter(value))}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        loading={loading}
      />

      {/* Фильтрация по creator_id на фронтенде (только для модератора) */}
      {isModerator && (
        <div className="mb-3">
          <label htmlFor="creatorIdFilter" className="form-label">
            Фильтр по ID создателя:
          </label>
          <input
            id="creatorIdFilter"
            type="text"
            className="form-control"
            placeholder="Введите ID создателя"
            value={creatorIdFilter}
            onChange={(e) => setCreatorIdFilter(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>
      )}

      {loading ? (
        <div className="spectrum-list-loader">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : filteredAnalyses.length === 0 ? (
        <Alert variant="info">
          {isModerator
            ? creatorIdFilter
              ? 'Нет заявок, соответствующих фильтру.'
              : 'Нет заявок в статусе "Сформирована", закреплённых за вами.'
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
              <th>Обработано пигментов</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredAnalyses.map((analysis) => (
              <tr key={analysis.id}>
                <td>{analysis.name || 'Без названия'}</td>
                <td>{renderStatus(analysis.status)}</td>
                <td>{formatDateToDisplay(analysis.created_at)}</td>
                <td>{analysis.formed_at ? formatDateToDisplay(analysis.formed_at) : '—'}</td>
                {isModerator && <td>{analysis.creator_id}</td>}
                <td>
                  <Badge bg={analysis.processed_pigments_count && analysis.processed_pigments_count > 0 ? 'success' : 'secondary'}>
                    {analysis.processed_pigments_count ?? 0}
                  </Badge>
                </td>
                <td>
                  <div className="d-flex gap-2">
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
                    {/* Кнопки для модератора */}
                    {isModerator && analysis.status === 'created' && (
                      <>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleCompleteAnalysis(analysis.id)}
                        >
                          Завершить
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRejectAnalysis(analysis.id)}
                        >
                          Отклонить
                        </Button>
                      </>
                    )}
                  </div>
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
