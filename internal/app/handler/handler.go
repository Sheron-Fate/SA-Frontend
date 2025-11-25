package handler

import (
	"colorLex/internal/app/repository"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	Repository *repository.Repository
}

func NewHandler(r *repository.Repository) *Handler {
	return &Handler{Repository: r}
}

func (h *Handler) RegisterHandler(router *gin.Engine) {
	router.GET("/pigments", h.GetPigments)
	router.GET("/pigment/:id", h.GetPigment)
	router.GET("/spectrumAnalysis/:id", h.GetSpectrumAnalysis)
	router.POST("/spectrumAnalysis/add-pigment", h.AddPigmentToSpectrumAnalysis)
	router.POST("/spectrumAnalysis/delete", h.DeleteSpectrumAnalysis)
}

func (h *Handler) RegisterStatic(router *gin.Engine) {
	router.LoadHTMLGlob("templates/*")
	router.Static("/static", "./static")
}
