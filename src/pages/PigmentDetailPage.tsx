import { type FC, useEffect, useState } from "react";
import { BreadCrumbs } from "../components/common/BreadCrumbs/BreadCrumbs";
import { ROUTES, ROUTE_LABELS } from "../Routes";
import { useParams } from "react-router-dom";
import { getPigmentById } from "../services/pigmentsApi";
import { Spinner, Image } from "react-bootstrap";
import { PIGMENTS_MOCK } from "../data/mockPigments";
import type { Pigment } from "../types/pigment";
import "./PigmentDetailPage.css";
import { MINIO_BASE_URL, USE_PROXY_IMAGES } from "../config/target";

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

  const normalizedBase = MINIO_BASE_URL
  const trimmedKey = (pigment.image_key || "").trim()
  const isAbsolute = /^https?:\/\//i.test(trimmedKey)
  const isHttpsContext = typeof window !== "undefined" && window.location.protocol === "https:"
  const requiresProxy = USE_PROXY_IMAGES || (isHttpsContext && normalizedBase.startsWith("http://"))
  const proxied = requiresProxy && trimmedKey ? `/api/images/${encodeURIComponent(trimmedKey)}` : ""
  const fallbackImage = `${import.meta.env.BASE_URL}default-pigment.png`
  const imageUrl = trimmedKey
    ? isAbsolute
      ? trimmedKey
      : proxied || (normalizedBase ? `${normalizedBase}/${trimmedKey}` : `/images/${trimmedKey}`)
    : fallbackImage

  const createdDate = pigment.created_at
    ? new Date(pigment.created_at)
    : null

  return (
    <div>
      <BreadCrumbs
        crumbs={[
          { label: ROUTE_LABELS.PIGMENTS, path: ROUTES.PIGMENTS },
          { label: pigment.name },
        ]}
      />

      <section className="pigment-detail">
        <div className="pigment-detail__info">
          <h2>{pigment.name}</h2>
          <p className="pigment-detail__brief">{pigment.brief}</p>
          {pigment.description && (
            <p><strong>Описание:</strong> {pigment.description}</p>
          )}
          {pigment.color && (
            <p><strong>Цвет:</strong> {pigment.color}</p>
          )}
          {pigment.specs && (
            <p><strong>Характеристики:</strong> {pigment.specs}</p>
          )}
          {createdDate && !Number.isNaN(createdDate.getTime()) && (
            <p><strong>Добавлен:</strong> {createdDate.toLocaleDateString("ru-RU")}</p>
          )}
        </div>
        <div className="pigment-detail__media">
          <Image
            src={imageUrl}
            onError={(e: any) => {
              (e.target as HTMLImageElement).onerror = null
              ;(e.target as HTMLImageElement).src = fallbackImage
            }}
            alt={pigment.name}
            className="pigment-detail__image"
          />
        </div>
      </section>
    </div>
  )
}
