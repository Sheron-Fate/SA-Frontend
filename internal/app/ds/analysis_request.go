package ds

import (
    "time"
    "github.com/google/uuid"
)

type AnalysisRequest struct {
    ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
    Name        string
    Status      string
    CreatedAt   time.Time
    CreatorID   uint
    FormedAt    *time.Time
    CompletedAt *time.Time
    ModeratorID *uint
    Spectrum    string
}