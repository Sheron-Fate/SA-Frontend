import { type FC } from 'react'
import { Button, Card } from 'react-bootstrap'
import './PigmentCard.css'

interface PigmentCardProps {
  id: number
  name: string
  brief: string
  color?: string
  image_key?: string
  onCardClick: (id: number) => void
}

const PigmentCard: FC<PigmentCardProps> = ({
  id, name, brief, image_key, onCardClick
}) => {
  const minioBase = (import.meta as any).env?.VITE_MINIO_BASE_URL as string | undefined
  const normalizedBase = minioBase ? minioBase.replace(/\/$/, '') : ''
  const trimmedKey = (image_key || '').trim()
  const isAbsolute = /^https?:\/\//i.test(trimmedKey)
  // Если хотим всегда проксировать, используем /api/images/:key
  const proxied = trimmedKey ? `/api/images/${encodeURIComponent(trimmedKey)}` : ''
  const imgSrc = trimmedKey
    ? (isAbsolute
        ? trimmedKey
        : (proxied || (normalizedBase ? `${normalizedBase}/${trimmedKey}` : `/images/${trimmedKey}`)))
    : '/default-pigment.png'

  // Отладка
  console.log('PigmentCard Debug:', {
    name,
    image_key,
    minioBase,
    normalizedBase,
    trimmedKey,
    isAbsolute,
    imgSrc
  })

  return (
    <Card className="card" onClick={() => onCardClick(id)}>
      <Card.Img
        className="cardImage"
        variant="top"
        src={imgSrc}
        onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = '/default-pigment.png' }}
        height={100}
        width={100}
      />
      <Card.Body>
        <div className="textStyle">
          <Card.Title>{name}</Card.Title>
        </div>
        <div className="textStyle">
          <Card.Text>{brief}</Card.Text>
        </div>
        <Button className="cardButton" variant="primary">
          Подробнее
        </Button>
      </Card.Body>
    </Card>
  )
}

export default PigmentCard
