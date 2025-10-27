package types

import "time"

// Фильтры для списка заявок
type SpectrumAnalysisFilter struct {
	Status   string    `form:"status"`
	DateFrom time.Time `form:"date_from"`
	DateTo   time.Time `form:"date_to"`
	Limit    int       `form:"limit,default=20"`
	Offset   int       `form:"offset,default=0"`
}

// Ответ с заявкой
type SpectrumAnalysisResponse struct {
	ID          string              `json:"id"`
	Name        string              `json:"name"`
	Status      string              `json:"status"`
	Spectrum    string              `json:"spectrum,omitempty"`
	CreatedAt   time.Time           `json:"created_at"`
	FormedAt    *time.Time          `json:"formed_at,omitempty"`
	CompletedAt *time.Time          `json:"completed_at,omitempty"`
	CreatorID   uint                `json:"creator_id"`
	Pigments    []PigmentInAnalysis `json:"pigments,omitempty"`
}

// Пигмент в заявке
type PigmentInAnalysis struct {
	PigmentID uint    `json:"pigment_id"`
	Name      string  `json:"name"`
	Brief     string  `json:"brief"`
	ImageKey  string  `json:"image_key"`
	Comment   string  `json:"comment"`
	Percent   float64 `json:"percent"`
}

// Запрос на обновление заявки
type UpdateSpectrumAnalysisRequest struct {
	Name     string `json:"name,omitempty"`
	Spectrum string `json:"spectrum,omitempty"`
}

// Запрос на завершение/отклонение заявки
type CompleteAnalysisRequest struct {
    Action string `json:"action" binding:"required"` // "complete" или "reject"
}

// Ответ при завершении заявки
type CompleteAnalysisResponse struct {
    Message     string    `json:"message"`
    Status      string    `json:"status"`
    CompletedAt time.Time `json:"completed_at"`
    Accuracy    float64   `json:"accuracy,omitempty"` // Вычисленная точность
}