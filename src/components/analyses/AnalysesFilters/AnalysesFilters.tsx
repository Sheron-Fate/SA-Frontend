import { type FC, useState, useEffect } from 'react'
import { Button, Form } from 'react-bootstrap'
import './AnalysesFilters.css'

interface AnalysesFiltersProps {
  status: string | null
  dateFrom: string | null
  dateTo: string | null
  setStatus: (value: string | null) => void
  setDateFrom: (value: string | null) => void
  setDateTo: (value: string | null) => void
  onApply: () => void
  onReset: () => void
  loading?: boolean
}

// Функция для форматирования ввода в ДД.ММ.ГГГГ
const formatDateInput = (value: string): string => {
  // Удаляем все нецифровые символы
  const digits = value.replace(/\D/g, '')

  // Ограничиваем до 8 цифр
  const limited = digits.slice(0, 8)

  // Форматируем как ДД.ММ.ГГГГ
  if (limited.length <= 2) {
    return limited
  } else if (limited.length <= 4) {
    return `${limited.slice(0, 2)}.${limited.slice(2)}`
  } else {
    return `${limited.slice(0, 2)}.${limited.slice(2, 4)}.${limited.slice(4)}`
  }
}

// Валидация даты ДД.ММ.ГГГГ
const validateDate = (value: string | null): boolean => {
  if (!value) return true // Пустое значение валидно
  const parts = value.split('.')
  if (parts.length !== 3) return false
  const [day, month, year] = parts.map(Number)
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false
  if (day < 1 || day > 31) return false
  if (month < 1 || month > 12) return false
  if (year < 1900 || year > 2100) return false
  return true
}

const AnalysesFilters: FC<AnalysesFiltersProps> = ({
  status,
  dateFrom,
  dateTo,
  setStatus,
  setDateFrom,
  setDateTo,
  onApply,
  onReset,
  loading,
}) => {
  const [dateFromInput, setDateFromInput] = useState(dateFrom || '')
  const [dateToInput, setDateToInput] = useState(dateTo || '')

  // Синхронизируем локальное состояние с пропсами
  useEffect(() => {
    setDateFromInput(dateFrom || '')
  }, [dateFrom])

  useEffect(() => {
    setDateToInput(dateTo || '')
  }, [dateTo])

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value)
    setDateFromInput(formatted)
    if (validateDate(formatted)) {
      setDateFrom(formatted || null)
    }
  }

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value)
    setDateToInput(formatted)
    if (validateDate(formatted)) {
      setDateTo(formatted || null)
    }
  }

  const handleReset = () => {
    setDateFromInput('')
    setDateToInput('')
    onReset()
  }

  return (
    <div className="analyses-filters">
      <Form.Group className="filter-group">
        <Form.Label>Статус</Form.Label>
        <Form.Select
          value={status || ''}
          onChange={(e) => setStatus(e.target.value || null)}
        >
          <option value="">Все статусы</option>
          <option value="draft">Черновик</option>
          <option value="created">Сформирована</option>
          <option value="completed">Завершена</option>
          <option value="rejected">Отклонена</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="filter-group">
        <Form.Label>Дата от (ДД.ММ.ГГГГ)</Form.Label>
        <Form.Control
          type="text"
          value={dateFromInput}
          onChange={handleDateFromChange}
          placeholder="ДД.ММ.ГГГГ"
          maxLength={10}
        />
      </Form.Group>

      <Form.Group className="filter-group">
        <Form.Label>Дата до (ДД.ММ.ГГГГ)</Form.Label>
        <Form.Control
          type="text"
          value={dateToInput}
          onChange={handleDateToChange}
          placeholder="ДД.ММ.ГГГГ"
          maxLength={10}
        />
      </Form.Group>

      <div className="filter-actions">
        <Button
          variant="primary"
          onClick={onApply}
          disabled={loading}
          className="me-2"
        >
          {loading ? 'Применение...' : 'Применить'}
        </Button>
        <Button variant="outline-secondary" onClick={handleReset} disabled={loading}>
          Сбросить
        </Button>
      </div>
    </div>
  )
}

export default AnalysesFilters
