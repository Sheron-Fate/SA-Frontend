package handlers

import (
	"net/http"

	"colorLex/internal/app/api/types"
	"colorLex/internal/app/ds"
	"colorLex/internal/app/repository"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SpectrumAnalysisPigmentsHandler struct {
	Repository *repository.Repository
}

func NewSpectrumAnalysisPigmentsHandler(repo *repository.Repository) *SpectrumAnalysisPigmentsHandler {
	return &SpectrumAnalysisPigmentsHandler{Repository: repo}
}

// DELETE /api/spectrumAnalysis-pigments - удаление пигмента из заявки
func (h *SpectrumAnalysisPigmentsHandler) DeleteSpectrumAnalysisPigment(c *gin.Context) {
	var request struct {
		SpectrumAnalysisID string `json:"spectrum_analysis_id" binding:"required"`
		PigmentID uint   `json:"pigment_id" binding:"required"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный формат данных"))
		return
	}

	currentUserID := uint(1)

	// Проверяем права - пользователь должен быть создателем заявки
	var analysis ds.SpectrumAnalysis
	if err := h.Repository.GetDB().Unscoped().First(&analysis, "id = ?", request.SpectrumAnalysisID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.Fail("Заявка не найдена"))
		return
	}

	if analysis.CreatorID != currentUserID {
		c.JSON(http.StatusForbidden, types.Fail("Недостаточно прав"))
		return
	}

	// Можно удалять только из черновиков
	if analysis.Status != "draft" {
		c.JSON(http.StatusBadRequest, types.Fail("Можно удалять пигменты только из черновиков"))
		return
	}

	// Удаляем связь
	result := h.Repository.GetDB().
		Where("spectrum_analysis_id = ? AND pigment_id = ?", request.SpectrumAnalysisID, request.PigmentID).
		Delete(&ds.SpectrumAnalysisPigment{})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка удаления пигмента из заявки"))
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, types.Fail("Пигмент не найден в заявке"))
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Пигмент удален из заявки",
	})
}

// PUT /api/spectrumAnalysis-pigments - изменение связи пигмент-заявка
func (h *SpectrumAnalysisPigmentsHandler) UpdateSpectrumAnalysisPigment(c *gin.Context) {
	var request struct {
		RequestID string  `json:"spectrum_analysis_id" binding:"required"`
		PigmentID uint    `json:"pigment_id" binding:"required"`
		Comment   string  `json:"comment,omitempty"`
		Percent   float64 `json:"percent,omitempty"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный формат данных"))
		return
	}

	currentUserID := uint(1)

	// Проверяем права - пользователь должен быть создателем заявки
	var analysis ds.SpectrumAnalysis
	if err := h.Repository.GetDB().Unscoped().First(&analysis, "id = ?", request.RequestID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.Fail("Заявка не найдена"))
		return
	}

	if analysis.CreatorID != currentUserID {
		c.JSON(http.StatusForbidden, types.Fail("Недостаточно прав"))
		return
	}

	// Находим существующую связь
	var spectrumAnalysisPigment ds.SpectrumAnalysisPigment
	err := h.Repository.GetDB().
		Where("spectrum_analysis_id = ? AND pigment_id = ?", request.RequestID, request.PigmentID).
		First(&spectrumAnalysisPigment).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, types.Fail("Пигмент не найден в заявке"))
		} else {
			c.JSON(http.StatusInternalServerError, types.Fail("Ошибка обновления связи"))
		}
		return
	}

	// Обновляем только переданные поля
	updates := make(map[string]interface{})
	if request.Comment != "" {
		updates["comment"] = request.Comment
	}
	if request.Percent > 0 {
		if request.Percent > 100.0 {
			c.JSON(http.StatusBadRequest, types.Fail("Процент не может превышать 100"))
			return
		}
		updates["percent"] = request.Percent
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, types.Fail("Нет данных для обновления"))
		return
	}

	if err := h.Repository.GetDB().Model(&spectrumAnalysisPigment).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка обновления связи"))
		return
	}

	// Получаем обновленную связь
	h.Repository.GetDB().First(&spectrumAnalysisPigment)

	response := types.SpectrumAnalysisPigmentResponse{
		PigmentID: spectrumAnalysisPigment.PigmentID,
		SpectrumAnalysisID: spectrumAnalysisPigment.SpectrumAnalysisID.String(),
		Comment:   spectrumAnalysisPigment.Comment,
		Percent:   spectrumAnalysisPigment.Percent,
		CreatedAt: spectrumAnalysisPigment.CreatedAt.Format("2006-01-02 15:04:05"),
	}

	c.JSON(http.StatusOK, gin.H{
		"spectrumAnalysis_pigment": response,
	})
}
