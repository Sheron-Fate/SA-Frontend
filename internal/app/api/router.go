package api

import (
	"colorLex/internal/app/api/handlers"
	"colorLex/internal/app/repository"

	"github.com/gin-gonic/gin"
)

func SetupAPIRouter(router *gin.Engine, repo *repository.Repository) {
	// Инициализируем handlers
	pigmentHandler := handlers.NewPigmentHandler(repo)
	spectrumAnalysisHandler := handlers.NewSpectrumAnalysisHandler(repo)
	requestPigmentsHandler := handlers.NewSpectrumAnalysisPigmentsHandler(repo)
	usersHandler := handlers.NewUsersHandler(repo)

	api := router.Group("/api")
	{
		pigments := api.Group("/pigments")
		{
			pigments.GET("", pigmentHandler.GetPigments)                          // GET /api/pigments
			pigments.GET("/:id", pigmentHandler.GetPigment)                       // GET /api/pigments/1
			pigments.POST("", pigmentHandler.CreatePigment)                       // POST /api/pigments
			pigments.PUT("/:id", pigmentHandler.UpdatePigment)                    // PUT /api/pigments/1
			pigments.DELETE("/:id", pigmentHandler.DeletePigment)                 // DELETE /api/pigments/1
			pigments.POST("/:id/image", pigmentHandler.UploadImage)               // POST /api/pigments/1/image
			pigments.POST("/:id/add-to-sa", pigmentHandler.AddToSpectrumAnalysis) // POST /api/pigments/1/add-to-sa
		}

		spectrum := api.Group("/spectrum-analysis")
		{
			spectrum.GET("/cart", spectrumAnalysisHandler.GetCart)                          // 8
			spectrum.GET("", spectrumAnalysisHandler.GetSpectrumAnalyses)                   // 9
			spectrum.GET("/:id", spectrumAnalysisHandler.GetSpectrumAnalysis)               // 10
			spectrum.PUT("/:id", spectrumAnalysisHandler.UpdateSpectrumAnalysis)            // 11
			spectrum.PUT("/:id/form", spectrumAnalysisHandler.FormSpectrumAnalysis)         // 12
			spectrum.PUT("/:id/complete", spectrumAnalysisHandler.CompleteSpectrumAnalysis) // 13
			spectrum.DELETE("/:id", spectrumAnalysisHandler.DeleteAnalysis)                 // 14
		}

		// Связи M2M (2 метода)
		spectrumAnalysisPigments := api.Group("/spectrumAnalysis-pigments")
		{
			spectrumAnalysisPigments.DELETE("", requestPigmentsHandler.DeleteSpectrumAnalysisPigment) // 15
			spectrumAnalysisPigments.PUT("", requestPigmentsHandler.UpdateSpectrumAnalysisPigment)    // 16
		}

		// Пользователи (5 методов)
		users := api.Group("/users")
		{
			users.POST("/register", usersHandler.Register)    // 17
			users.POST("/login", usersHandler.Login)          // 18
			users.POST("/logout", usersHandler.Logout)        // 19
			users.GET("/profile", usersHandler.GetProfile)    // 20
			users.PUT("/profile", usersHandler.UpdateProfile) // 21
		}
	}
}
