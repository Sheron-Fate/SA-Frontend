package handler

import (
	"colorLex/internal/app/ds"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type PigmentView struct {
	ID       uint
	Name     string
	Brief    string
	ImageKey string
	Comment  string
	Percent  float64
}

func (h *Handler) GetSpectrumAnalysis(ctx *gin.Context) {
	minioBase := getMinioBase()
	id := ctx.Param("id")

	// Обрабатываем случай когда нет активной заявки
	if id == "empty" {
		ctx.HTML(http.StatusOK, "AnalysisRequest.html", gin.H{
			"MinioBase":        minioBase,
			"RequestDeleted":   false,
			"NoActiveRequest":  true,
		})
		return
	}

	var spectrumAnalysis ds.SpectrumAnalysis
	result := h.Repository.GetDB().Unscoped().Where("id = ?", id).First(&spectrumAnalysis)

	if result.Error != nil {
		ctx.HTML(http.StatusOK, "AnalysisRequest.html", gin.H{
			"MinioBase":      minioBase,
			"RequestDeleted": true,
		})
		return
	}

	if spectrumAnalysis.Status == "deleted" {
		ctx.HTML(http.StatusOK, "AnalysisRequest.html", gin.H{
			"MinioBase":      minioBase,
			"RequestDeleted": true,
		})
		return
	}

	var pigments []ds.Pigment
	result = h.Repository.GetDB().
		Joins("JOIN spectrumAnalysis_pigment ON spectrumAnalysis_pigment.pigment_id = pigments.id").
		Where("spectrumAnalysis_pigment.spectrum_analysis_id = ?", id).
		Find(&pigments)

	if result.Error != nil {
		ctx.String(http.StatusInternalServerError, "Ошибка загрузки пигментов")
		return
	}

	var spectrumAnalysisPigments []ds.SpectrumAnalysisPigment
	h.Repository.GetDB().Where("spectrum_analysis_id = ?", id).Find(&spectrumAnalysisPigments)

	pigmentViews := make([]PigmentView, len(pigments))
	for i, pig := range pigments {
		pigmentViews[i] = PigmentView{
			ID:       pig.ID,
			Name:     pig.Name,
			Brief:    pig.Brief,
			ImageKey: pig.ImageKey,
			Comment:  "",
			Percent:  0.0,
		}

		for _, rp := range spectrumAnalysisPigments {
			if rp.PigmentID == pig.ID {
				pigmentViews[i].Comment = rp.Comment
				pigmentViews[i].Percent = rp.Percent
				break
			}
		}
	}

	ctx.HTML(http.StatusOK, "AnalysisRequest.html", gin.H{
		"SpectrumAnalysis": spectrumAnalysis, // ✅ НОВОЕ ИМЯ
		"Pigments":         pigmentViews,
		"MinioBase":        minioBase,
		"RequestDeleted":   false,
	})
}

func (h *Handler) AddPigmentToSpectrumAnalysis(ctx *gin.Context) {
	pigmentIDStr := ctx.PostForm("pigment_id")
	pigmentID, _ := strconv.Atoi(pigmentIDStr)

	fmt.Printf("🔍 DEBUG: AddPigmentToSpectrumAnalysis called with pigment ID: %s\n", pigmentIDStr)

	// Ищем активную заявку-черновик
	var spectrumAnalysis ds.SpectrumAnalysis
	result := h.Repository.GetDB().Where("status = ?", "draft").First(&spectrumAnalysis)

	if result.Error != nil {
		fmt.Printf("❌ DEBUG: No draft spectrum analysis found: %v\n", result.Error)
		fmt.Printf("🔄 DEBUG: Creating new spectrum analysis...\n")

		// Если нет черновика - создаем новый
		spectrumAnalysis = ds.SpectrumAnalysis{
			Name:      "Новый анализ спектра",
			Status:    "draft",
			CreatorID: 1,
			Spectrum:  "",
		}
		if err := h.Repository.GetDB().Create(&spectrumAnalysis).Error; err != nil {
			fmt.Printf("❌ DEBUG: Error creating spectrum analysis: %v\n", err)
			ctx.Redirect(http.StatusFound, "/pigments")
			return
		}
		fmt.Printf("✅ DEBUG: Created new spectrum analysis: %s\n", spectrumAnalysis.ID.String())
	} else {
		fmt.Printf("✅ DEBUG: Found existing spectrum analysis: %s\n", spectrumAnalysis.ID.String())
	}

	// Проверяем существующую связь
	var existing ds.SpectrumAnalysisPigment
	result = h.Repository.GetDB().
		Where("spectrum_analysis_id = ? AND pigment_id = ?", spectrumAnalysis.ID, pigmentID).
		First(&existing)

	if result.Error != nil {
		fmt.Printf("🔄 DEBUG: Creating new spectrum analysis pigment link...\n")
		// Связи нет - создаем новую
		spectrumAnalysisPigment := ds.SpectrumAnalysisPigment{
			SpectrumAnalysisID: spectrumAnalysis.ID,
			PigmentID:          uint(pigmentID),
			Comment:            "",
			Percent:            0.0,
		}
		if err := h.Repository.GetDB().Create(&spectrumAnalysisPigment).Error; err != nil {
			fmt.Printf("❌ DEBUG: Error creating spectrum analysis pigment: %v\n", err)
		} else {
			fmt.Printf("✅ DEBUG: Successfully added pigment %d to spectrum analysis %s\n", pigmentID, spectrumAnalysis.ID.String())
		}
	} else {
		fmt.Printf("ℹ️ DEBUG: Pigment %d already in spectrum analysis %s\n", pigmentID, spectrumAnalysis.ID.String())
	}

	ctx.Redirect(http.StatusFound, "/pigments")
}

func (h *Handler) DeleteSpectrumAnalysis(ctx *gin.Context) {
	requestID := ctx.PostForm("id")

	sqlDB, err := h.Repository.GetDB().DB()
	if err == nil {
		sqlDB.Exec("UPDATE spectrum_analysis SET status = 'deleted' WHERE id = $1", requestID)
	}

	// НЕ создаем новую заявку автоматически - она создастся только при добавлении пигмента
	ctx.Redirect(http.StatusFound, "/pigments")
}
