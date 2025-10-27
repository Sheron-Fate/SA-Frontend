package api

import (
	"colorLex/internal/app/api/handlers"
	"colorLex/internal/app/api/middleware"
	"colorLex/internal/app/repository"

	"github.com/gin-gonic/gin"
)

func SetupAPIRouter(router *gin.Engine, repo *repository.Repository, authMW *middleware.AuthMiddleware, usersHandler *handlers.UsersHandler, pigmentHandler *handlers.PigmentHandler, spectrumAnalysisHandler *handlers.SpectrumAnalysisHandler, spectrumAnalysisPigmentHandler *handlers.SpectrumAnalysisPigmentsHandler) {
	api := router.Group("/api")
	{
		// Аутентификация (публичные методы)
		auth := api.Group("/auth")
		{
			auth.POST("/register", usersHandler.Register)
			auth.POST("/login", usersHandler.Login)
			auth.POST("/logout", usersHandler.Logout)
			auth.POST("/refresh", usersHandler.RefreshToken)
		}

		// Пользователи (требуют аутентификации)
		users := api.Group("/users")
		users.Use(authMW.AuthRequired())
		{
			users.GET("/profile", usersHandler.GetProfile)
			users.PUT("/profile", usersHandler.UpdateProfile)
		}

		// Пигменты (публичные для чтения, аутентификация для добавления)
		pigments := api.Group("/pigments")
		{
			pigments.GET("", pigmentHandler.GetPigments)                          // Публичный
			pigments.GET("/:id", pigmentHandler.GetPigment)                       // Публичный
			pigments.POST("/:id/add-to-sa", authMW.AuthRequired(), pigmentHandler.AddToSpectrumAnalysis) // Требует аутентификации

			// Методы модератора
			pigments.POST("", authMW.AuthRequired(), authMW.ModeratorRequired(), pigmentHandler.CreatePigment)
			pigments.PUT("/:id", authMW.AuthRequired(), authMW.ModeratorRequired(), pigmentHandler.UpdatePigment)
			pigments.DELETE("/:id", authMW.AuthRequired(), authMW.ModeratorRequired(), pigmentHandler.DeletePigment)
			pigments.POST("/:id/image", authMW.AuthRequired(), authMW.ModeratorRequired(), pigmentHandler.UploadImage)
		}

		// Спектральный анализ (требует аутентификации)
		spectrum := api.Group("/spectrum-analysis")
		spectrum.Use(authMW.AuthRequired())
		{
			spectrum.GET("/cart", spectrumAnalysisHandler.GetCart)
			spectrum.GET("", spectrumAnalysisHandler.GetSpectrumAnalyses)
			spectrum.GET("/:id", spectrumAnalysisHandler.GetSpectrumAnalysis)
			spectrum.PUT("/:id", spectrumAnalysisHandler.UpdateSpectrumAnalysis)
			spectrum.PUT("/:id/form", spectrumAnalysisHandler.FormSpectrumAnalysis)
			spectrum.DELETE("/:id", spectrumAnalysisHandler.DeleteAnalysis)

			// Методы модератора
			spectrum.PUT("/:id/complete", authMW.ModeratorRequired(), spectrumAnalysisHandler.CompleteSpectrumAnalysis)
		}

		// Связи M2M (требуют аутентификации)
		spectrumAnalysisPigments := api.Group("/spectrumAnalysis-pigments")
		spectrumAnalysisPigments.Use(authMW.AuthRequired())
		{
			spectrumAnalysisPigments.DELETE("", spectrumAnalysisPigmentHandler.DeleteSpectrumAnalysisPigment)
			spectrumAnalysisPigments.PUT("", spectrumAnalysisPigmentHandler.UpdateSpectrumAnalysisPigment)
		}
	}
}
