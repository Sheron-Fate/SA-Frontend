package ds

import (
    "time"
    "github.com/google/uuid"
)

type SpectrumAnalysisPigment struct {
    SpectrumAnalysisID   uuid.UUID `gorm:"primaryKey"`
    PigmentID   uint      `gorm:"primaryKey"`
    Comment     string
    Percent     float64
    CreatedAt   time.Time
}

// Явно указываем имя таблицы
func (SpectrumAnalysisPigment) TableName() string {
    return "spectrumanalysis_pigment"
}