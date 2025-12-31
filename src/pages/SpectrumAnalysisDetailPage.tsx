import { type FC, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Spinner, Alert, Button, Form } from 'react-bootstrap'
import { BreadCrumbs } from '../components/common/BreadCrumbs/BreadCrumbs'
import { ROUTES, ROUTE_LABELS } from '../Routes'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { selectSpectrumAnalysisDraft } from '../features/spectrumAnalysisDraft/selectors'
import { selectIsModerator } from '../features/auth/selectors'
import {
  getSpectrumAnalysisAsync,
  deleteSpectrumAnalysisAsync,
  updateSpectrumAnalysisAsync,
  formSpectrumAnalysisAsync,
  deletePigmentFromSpectrumAnalysisAsync,
  updatePigmentInSpectrumAnalysisAsync,
  completeSpectrumAnalysisAsync,
} from '../features/spectrumAnalysisDraft/spectrumAnalysisDraftSlice'
import './ApplicationPage.css'
import { MINIO_BASE_URL, USE_PROXY_IMAGES } from '../config/target'

const getPigmentImageSrc = (imageKey?: string) => {
  const fallback = `${import.meta.env.BASE_URL}default-pigment.png`
  const trimmedKey = (imageKey || '').trim()
  if (!trimmedKey) {
    return fallback
  }
  const isAbsolute = /^https?:\/\//i.test(trimmedKey)
  if (isAbsolute) {
    return trimmedKey
  }

  if (USE_PROXY_IMAGES && trimmedKey) {
    return `/api/images/${encodeURIComponent(trimmedKey)}`
  }

  return MINIO_BASE_URL ? `${MINIO_BASE_URL}/${trimmedKey}` : fallback
}

const SpectrumAnalysisDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { spectrumAnalysisData, pigments, loading, error, isDraft } = useAppSelector(selectSpectrumAnalysisDraft)
  const isModerator = useAppSelector(selectIsModerator)

  // Локальное состояние для редактирования
  const [editData, setEditData] = useState({
    name: '',
    spectrum: '',
  })
  const [editingPigments, setEditingPigments] = useState<Record<number, { comment: string; percent: number }>>({})

  useEffect(() => {
    if (id) {
      dispatch(getSpectrumAnalysisAsync(id))
    }
  }, [dispatch, id])

  // Инициализация данных для редактирования
  useEffect(() => {
    if (spectrumAnalysisData) {
      setEditData({
        name: spectrumAnalysisData.name,
        spectrum: spectrumAnalysisData.spectrum || '',
      })
    }
    if (pigments) {
      const initialPigments: Record<number, { comment: string; percent: number }> = {}
      pigments.forEach((pigment) => {
        initialPigments[pigment.pigment_id] = {
          comment: pigment.comment || '',
          percent: pigment.percent || 0,
        }
      })
      setEditingPigments(initialPigments)
    }
  }, [spectrumAnalysisData, pigments])

  if (loading) {
    return (
      <Container className="application-page-loader">
        <Spinner animation="border" />
      </Container>
    )
  }

  if (error || !spectrumAnalysisData) {
    return (
      <Container>
        <BreadCrumbs crumbs={[{ label: ROUTE_LABELS.PIGMENTS, path: ROUTES.PIGMENTS }, { label: 'Спектральный анализ' }]} />
        <Alert variant="danger">{error || 'Спектральный анализ не найден'}</Alert>
      </Container>
    )
  }

  return (
    <Container className="application-page">
      <BreadCrumbs
        crumbs={[
          { label: ROUTE_LABELS.PIGMENTS, path: ROUTES.PIGMENTS },
          { label: spectrumAnalysisData.name || 'Спектральный анализ' },
        ]}
      />

      <div className="application-header">
        {isDraft ? (
          <Form.Control
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            placeholder="Название спектрального анализа"
            className="application-title-input"
          />
        ) : (
          <h2>{spectrumAnalysisData.name}</h2>
        )}
        <div className="application-header-right">
          <span className={`status-badge status-${spectrumAnalysisData.status}`}>
            {spectrumAnalysisData.status === 'draft' && 'Черновик'}
            {spectrumAnalysisData.status === 'created' && 'Создана'}
            {spectrumAnalysisData.status === 'completed' && 'Завершена'}
            {spectrumAnalysisData.status === 'rejected' && 'Отклонена'}
          </span>
          {isDraft && id && (
            <div className="application-actions">
              <Button
                variant="success"
                onClick={async () => {
                  await dispatch(updateSpectrumAnalysisAsync({ id, data: editData }))
                }}
              >
                Сохранить
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  await dispatch(formSpectrumAnalysisAsync(id))
                }}
              >
                Подтвердить заявку
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  if (window.confirm('Вы уверены, что хотите удалить заявку?')) {
                    await dispatch(deleteSpectrumAnalysisAsync(id))
                    navigate(ROUTES.PIGMENTS)
                  }
                }}
              >
                Очистить
              </Button>
            </div>
          )}
          {!isDraft && isModerator && id && spectrumAnalysisData.status === 'created' && (
            <div className="application-actions">
              <Button
                variant="success"
                onClick={async () => {
                  await dispatch(completeSpectrumAnalysisAsync({ id, action: 'complete' }))
                }}
              >
                Завершить
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="application-info">
        {spectrumAnalysisData.created_at && (
          <p>
            <strong>Создана:</strong> {new Date(spectrumAnalysisData.created_at).toLocaleDateString('ru-RU')}
          </p>
        )}
        {spectrumAnalysisData.formed_at && (
          <p>
            <strong>Сформирована:</strong> {new Date(spectrumAnalysisData.formed_at).toLocaleDateString('ru-RU')}
          </p>
        )}
      </div>

      <div className="application-spectrum">
        <h3>Спектральные данные</h3>
        {isDraft ? (
          <Form.Control
            as="textarea"
            rows={3}
            value={editData.spectrum}
            onChange={(e) => setEditData({ ...editData, spectrum: e.target.value })}
            placeholder="Введите спектральные данные"
          />
        ) : (
          spectrumAnalysisData.spectrum ? (
            <p>{spectrumAnalysisData.spectrum}</p>
          ) : (
            <p className="text-muted">Спектральные данные не указаны</p>
          )
        )}
      </div>

      <div className="application-pigments">
        <div className="application-pigments-header">
          <h3>Пигменты в заявке ({pigments.length})</h3>
          {isDraft && id && pigments.length > 0 && (
            <Button
              variant="success"
              onClick={async () => {
                // Сохраняем все изменения в пигментах
                const updates = pigments
                  .filter((pigment) => {
                    const edited = editingPigments[pigment.pigment_id]
                    if (!edited) return false
                    return edited.comment !== (pigment.comment || '') || edited.percent !== (pigment.percent || 0)
                  })
                  .map((pigment) => {
                    const edited = editingPigments[pigment.pigment_id]
                    return {
                      analysisId: id,
                      pigmentId: pigment.pigment_id,
                      comment: edited?.comment || '',
                      percent: edited?.percent || 0,
                    }
                  })

                // Сохраняем все изменения
                for (const update of updates) {
                  await dispatch(updatePigmentInSpectrumAnalysisAsync(update))
                }
              }}
            >
              Сохранить
            </Button>
          )}
        </div>
        {pigments.length === 0 ? (
          <p className="text-muted">В заявке пока нет пигментов</p>
        ) : (
          <div className="pigments-list">
            {pigments.map((pigment) => {
              const imageSrc = getPigmentImageSrc(pigment.image_key)
              const editable = isDraft && Boolean(id)
              return (
                <div key={pigment.pigment_id} className="pigment-item">
                  <div className="pigment-thumb">
                    <img
                      src={imageSrc}
                      alt={pigment.name}
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = `${import.meta.env.BASE_URL}default-pigment.png`
                      }}
                    />
                  </div>
                  <div className="pigment-info">
                    <div className="pigment-header">
                      <h4>{pigment.name}</h4>
                      {editable && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={async () => {
                            if (window.confirm('Удалить пигмент из заявки?')) {
                              await dispatch(deletePigmentFromSpectrumAnalysisAsync({ analysisId: id!, pigmentId: pigment.pigment_id }))
                            }
                          }}
                        >
                          Удалить
                        </Button>
                      )}
                    </div>
                    <p className="pigment-brief">{pigment.brief}</p>
                    {editable ? (
                      <>
                        <Form.Group className="pigment-field">
                          <Form.Label>Комментарий</Form.Label>
                          <Form.Control
                            className="pigment-input editable"
                            type="text"
                            value={editingPigments[pigment.pigment_id]?.comment || ''}
                            onChange={(e) => {
                              setEditingPigments({
                                ...editingPigments,
                                [pigment.pigment_id]: {
                                  ...editingPigments[pigment.pigment_id],
                                  comment: e.target.value,
                                },
                              })
                            }}
                            placeholder="Комментарий"
                          />
                        </Form.Group>
                        <Form.Group className="pigment-field">
                          <Form.Label>Процент</Form.Label>
                          <Form.Control
                            className="pigment-input editable"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={editingPigments[pigment.pigment_id]?.percent ?? 0}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0
                              setEditingPigments({
                                ...editingPigments,
                                [pigment.pigment_id]: {
                                  ...editingPigments[pigment.pigment_id],
                                  percent: value,
                                },
                              })
                            }}
                            placeholder="Процент"
                          />
                        </Form.Group>
                      </>
                    ) : (
                      <>
                        <div className="pigment-field">
                          <Form.Label>Комментарий</Form.Label>
                          <div className="pigment-input readonly">
                            {pigment.comment || 'Не указан'}
                          </div>
                        </div>
                        <div className="pigment-field">
                          <Form.Label>Процент</Form.Label>
                          <div className="pigment-input readonly">
                            {pigment.percent ? `${pigment.percent}%` : '—'}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Container>
  )
}

export default SpectrumAnalysisDetailPage
