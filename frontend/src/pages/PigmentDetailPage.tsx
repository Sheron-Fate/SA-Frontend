import { type FC, useEffect, useState } from "react";
import { BreadCrumbs } from "../components/common/BreadCrumbs/BreadCrumbs";
import { ROUTES, ROUTE_LABELS } from "../Routes";
import { useParams } from "react-router-dom";
import { getPigmentById } from "../services/pigmentsApi";
import { Col, Row, Spinner, Image } from "react-bootstrap";
import { PIGMENTS_MOCK } from "../data/mockPigments";
import type { Pigment } from "../types/pigment";
import "./PigmentDetailPage.css";

export const PigmentDetailPage: FC = () => {
  const [pigment, setPigment] = useState<Pigment | null>(null)
  const [loading, setLoading] = useState(true)
  const { id } = useParams()

  useEffect(() => {
    if (!id) return

    setLoading(true)
    getPigmentById(id)
      .then((response) => {
        setPigment(response.pigment)
        setLoading(false)
      })
      .catch(() => {
        // Fallback на mock данные
        const mockPigment = PIGMENTS_MOCK.find(p => p.id === parseInt(id))
        setPigment(mockPigment || null)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="pigment_page_loader_block">
        <Spinner animation="border" />
      </div>
    )
  }

  if (!pigment) {
    return <div>Пигмент не найден</div>
  }

  return (
    <div>
      <BreadCrumbs
        crumbs={[
          { label: ROUTE_LABELS.PIGMENTS, path: ROUTES.PIGMENTS },
          { label: pigment.name },
        ]}
      />

      <div className="container">
        <Row>
          <Col md={6}>
            <h2>{pigment.name}</h2>
            <p><strong>Краткое описание:</strong> {pigment.brief}</p>
            {pigment.description && (
              <p><strong>Описание:</strong> {pigment.description}</p>
            )}
            {pigment.color && (
              <p><strong>Цвет:</strong> {pigment.color}</p>
            )}
            {pigment.specs && (
              <p><strong>Характеристики:</strong> {pigment.specs}</p>
            )}
          </Col>
          <Col md={6}>
            {(() => {
              const minioBase = (import.meta as any).env?.VITE_MINIO_BASE_URL as string | undefined
              const normalizedBase = minioBase ? minioBase.replace(/\/$/, '') : ''
              const trimmedKey = (pigment.image_key || '').trim()
              const isAbsolute = /^https?:\/\//i.test(trimmedKey)
              const proxied = trimmedKey ? `/api/images/${encodeURIComponent(trimmedKey)}` : ''
              const imgSrc = trimmedKey
                ? (isAbsolute
                    ? trimmedKey
                    : (proxied || (normalizedBase ? `${normalizedBase}/${trimmedKey}` : `/images/${trimmedKey}`)))
                : '/default-pigment.png'
              return (
                <Image
                  src={imgSrc}
                  onError={(e: any) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = '/default-pigment.png' }}
                  alt={pigment.name}
                  width={200}
                  className="pigment-image"
                />
              )
            })()}
          </Col>
        </Row>
      </div>
    </div>
  )
}
