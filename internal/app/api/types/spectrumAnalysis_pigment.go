package types

// Запрос на изменение связи пигмент-заявка
type UpdateSpectrumAnalysisPigmentRequest struct {
    Comment string  `json:"comment,omitempty"`
    Percent float64 `json:"percent,omitempty"`
}

// Ответ с связью пигмент-заявка
type SpectrumAnalysisPigmentResponse struct {
    PigmentID uint    `json:"pigment_id"`
    SpectrumAnalysisID string  `json:"spectrum_analysis_id"`
    Comment   string  `json:"comment"`
    Percent   float64 `json:"percent"`
    CreatedAt string  `json:"created_at"`
}