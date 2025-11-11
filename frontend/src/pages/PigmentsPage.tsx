import { type FC, useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import { BreadCrumbs } from "../components/common/BreadCrumbs/BreadCrumbs";
import { ROUTE_LABELS } from "../Routes";
import PigmentCard from "../components/pigments/PigmentCard/PigmentCard";
import PigmentFilters from "../components/pigments/PigmentFilters/PigmentFilters";
import { CartBadge } from "../components/common/CartBadge/CartBadge";
import { getPigments } from "../services/pigmentsApi";
import type { Pigment } from "../types/pigment";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../Routes";
import "./PigmentsPage.css";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectFilters } from "../features/filters/selectors";
import { setColor, setDateRange, setSearch } from "../features/filters/filtersSlice";

const PigmentsPage: FC = () => {
  const [loading, setLoading] = useState(false)
  const [pigments, setPigments] = useState<Pigment[]>([])

  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { search, color, dateRange } = useAppSelector(selectFilters)

  const fetchPigments = async () => {
    setLoading(true)
    const { pigments } = await getPigments({
      search,
      color,
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
    })
    setPigments(pigments)
    setLoading(false)
  }

  useEffect(() => {
    fetchPigments()
  }, []) // Загружаем пигменты при монтировании компонента

  const handleSearchValueChange = (value: string) => {
    dispatch(setSearch(value))
  }

  const handleColorChange = (value: string) => {
    dispatch(setColor(value))
  }

  const handleDateFromChange = (value: string) => {
    dispatch(setDateRange({ from: value || null, to: dateRange.to }))
  }

  const handleDateToChange = (value: string) => {
    dispatch(setDateRange({ from: dateRange.from, to: value || null }))
  }

  const handleSearch = () => {
    fetchPigments()
  }

  const handleCardClick = (id: number) => {
    navigate(`${ROUTES.PIGMENTS}/${id}`)
  }

  return (
    <div className="container">
      <BreadCrumbs crumbs={[{ label: ROUTE_LABELS.PIGMENTS }]} />

      <PigmentFilters
        search={search}
        setSearch={handleSearchValueChange}
        color={color}
        setColor={handleColorChange}
        dateFrom={dateRange.from}
        dateTo={dateRange.to}
        setDateFrom={handleDateFromChange}
        setDateTo={handleDateToChange}
        onSearch={handleSearch}
        loading={loading}
      />

      {loading && (
        <div className="loadingBg">
          <Spinner animation="border" />
        </div>
      )}

      {!loading && !pigments.length ? (
        <div>
          <h1>К сожалению, пигменты не найдены :(</h1>
        </div>
      ) : (
        <>
          <div className="pigmentsGrid">
            {pigments.map((pigment) => (
              <div key={pigment.id} className="pigmentsGrid__item">
                <PigmentCard
                  onCardClick={handleCardClick}
                  {...pigment}
                />
              </div>
            ))}
          </div>
          <CartBadge />
        </>
      )}
    </div>
  );
};

export default PigmentsPage;
