package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"colorLex/internal/app/api/types"
	"colorLex/internal/app/ds"
	"colorLex/internal/app/repository"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PigmentHandler struct {
	Repository *repository.Repository
}

func NewPigmentHandler(repo *repository.Repository) *PigmentHandler {
	return &PigmentHandler{Repository: repo}
}

// GET /api/pigments - список пигментов с фильтрацией
func (h *PigmentHandler) GetPigments(c *gin.Context) {
	var filter types.PigmentFilter
	if err := c.BindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверные параметры фильтрации"))
		return
	}

	var pigments []ds.Pigment
	db := h.Repository.GetDB()

	// Применяем фильтры
	if filter.Search != "" {
		db = db.Where("name ILIKE ?", "%"+filter.Search+"%")
	}
	if filter.Color != "" {
		db = db.Where("color = ?", filter.Color)
	}

	// Пагинация
	db = db.Limit(filter.Limit).Offset(filter.Offset)

	if err := db.Find(&pigments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка получения пигментов"))
		return
	}

	// Сериализация ответа
	response := make([]types.PigmentResponse, len(pigments))
	for i, pigment := range pigments {
		response[i] = types.PigmentResponse{
			ID:          pigment.ID,
			Name:        pigment.Name,
			Brief:       pigment.Brief,
			Description: pigment.Description,
			Color:       pigment.Color,
			Specs:       pigment.Specs,
			ImageKey:    pigment.ImageKey,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"pigments": response,
		"count":    len(response),
	})
}

// GET /api/pigments/:id - детали пигмента
func (h *PigmentHandler) GetPigment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный ID пигмента"))
		return
	}

	var pigment ds.Pigment
	if err := h.Repository.GetDB().Unscoped().First(&pigment, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, types.Fail("Пигмент не найден"))
		} else {
			c.JSON(http.StatusInternalServerError, types.Fail("Ошибка получения пигмента"))
		}
		return
	}

	response := types.PigmentResponse{
		ID:          pigment.ID,
		Name:        pigment.Name,
		Brief:       pigment.Brief,
		Description: pigment.Description,
		Color:       pigment.Color,
		Specs:       pigment.Specs,
		ImageKey:    pigment.ImageKey,
	}

	c.JSON(http.StatusOK, gin.H{
		"pigment": response,
	})
}

// POST /api/pigments - создание пигмента
func (h *PigmentHandler) CreatePigment(c *gin.Context) {
	var request types.CreatePigmentRequest

	// ДЕСЕРИАЛИЗАЦИЯ JSON → Go структура
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный формат данных: "+err.Error()))
		return
	}

	// Валидация
	if request.Name == "" || request.Brief == "" {
		c.JSON(http.StatusBadRequest, types.Fail("Название и краткое описание обязательны"))
		return
	}

	// Создаем пигмент в БД
	pigment := ds.Pigment{
		Name:        request.Name,
		Brief:       request.Brief,
		Description: request.Description,
		Color:       request.Color,
		Specs:       request.Specs,
	}

	if err := h.Repository.GetDB().Create(&pigment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка создания пигмента"))
		return
	}

	// СЕРИАЛИЗАЦИЯ Go структура → JSON
	response := types.PigmentResponse{
		ID:          pigment.ID,
		Name:        pigment.Name,
		Brief:       request.Brief,
		Description: request.Description,
		Color:       request.Color,
		Specs:       request.Specs,
	}

	c.JSON(http.StatusCreated, gin.H{
		"pigment": response,
	})
}

// PUT /api/pigments/:id - обновление пигмента
func (h *PigmentHandler) UpdatePigment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный ID пигмента"))
		return
	}

	var request types.UpdatePigmentRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный формат данных"))
		return
	}

	// Проверяем существование пигмента
	var pigment ds.Pigment
	if err := h.Repository.GetDB().Unscoped().First(&pigment, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, types.Fail("Пигмент не найден"))
		} else {
			c.JSON(http.StatusInternalServerError, types.Fail("Ошибка обновления пигмента"))
		}
		return
	}

	// Обновляем только переданные поля
	updates := make(map[string]interface{})
	if request.Name != "" {
		updates["name"] = request.Name
	}
	if request.Brief != "" {
		updates["brief"] = request.Brief
	}
	if request.Description != "" {
		updates["description"] = request.Description
	}
	if request.Color != "" {
		updates["color"] = request.Color
	}
	if request.Specs != "" {
		updates["specs"] = request.Specs
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, types.Fail("Нет данных для обновления"))
		return
	}

	if err := h.Repository.GetDB().Model(&pigment).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка обновления пигмента"))
		return
	}

	// Получаем обновленный пигмент
	h.Repository.GetDB().First(&pigment, id)

	response := types.PigmentResponse{
		ID:          pigment.ID,
		Name:        pigment.Name,
		Brief:       pigment.Brief,
		Description: pigment.Description,
		Color:       pigment.Color,
		Specs:       pigment.Specs,
		ImageKey:    pigment.ImageKey,
	}

	c.JSON(http.StatusOK, gin.H{
		"pigment": response,
	})
}

// DELETE /api/pigments/:id - удаление пигмента
func (h *PigmentHandler) DeletePigment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный ID пигмента"))
		return
	}

	var pigment ds.Pigment
	if err := h.Repository.GetDB().Unscoped().First(&pigment, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, types.Fail("Пигмент не найден"))
		} else {
			c.JSON(http.StatusInternalServerError, types.Fail("Ошибка удаления пигмента"))
		}
		return
	}

	// TODO: Удаление изображения из Minio (если есть)
	if pigment.ImageKey != "" {
		// minio.Delete(pigment.ImageKey)
	}

	// Удаляем связи в request_pigments сначала
	if err := h.Repository.GetDB().Where("pigment_id = ?", id).Delete(&ds.SpectrumAnalysisPigment{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка удаления связей пигмента"))
		return
	}

	// Удаляем сам пигмент
	if err := h.Repository.GetDB().Delete(&pigment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка удаления пигмента"))
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Пигмент удален",
	})
}

// POST /api/pigments/:id/add-to-cart - добавить пигмент в корзину
func (h *PigmentHandler) AddToSpectrumAnalysis(c *gin.Context) {
	idStr := c.Param("id")
	pigmentID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный ID пигмента"))
		return
	}

	// TODO: Заглушка - текущий пользователь (пока ID=1)
	currentUserID := uint(1)

	// Проверяем существование пигмента
	var pigment ds.Pigment
	if err := h.Repository.GetDB().Unscoped().First(&pigment, pigmentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, types.Fail("Пигмент не найден"))
		} else {
			c.JSON(http.StatusInternalServerError, types.Fail("Ошибка добавления в корзину"))
		}
		return
	}

	// Находим или создаем заявку в статусе draft для пользователя
	var analysis ds.SpectrumAnalysis
	err = h.Repository.GetDB().Where("creator_id = ? AND status = ?", currentUserID, "draft").First(&analysis).Error

	if err == gorm.ErrRecordNotFound {
		// Создаем новую заявку
		analysis = ds.SpectrumAnalysis{
			Name:      "Новый анализ спектра",
			Status:    "draft",
			CreatorID: currentUserID,
			Spectrum:  "",
		}
		if err := h.Repository.GetDB().Create(&analysis).Error; err != nil {
			c.JSON(http.StatusInternalServerError, types.Fail("Ошибка создания заявки"))
			return
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка поиска заявки"))
		return
	}

	// Проверяем, нет ли уже этого пигмента в заявке
	var existing ds.SpectrumAnalysisPigment
	err = h.Repository.GetDB().
		Where("spectrum_analysis_id = ? AND pigment_id = ?", analysis.ID, pigmentID).
		First(&existing).Error

	if err == nil {
		c.JSON(http.StatusBadRequest, types.Fail("Пигмент уже в заявке"))
		return
	}

	// Добавляем пигмент в заявку
	spectrumAnalysisPigment := ds.SpectrumAnalysisPigment{
    SpectrumAnalysisID: analysis.ID,
    PigmentID: uint(pigmentID),
    Comment:   "",
    Percent:   0.0,
}

	if err := h.Repository.GetDB().Create(&spectrumAnalysisPigment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка добавления в заявку"))
		return
	}

	// Считаем количество пигментов в заявке
	var count int64
	h.Repository.GetDB().Model(&ds.SpectrumAnalysisPigment{}).Where("spectrum_analysis_id = ?", analysis.ID).Count(&count)

	c.JSON(http.StatusOK, gin.H{
		"message":     "Пигмент добавлен в заявку",
		"analysis_id": analysis.ID,
		"items_count": count,
	})
}

// POST /api/pigments/:id/image - загрузка изображения пигмента
func (h *PigmentHandler) UploadImage(c *gin.Context) {
	idStr := c.Param("id")
	pigmentID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный ID пигмента"))
		return
	}

	// ✅ ИСПОЛЬЗУЕМ Unscoped() чтобы игнорировать soft delete условия
	var pigment ds.Pigment
	result := h.Repository.GetDB().Unscoped().Where("id = ?", pigmentID).First(&pigment)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, types.Fail("Пигмент не найден"))
		} else {
			c.JSON(http.StatusInternalServerError, types.Fail("Ошибка загрузки изображения"))
		}
		return
	}

	fmt.Printf("✅ DEBUG: Found pigment - ID: %d, Name: %s, Current ImageKey: '%s'\n",
		pigment.ID, pigment.Name, pigment.ImageKey)

	// Получаем файл из формы
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Файл изображения обязателен"))
		return
	}

	// Проверяем тип файла
	if !strings.HasSuffix(strings.ToLower(file.Filename), ".jpg") &&
		!strings.HasSuffix(strings.ToLower(file.Filename), ".jpeg") &&
		!strings.HasSuffix(strings.ToLower(file.Filename), ".png") {
		c.JSON(http.StatusBadRequest, types.Fail("Поддерживаются только JPG, JPEG и PNG файлы"))
		return
	}

	// Генерируем уникальное имя файла на латинице
	fileExt := filepath.Ext(file.Filename)
	newFileName := fmt.Sprintf("pigment_%d_%d%s", pigment.ID, time.Now().Unix(), fileExt)

	fmt.Printf("🔄 DEBUG: Updating pigment ID %d with image_key: %s\n", pigment.ID, newFileName)

	// ✅ ИСПОЛЬЗУЕМ Unscoped() ДЛЯ ОБНОВЛЕНИЯ ТОЖЕ!
	result = h.Repository.GetDB().Unscoped().Model(&ds.Pigment{}).Where("id = ?", pigment.ID).Update("image_key", newFileName)
	if result.Error != nil {
		fmt.Printf("❌ DEBUG: Update error: %v\n", result.Error)
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка сохранения информации об изображении: "+result.Error.Error()))
		return
	}

	fmt.Printf("✅ DEBUG: Update successful. Rows affected: %d\n", result.RowsAffected)

	// Проверяем обновилась ли запись
	var updatedPigment ds.Pigment
	h.Repository.GetDB().Unscoped().First(&updatedPigment, pigment.ID)
	fmt.Printf("🔍 DEBUG: After update - ImageKey: '%s'\n", updatedPigment.ImageKey)

	c.JSON(http.StatusOK, gin.H{
		"message":           "Изображение успешно загружено",
		"image_key":         newFileName,
		"pigment_id":        pigment.ID,
		"pigment_name":      pigment.Name,
		"rows_affected":     result.RowsAffected,
		"current_image_key": updatedPigment.ImageKey,
	})
}
