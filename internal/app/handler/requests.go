package handler

import (
	"colorLex/internal/app/ds"
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

func (h *Handler) GetRequest(ctx *gin.Context) {
	minioBase := getMinioBase()
	id := ctx.Param("id")

	var request ds.AnalysisRequest
	result := h.Repository.GetDB().Where("id = ? AND status != ?", id, "deleted").First(&request)
	if result.Error != nil {
		ctx.String(http.StatusNotFound, "Заявка не найдена или удалена")
		return
	}

	var pigments []ds.Pigment
	result = h.Repository.GetDB().
		Joins("JOIN request_pigments ON request_pigments.pigment_id = pigments.id").
		Where("request_pigments.request_id = ?", id).
		Find(&pigments)

	if result.Error != nil {
		ctx.String(http.StatusInternalServerError, "Ошибка загрузки пигментов")
		return
	}

	var requestPigments []ds.RequestPigment
	h.Repository.GetDB().Where("request_id = ?", id).Find(&requestPigments)

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

		for _, rp := range requestPigments {
			if rp.PigmentID == pig.ID {
				pigmentViews[i].Comment = rp.Comment
				pigmentViews[i].Percent = rp.Percent
				break
			}
		}
	}

	ctx.HTML(http.StatusOK, "AnalysisRequest.html", gin.H{
		"Request":   request,
		"Pigments":  pigmentViews,
		"MinioBase": minioBase,
	})
}

func (h *Handler) AddPigmentToRequest(ctx *gin.Context) {
	pigmentIDStr := ctx.PostForm("pigment_id")
	pigmentID, _ := strconv.Atoi(pigmentIDStr)

	var request ds.AnalysisRequest
	result := h.Repository.GetDB().Where("status = ?", "draft").First(&request)
	if result.Error != nil {
		ctx.Redirect(http.StatusFound, "/pigments")
		return
	}

	var existing ds.RequestPigment
	result = h.Repository.GetDB().
		Where("request_id = ? AND pigment_id = ?", request.ID, pigmentID).
		First(&existing)

	if result.Error != nil {
		requestPigment := ds.RequestPigment{
			RequestID: request.ID,
			PigmentID: uint(pigmentID),
			Comment:   "",
			Percent:   0.0,
		}
		h.Repository.GetDB().Create(&requestPigment)
	}

	ctx.Redirect(http.StatusFound, "/pigments")
}

func (h *Handler) DeleteRequest(ctx *gin.Context) {
	requestID := ctx.PostForm("id")

	sqlDB, err := h.Repository.GetDB().DB()
	if err == nil {
		sqlDB.Exec("UPDATE analysis_requests SET status = 'deleted' WHERE id = $1", requestID)
	}

	newRequest := ds.AnalysisRequest{
		Name:      "Новая заявка",
		Status:    "draft",
		CreatorID: 1,
		Spectrum:  "",
	}
	h.Repository.GetDB().Create(&newRequest)

	ctx.Redirect(http.StatusFound, "/pigments")
}
