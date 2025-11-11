import { type FC } from 'react'
import { Button } from 'react-bootstrap'
import './PigmentFilters.css'

interface PigmentFiltersProps {
  search: string
  setSearch: (value: string) => void
  color: string
  setColor: (value: string) => void
  onSearch: () => void
  loading?: boolean
}

const PigmentFilters: FC<PigmentFiltersProps> = ({
  search, setSearch, color, setColor, onSearch, loading
}) => (
  <div className="filtersField">
    <input
      value={search}
      placeholder="Поиск по названию..."
      onChange={(event) => setSearch(event.target.value)}
      className="searchInput"
    />
    <select
      value={color}
      onChange={(event) => setColor(event.target.value)}
      className="colorSelect"
    >
      <option value="">Все цвета</option>
      <option value="красн">Красный</option>
      <option value="син">Синий</option>
      <option value="желт">Желтый</option>
      <option value="черн">Черный</option>
      <option value="бел">Белый</option>
    </select>
    <Button disabled={loading} onClick={onSearch} variant="primary">
      {loading ? 'Поиск...' : 'Поиск'}
    </Button>
  </div>
)

export default PigmentFilters
