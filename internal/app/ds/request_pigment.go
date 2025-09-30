package ds

import (
    "time"
    "github.com/google/uuid"
)

type RequestPigment struct {
    RequestID uuid.UUID `gorm:"primaryKey"`
    PigmentID uint      `gorm:"primaryKey"`
    Comment   string
    Percent   float64
    CreatedAt time.Time
}