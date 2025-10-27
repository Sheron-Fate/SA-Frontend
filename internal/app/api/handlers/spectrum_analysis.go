package handlers

import (
	"colorLex/internal/app/api/types"
	"colorLex/internal/app/ds"
	"colorLex/internal/app/repository"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SpectrumAnalysisHandler struct {
	Repository *repository.Repository
}

func NewSpectrumAnalysisHandler(repo *repository.Repository) *SpectrumAnalysisHandler {
	return &SpectrumAnalysisHandler{Repository: repo}
}

// GetCart godoc
// @Summary Получение корзины пользователя
// @Description Возвращает информацию о корзине текущего пользователя
// @Tags spectrum-analysis
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} types.ErrorResponse
// @Failure 500 {object} types.ErrorResponse
// @Router /api/spectrum-analysis/cart [get]
func (h *SpectrumAnalysisHandler) GetCart(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.Fail("Пользователь не аутентифицирован"))
		return
	}

	var analysis ds.SpectrumAnalysis
	err := h.Repository.GetDB().
		Where("creator_id = ? AND status = ?", userID, "draft").
		First(&analysis).Error

	if err == gorm.ErrRecordNotFound {
		// Нет активной заявки-черновика
		c.JSON(http.StatusOK, gin.H{
			"analysis_id": nil,
			"items_count": 0,
			"has_active_cart": false,
		})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка получения корзины"))
		return
	}

	// Есть активная заявка, считаем количество пигментов
	var count int64
	h.Repository.GetDB().Model(&ds.SpectrumAnalysisPigment{}).
		Where("spectrum_analysis_id = ?", analysis.ID).Count(&count)

	c.JSON(http.StatusOK, gin.H{
		"analysis_id": analysis.ID,
		"items_count": count,
		"has_active_cart": true,
	})
}

// GetSpectrumAnalyses godoc
// @Summary Получение списка заявок
// @Description Возвращает список заявок с учетом прав доступа пользователя
// @Tags spectrum-analysis
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param status query string false "Фильтр по статусу"
// @Param date_from query string false "Дата начала (RFC3339)"
// @Param date_to query string false "Дата окончания (RFC3339)"
// @Param limit query int false "Лимит записей" default(10)
// @Param offset query int false "Смещение" default(0)
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} types.ErrorResponse
// @Failure 500 {object} types.ErrorResponse
// @Router /api/spectrum-analysis [get]
func (h *SpectrumAnalysisHandler) GetSpectrumAnalyses(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.Fail("Пользователь не аутентифицирован"))
		return
	}

	isModerator, _ := c.Get("is_moderator")

	var filter types.SpectrumAnalysisFilter
	if err := c.BindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверные параметры фильтрации"))
		return
	}

	var analyses []ds.SpectrumAnalysis
	db := h.Repository.GetDB().Unscoped().Where("status != ? AND status != ?", "draft", "deleted")

	// Если пользователь не модератор, показываем только его заявки
	if !isModerator.(bool) {
		db = db.Where("creator_id = ?", userID)
	}

	// Применяем фильтры
	if filter.Status != "" {
		db = db.Where("status = ?", filter.Status)
	}
	if !filter.DateFrom.IsZero() {
		db = db.Where("formed_at >= ?", filter.DateFrom)
	}
	if !filter.DateTo.IsZero() {
		db = db.Where("formed_at <= ?", filter.DateTo)
	}

	if err := db.Limit(filter.Limit).Offset(filter.Offset).Find(&analyses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка получения заявок"))
		return
	}

	// Сериализация ответа
	response := make([]types.SpectrumAnalysisResponse, len(analyses))
	for i, analysis := range analyses {
		response[i] = types.SpectrumAnalysisResponse{
			ID:          analysis.ID.String(),
			Name:        analysis.Name,
			Status:      analysis.Status,
			Spectrum:    analysis.Spectrum,
			CreatedAt:   analysis.CreatedAt,
			FormedAt:    analysis.FormedAt,
			CompletedAt: analysis.CompletedAt,
			CreatorID:   analysis.CreatorID,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"analyses": response,
		"count":    len(response),
	})
}

// GET /api/spectrum-analysis/{id} - детали заявки
func (h *SpectrumAnalysisHandler) GetSpectrumAnalysis(c *gin.Context) {
	id := c.Param("id")

	var analysis ds.SpectrumAnalysis
	if err := h.Repository.GetDB().Unscoped().First(&analysis, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, types.Fail("Заявка не найдена"))
		} else {
			c.JSON(http.StatusInternalServerError, types.Fail("Ошибка получения заявки"))
		}
		return
	}

	// Проверяем статус заявки
	if analysis.Status == "deleted" {
		c.JSON(http.StatusNotFound, types.Fail("Заявка была удалена"))
		return
	}

	// Получаем пигменты заявки
	var pigments []ds.Pigment
	var spectrumAnalysisPigments []ds.SpectrumAnalysisPigment

	h.Repository.GetDB().
		Joins("JOIN spectrumAnalysis_pigment ON spectrumAnalysis_pigment.pigment_id = pigments.id").
		Where("spectrumAnalysis_pigment.spectrum_analysis_id = ?", id).
		Find(&pigments)

	h.Repository.GetDB().Where("spectrum_analysis_id = ?", id).Find(&spectrumAnalysisPigments)

	// Формируем ответ с пигментами
	pigmentMap := make(map[uint]types.PigmentInAnalysis)
	for _, pig := range pigments {
		pigmentMap[pig.ID] = types.PigmentInAnalysis{
			PigmentID: pig.ID,
			Name:      pig.Name,
			Brief:     pig.Brief,
			ImageKey:  pig.ImageKey,
			Comment:   "",
			Percent:   0.0,
		}
	}

	for _, rp := range spectrumAnalysisPigments {
		if pig, exists := pigmentMap[rp.PigmentID]; exists {
			pig.Comment = rp.Comment
			pig.Percent = rp.Percent
			pigmentMap[rp.PigmentID] = pig
		}
	}

	pigmentsResponse := make([]types.PigmentInAnalysis, 0, len(pigmentMap))
	for _, pig := range pigmentMap {
		pigmentsResponse = append(pigmentsResponse, pig)
	}

	response := types.SpectrumAnalysisResponse{
		ID:          analysis.ID.String(),
		Name:        analysis.Name,
		Status:      analysis.Status,
		Spectrum:    analysis.Spectrum,
		CreatedAt:   analysis.CreatedAt,
		FormedAt:    analysis.FormedAt,
		CompletedAt: analysis.CompletedAt,
		CreatorID:   analysis.CreatorID,
		Pigments:    pigmentsResponse,
	}

	c.JSON(http.StatusOK, gin.H{
		"analysis": response,
	})
}

// PUT /api/spectrum-analysis/:id/form - сформировать заявку
func (h *SpectrumAnalysisHandler) FormSpectrumAnalysis(c *gin.Context) {
	id := c.Param("id")

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.Fail("Пользователь не аутентифицирован"))
		return
	}
	currentUserID := userID.(uint)

	fmt.Printf("🔍 DEBUG: FormSpectrumAnalysis called with ID: %s\n", id)

	var analysis ds.SpectrumAnalysis
	if err := h.Repository.GetDB().Unscoped().First(&analysis, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, types.Fail("Заявка не найдена"))
		} else {
			c.JSON(http.StatusInternalServerError, types.Fail("Ошибка поиска заявки"))
		}
		return
	}

	fmt.Printf("✅ DEBUG: Found analysis - ID: %s, Status: %s, CreatorID: %d\n",
		analysis.ID.String(), analysis.Status, analysis.CreatorID)

	// Проверяем права: только создатель или модератор может формировать заявку
	isModerator, _ := c.Get("is_moderator")
	if analysis.CreatorID != currentUserID && !isModerator.(bool) {
		c.JSON(http.StatusForbidden, types.Fail("Недостаточно прав"))
		return
	}

	if analysis.Status != "draft" {
		c.JSON(http.StatusBadRequest, types.Fail("Заявка уже сформирована или имеет неверный статус"))
		return
	}

	// Проверяем обязательные поля
	if analysis.Spectrum == "" {
		c.JSON(http.StatusBadRequest, types.Fail("Спектр обязателен для формирования"))
		return
	}

	now := time.Now()

	// ✅ ИСПОЛЬЗУЕМ ПРАВИЛЬНЫЙ СТАТУС 'created' вместо 'formed'
	newStatus := "created"

	fmt.Printf("🔄 DEBUG: Updating status from '%s' to '%s'\n", analysis.Status, newStatus)

	result := h.Repository.GetDB().Unscoped().Model(&analysis).Updates(map[string]interface{}{
		"status":    newStatus,
		"formed_at": now,
	})

	if result.Error != nil {
		fmt.Printf("❌ DEBUG: Update error: %v\n", result.Error)
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка формирования заявки: "+result.Error.Error()))
		return
	}

	fmt.Printf("✅ DEBUG: Update successful. Rows affected: %d\n", result.RowsAffected)

	c.JSON(http.StatusOK, gin.H{
		"message":   "Заявка успешно сформирована",
		"formed_at": now,
		"status":    newStatus,
	})
}

// PUT /api/spectrum-analysis/:id - обновление полей заявки
func (h *SpectrumAnalysisHandler) UpdateSpectrumAnalysis(c *gin.Context) {
	id := c.Param("id")
	currentUserID := uint(1) // TODO: Заглушка

	var request types.UpdateSpectrumAnalysisRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный формат данных"))
		return
	}

	// Проверяем существование заявки
	var analysis ds.SpectrumAnalysis
	if err := h.Repository.GetDB().First(&analysis, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, types.Fail("Заявка не найдена"))
		} else {
			c.JSON(http.StatusInternalServerError, types.Fail("Ошибка обновления заявки"))
		}
		return
	}

	// Проверяем права (только создатель может менять черновик)
	if analysis.CreatorID != currentUserID {
		c.JSON(http.StatusForbidden, types.Fail("Недостаточно прав"))
		return
	}

	// Можно менять только черновики
	if analysis.Status != "draft" {
		c.JSON(http.StatusBadRequest, types.Fail("Можно изменять только заявки в статусе черновика"))
		return
	}

	// Обновляем только переданные поля
	updates := make(map[string]interface{})
	if request.Name != "" {
		updates["name"] = request.Name
	}
	if request.Spectrum != "" {
		updates["spectrum"] = request.Spectrum
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, types.Fail("Нет данных для обновления"))
		return
	}

	if err := h.Repository.GetDB().Model(&analysis).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка обновления заявки"))
		return
	}

	// Получаем обновленную заявку
	h.Repository.GetDB().First(&analysis, "id = ?", id)

	response := types.SpectrumAnalysisResponse{
		ID:        analysis.ID.String(),
		Name:      analysis.Name,
		Status:    analysis.Status,
		Spectrum:  analysis.Spectrum,
		CreatedAt: analysis.CreatedAt,
		CreatorID: analysis.CreatorID,
	}

	c.JSON(http.StatusOK, gin.H{
		"analysis": response,
	})
}

// CompleteSpectrumAnalysis godoc
// @Summary Завершение/отклонение заявки
// @Description Завершает или отклоняет заявку (только для модераторов)
// @Tags spectrum-analysis
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "ID заявки"
// @Param request body object{action=string} true "Действие: complete или reject"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} types.ErrorResponse
// @Failure 401 {object} types.ErrorResponse
// @Failure 403 {object} types.ErrorResponse
// @Failure 404 {object} types.ErrorResponse
// @Failure 500 {object} types.ErrorResponse
// @Router /api/spectrum-analysis/{id}/complete [put]
func (h *SpectrumAnalysisHandler) CompleteSpectrumAnalysis(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.Fail("Пользователь не аутентифицирован"))
		return
	}

	isModerator, _ := c.Get("is_moderator")
	if !isModerator.(bool) {
		c.JSON(http.StatusForbidden, types.Fail("Недостаточно прав. Требуется роль модератора"))
		return
	}

	id := c.Param("id")

	var request struct {
		Action string `json:"action" binding:"required"` // "complete" или "reject"
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный формат данных"))
		return
	}

	if request.Action != "complete" && request.Action != "reject" {
		c.JSON(http.StatusBadRequest, types.Fail("Действие должно быть 'complete' или 'reject'"))
		return
	}

	var analysis ds.SpectrumAnalysis
	if err := h.Repository.GetDB().Unscoped().First(&analysis, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, types.Fail("Заявка не найдена"))
		} else {
			c.JSON(http.StatusInternalServerError, types.Fail("Ошибка завершения заявки"))
		}
		return
	}

	// ✅ ПРОВЕРЯЕМ СТАТУС 'created' вместо 'formed'
	if analysis.Status != "created" {
		c.JSON(http.StatusBadRequest, types.Fail("Можно завершать только созданные заявки"))
		return
	}

	var newStatus string
	if request.Action == "complete" {
		newStatus = "completed"

		// ВЫЧИСЛЯЕМОЕ ПОЛЕ: расчет точности спектрального анализа
		accuracy := h.calculateAnalysisAccuracy(analysis.ID)

		// Обновляем проценты пигментов на основе вычислений
		h.updatePigmentPercentages(analysis.ID, accuracy)

	} else {
		newStatus = "rejected"
	}

	now := time.Now()
	updates := map[string]interface{}{
		"status":       newStatus,
		"completed_at": now,
		"moderator_id": userID,
	}

	if err := h.Repository.GetDB().Unscoped().Model(&analysis).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка завершения заявки"))
		return
	}

	responseMessage := "Заявка отклонена"
	if request.Action == "complete" {
		responseMessage = "Заявка успешно завершена"
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      responseMessage,
		"status":       newStatus,
		"completed_at": now,
	})
}

// DELETE /api/spectrum-analysis/:id - удаление заявки
func (h *SpectrumAnalysisHandler) DeleteAnalysis(c *gin.Context) {
	id := c.Param("id")
	currentUserID := uint(1) // TODO: Заглушка

	// Проверяем существование заявки
	var analysis ds.SpectrumAnalysis
	if err := h.Repository.GetDB().First(&analysis, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, types.Fail("Заявка не найдена"))
		} else {
			c.JSON(http.StatusInternalServerError, types.Fail("Ошибка удаления заявки"))
		}
		return
	}

	// Проверяем права (только создатель может удалять)
	if analysis.CreatorID != currentUserID {
		c.JSON(http.StatusForbidden, types.Fail("Недостаточно прав"))
		return
	}

	// Можно удалять только черновики
	if analysis.Status != "draft" {
		c.JSON(http.StatusBadRequest, types.Fail("Можно удалять только заявки в статусе черновика"))
		return
	}

	// ЛОГИЧЕСКОЕ УДАЛЕНИЕ через SQL (как в методичке)
	sqlDB, err := h.Repository.GetDB().DB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка подключения к БД"))
		return
	}

	_, err = sqlDB.Exec("UPDATE spectrum_analysis SET status = 'deleted' WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка удаления заявки"))
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Заявка успешно удалена",
	})
}

// Вспомогательные методы для бизнес-логики

// calculateAnalysisAccuracy - вычисление точности спектрального анализа
func (h *SpectrumAnalysisHandler) calculateAnalysisAccuracy(analysisID uuid.UUID) float64 {
	// TODO: Реализовать реальную формулу расчета на основе спектра
	// Пока возвращаем заглушку
	return 85.5 // 85.5% точность
}

// updatePigmentPercentages - обновление процентов пигментов при завершении анализа
func (h *SpectrumAnalysisHandler) updatePigmentPercentages(analysisID uuid.UUID, accuracy float64) {
	// TODO: Реальная логика распределения процентов на основе спектрального анализа
	// Пока равномерно распределяем с учетом точности

	var requestPigments []ds.SpectrumAnalysisPigment
	h.Repository.GetDB().Where("spectrum_analysis_id = ?", analysisID).Find(&requestPigments)

	if len(requestPigments) > 0 {
		basePercent := accuracy / float64(len(requestPigments))

		for i := range requestPigments {
			// Немного варьируем проценты для реалистичности
			variation := float64(i%3) * 2.5
			finalPercent := basePercent + variation

			h.Repository.GetDB().Model(&requestPigments[i]).
				Update("percent", finalPercent)
		}
	}
}
