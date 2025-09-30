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
	router.GET("/pigment", h.GetPigment)
	router.GET("/request/:id", h.GetRequest)
	router.POST("/request/add-pigment", h.AddPigmentToRequest)
	router.POST("/request/delete", h.DeleteRequest)
}

func (h *Handler) RegisterStatic(router *gin.Engine) {
	router.LoadHTMLGlob("templates/*")
	router.Static("/static", "./static")
}
