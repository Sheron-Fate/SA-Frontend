import { type FC, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Spinner, Alert, Button, Form } from 'react-bootstrap'
import { BreadCrumbs } from '../components/common/BreadCrumbs/BreadCrumbs'
import { ROUTES, ROUTE_LABELS } from '../Routes'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { selectApplicationDraft } from '../features/applicationDraft/selectors'
import { selectIsModerator } from '../features/auth/selectors'
import {
  getApplicationAsync,
  deleteApplicationAsync,
  updateApplicationAsync,
  formApplicationAsync,
  deletePigmentFromApplicationAsync,
  updatePigmentInApplicationAsync,
  completeApplicationAsync,
} from '../features/applicationDraft/applicationDraftSlice'
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

const ApplicationPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { applicationData, pigments, loading, error, isDraft } = useAppSelector(selectApplicationDraft)
  const isModerator = useAppSelector(selectIsModerator)

  // Локальное состояние для редактирования
  const [editData, setEditData] = useState({
    name: '',
    spectrum: '',
  })
  const [editingPigments, setEditingPigments] = useState<Record<number, { comment: string; percent: number }>>({})

  useEffect(() => {
    if (id) {
      dispatch(getApplicationAsync(id))
    }
  }, [dispatch, id])

  // Инициализация данных для редактирования
  useEffect(() => {
    if (applicationData) {
      setEditData({
        name: applicationData.name,
        spectrum: applicationData.spectrum || '',
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
  }, [applicationData, pigments])

  if (loading) {
    return (
      <Container className="application-page-loader">
        <Spinner animation="border" />
      </Container>
    )
  }

  if (error || !applicationData) {
    return (
      <Container>
        <BreadCrumbs crumbs={[{ label: ROUTE_LABELS.PIGMENTS, path: ROUTES.PIGMENTS }, { label: 'Заявка' }]} />
        <Alert variant="danger">{error || 'Заявка не найдена'}</Alert>
      </Container>
    )
  }

  return (
    <Container className="application-page">
      <BreadCrumbs
        crumbs={[
          { label: ROUTE_LABELS.PIGMENTS, path: ROUTES.PIGMENTS },
          { label: applicationData.name || 'Заявка' },
        ]}
      />

      <div className="application-header">
        {isDraft ? (
          <Form.Control
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            placeholder="Название заявки"
            className="application-title-input"
          />
        ) : (
          <h2>{applicationData.name}</h2>
        )}
        <div className="application-header-right">
          <span className={`status-badge status-${applicationData.status}`}>
            {applicationData.status === 'draft' && 'Черновик'}
            {applicationData.status === 'created' && 'Создана'}
            {applicationData.status === 'completed' && 'Завершена'}
            {applicationData.status === 'rejected' && 'Отклонена'}
          </span>
          {isDraft && id && (
            <div className="application-actions">
              <Button
                variant="success"
                onClick={async () => {
                  await dispatch(updateApplicationAsync({ id, data: editData }))
                }}
              >
                Сохранить
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  await dispatch(formApplicationAsync(id))
                }}
              >
                Подтвердить заявку
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  if (window.confirm('Вы уверены, что хотите удалить заявку?')) {
                    await dispatch(deleteApplicationAsync(id))
                    navigate(ROUTES.PIGMENTS)
                  }
                }}
              >
                Очистить
              </Button>
            </div>
          )}
          {!isDraft && isModerator && id && applicationData.status === 'created' && (
            <div className="application-actions">
              <Button
                variant="success"
                onClick={async () => {
                  await dispatch(completeApplicationAsync({ id, action: 'complete' }))
                }}
              >
                Завершить
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="application-info">
        {applicationData.created_at && (
          <p>
            <strong>Создана:</strong> {new Date(applicationData.created_at).toLocaleDateString('ru-RU')}
          </p>
        )}
        {applicationData.formed_at && (
          <p>
            <strong>Сформирована:</strong> {new Date(applicationData.formed_at).toLocaleDateString('ru-RU')}
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
          applicationData.spectrum ? (
            <p>{applicationData.spectrum}</p>
          ) : (
            <p className="text-muted">Спектральные данные не указаны</p>
          )
        )}
      </div>

      <div className="application-pigments">
        <h3>Пигменты в заявке ({pigments.length})</h3>
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
                              await dispatch(deletePigmentFromApplicationAsync({ analysisId: id!, pigmentId: pigment.pigment_id }))
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
                            onBlur={async () => {
                              const current = editingPigments[pigment.pigment_id]
                              if (current && (current.comment !== pigment.comment || current.percent !== pigment.percent)) {
                                await dispatch(
                                  updatePigmentInApplicationAsync({
                                    analysisId: id!,
                                    pigmentId: pigment.pigment_id,
                                    comment: current.comment,
                                    percent: current.percent,
                                  })
                                )
                              }
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
                            onBlur={async () => {
                              const current = editingPigments[pigment.pigment_id]
                              if (current && (current.comment !== pigment.comment || current.percent !== pigment.percent)) {
                                await dispatch(
                                  updatePigmentInApplicationAsync({
                                    analysisId: id!,
                                    pigmentId: pigment.pigment_id,
                                    comment: current.comment,
                                    percent: current.percent,
                                  })
                                )
                              }
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

export default ApplicationPage
