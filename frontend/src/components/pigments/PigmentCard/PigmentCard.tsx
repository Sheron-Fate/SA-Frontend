import { type FC } from 'react'
import { Button, Card } from 'react-bootstrap'
import './PigmentCard.css'
import { MINIO_BASE_URL, USE_PROXY_IMAGES } from '../../../config/target'

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
  const normalizedBase = MINIO_BASE_URL
  const trimmedKey = (image_key || '').trim()
  const isAbsolute = /^https?:\/\//i.test(trimmedKey)
  const isHttpsContext = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const requiresProxy = USE_PROXY_IMAGES || (isHttpsContext && normalizedBase.startsWith('http://'))
  // Если хотим проксировать, используем /api/images/:key
  const proxied = requiresProxy && trimmedKey ? `/api/images/${encodeURIComponent(trimmedKey)}` : ''
  const imgSrc = trimmedKey
    ? (isAbsolute
        ? trimmedKey
        : (proxied || (normalizedBase ? `${normalizedBase}/${trimmedKey}` : `/images/${trimmedKey}`)))
    : '/default-pigment.png'

  // Отладка
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
