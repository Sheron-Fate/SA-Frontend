package handler

import (
	"colorLex/internal/app/ds"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetPigments(ctx *gin.Context) {
	minioBase := getMinioBase()
	q := ctx.Query("q")

	var pigments []ds.Pigment
	if q == "" {
		h.Repository.GetDB().Find(&pigments)
	} else {
		h.Repository.GetDB().Where("name ILIKE ?", "%"+q+"%").Find(&pigments)
	}

	var request ds.AnalysisRequest
	h.Repository.GetDB().Where("status = ?", "draft").First(&request)

	var count int64
	h.Repository.GetDB().Model(&ds.RequestPigment{}).Where("request_id = ?", request.ID).Count(&count)

	ctx.HTML(http.StatusOK, "Pigments.html", gin.H{
		"Pigments":     pigments,
		"MinioBase":    minioBase,
		"RequestCount": int(count),
		"RequestID":    request.ID.String(),
		"Q":            q,
	})
}

func (h *Handler) GetPigment(ctx *gin.Context) {
	minioBase := getMinioBase()
	id := ctx.Query("id")

	var pigment ds.Pigment
	h.Repository.GetDB().First(&pigment, id)

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
