package handler

import (
	"colorLex/internal/app/ds"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetPigments(ctx *gin.Context) {
	minioBase := getMinioBase()
	q := ctx.Query("search")

	var pigments []ds.Pigment
	if q == "" {
		h.Repository.GetDB().Unscoped().Find(&pigments)
	} else {
		h.Repository.GetDB().Unscoped().Where("name ILIKE ?", "%"+q+"%").Find(&pigments)
	}

	// Ищем активную заявку-черновик (может не быть)
	var spectrumAnalysis ds.SpectrumAnalysis
	err := h.Repository.GetDB().Where("status = ?", "draft").First(&spectrumAnalysis).Error

	var count int64 = 0
	var spectrumAnalysisID string
	var hasActiveCart bool = false

	if err == nil {
		// Есть активная заявка
		h.Repository.GetDB().Model(&ds.SpectrumAnalysisPigment{}).Where("spectrum_analysis_id = ?", spectrumAnalysis.ID).Count(&count)
		spectrumAnalysisID = spectrumAnalysis.ID.String()
		hasActiveCart = true
	}

	ctx.HTML(http.StatusOK, "Pigments.html", gin.H{
		"Pigments":           pigments,
		"MinioBase":          minioBase,
		"RequestCount":       int(count),
		"SpectrumAnalysisID": spectrumAnalysisID,
		"HasActiveCart":      hasActiveCart,
		"Q":                  q,
	})
}

func (h *Handler) GetPigment(ctx *gin.Context) {
	minioBase := getMinioBase()
	id := ctx.Param("id")

	var pigment ds.Pigment
	h.Repository.GetDB().Unscoped().First(&pigment, id) // ✅ Добавляем Unscoped

	ctx.HTML(http.StatusOK, "Pigment.html", gin.H{
		"Pigment":   pigment,
		"MinioBase": minioBase,
	})
}

func getMinioBase() string {
	minioBase := os.Getenv("MINIO_BASE_URL")
	if minioBase == "" {
		return "http://localhost:9000"
	}
	return minioBase
}
