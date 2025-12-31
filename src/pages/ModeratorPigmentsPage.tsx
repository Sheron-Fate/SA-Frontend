import { type FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Table, Modal, Form, Alert, Spinner, Container } from 'react-bootstrap'
import { BreadCrumbs } from '../components/common/BreadCrumbs/BreadCrumbs'
import { ROUTES } from '../Routes'
import { getPigments, createPigment, updatePigment, deletePigment } from '../services/pigmentsApi'
import type { Pigment, CreatePigmentRequest, UpdatePigmentRequest } from '../types/pigment'
import { useAppSelector } from '../store/hooks'
import { selectIsModerator } from '../features/auth/selectors'
import './ModeratorPigmentsPage.css'

interface PigmentFormData {
  name: string
  brief: string
  description: string
  color: string
  specs: string
  spectrum: string
}

const initialFormData: PigmentFormData = {
  name: '',
  brief: '',
  description: '',
  color: '',
  specs: '',
  spectrum: '',
}

export const ModeratorPigmentsPage: FC = () => {
  const navigate = useNavigate()
  const isModerator = useAppSelector(selectIsModerator)
  const [pigments, setPigments] = useState<Pigment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingPigment, setEditingPigment] = useState<Pigment | null>(null)
  const [formData, setFormData] = useState<PigmentFormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  useEffect(() => {
    if (!isModerator) {
      navigate(ROUTES.FORBIDDEN)
      return
    }
    loadPigments()
  }, [isModerator, navigate])

  const loadPigments = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getPigments({})
      setPigments(result.pigments)
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки пигментов')
    } finally {
      setLoading(false)
    }
  }

  const handleShowModal = (pigment?: Pigment) => {
    if (pigment) {
      setEditingPigment(pigment)
      setFormData({
        name: pigment.name || '',
        brief: pigment.brief || '',
        description: pigment.description || '',
        color: pigment.color || '',
        specs: pigment.specs || '',
        spectrum: pigment.spectrum || '',
      })
    } else {
      setEditingPigment(null)
      setFormData(initialFormData)
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPigment(null)
    setFormData(initialFormData)
    setError(null)
  }

  const handleInputChange = (field: keyof PigmentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (editingPigment) {
        // Обновление
        const updateData: UpdatePigmentRequest = {
          name: formData.name || undefined,
          brief: formData.brief || undefined,
          description: formData.description || undefined,
          color: formData.color || undefined,
          specs: formData.specs || undefined,
          spectrum: formData.spectrum || undefined,
        }
        await updatePigment(editingPigment.id, updateData)
      } else {
        // Создание
        const createData: CreatePigmentRequest = {
          name: formData.name,
          brief: formData.brief,
          description: formData.description || undefined,
          color: formData.color || undefined,
          specs: formData.specs || undefined,
          spectrum: formData.spectrum || undefined,
        }
        await createPigment(createData)
      }

      handleCloseModal()
      await loadPigments()
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении пигмента')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      setError(null)
      await deletePigment(id)
      setDeleteConfirm(null)
      await loadPigments()
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении пигмента')
      setDeleteConfirm(null)
    }
  }

  if (!isModerator) {
    return null
  }

  return (
    <Container className="moderator-pigments-page">
      <BreadCrumbs crumbs={[{ label: 'Управление пигментами' }]} />

      <div className="page-header">
        <h1>Управление пигментами</h1>
        <Button variant="primary" onClick={() => handleShowModal()}>
          Добавить пигмент
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="loading-container">
          <Spinner animation="border" />
        </div>
      ) : (
        <div className="table-container">
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Краткое описание</th>
                <th>Цвет</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {pigments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center">
                    Пигменты не найдены
                  </td>
                </tr>
              ) : (
                pigments.map((pigment) => (
                  <tr key={pigment.id}>
                    <td>{pigment.id}</td>
                    <td>{pigment.name}</td>
                    <td>{pigment.brief}</td>
                    <td>{pigment.color || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleShowModal(pigment)}
                        >
                          Редактировать
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => setDeleteConfirm(pigment.id)}
                        >
                          Удалить
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* Модальное окно для создания/редактирования */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingPigment ? 'Редактировать пигмент' : 'Добавить пигмент'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>
                Название <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Краткое описание <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.brief}
                onChange={(e) => handleInputChange('brief', e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Описание</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Цвет</Form.Label>
              <Form.Control
                type="text"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Характеристики</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.specs}
                onChange={(e) => handleInputChange('specs', e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Спектр</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.spectrum}
                onChange={(e) => handleInputChange('spectrum', e.target.value)}
                placeholder="400,25;450,65;500,45;..."
              />
              <Form.Text className="text-muted">
                Формат: длина_волны,интенсивность;длина_волны,интенсивность;...
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
              Отмена
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Сохранение...
                </>
              ) : (
                'Сохранить'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Модальное окно подтверждения удаления */}
      <Modal show={deleteConfirm !== null} onHide={() => setDeleteConfirm(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Подтверждение удаления</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Вы уверены, что хотите удалить этот пигмент? Это действие нельзя отменить.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Отмена
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirm !== null && handleDelete(deleteConfirm)}
          >
            Удалить
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}
