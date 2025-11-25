package main

import (
	"colorLex/internal/app/api"
	"colorLex/internal/app/api/handlers"
	"colorLex/internal/app/api/middleware"
	"colorLex/internal/app/api/redis"
	"colorLex/internal/app/config"
	"colorLex/internal/app/repository"
	"context"
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/swaggo/files"
	"github.com/swaggo/gin-swagger"
	_ "colorLex/docs" // Swagger docs
)

// @title ColorLex API
// @version 1.0
// @description API для системы спектроскопического анализа фрагментов живописи
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8080
// @BasePath /

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

func main() {
	// Загружаем конфигурацию
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	// Инициализируем репозиторий
	repo, err := repository.New(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Инициализируем Redis клиент
	redisClient := redis.NewClient(cfg.RedisAddr, cfg.RedisPassword, cfg.RedisDB)

	// Проверяем соединение с Redis
	ctx := context.Background()
	if err := redisClient.Ping(ctx); err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}
	defer redisClient.Close()

	// Инициализируем middleware
	authMW := middleware.NewAuthMiddleware(repo, cfg.JWTSecret)

	// Инициализируем handlers
	usersHandler := handlers.NewUsersHandler(repo, authMW, redisClient)
	pigmentHandler := handlers.NewPigmentHandler(repo)
	spectrumAnalysisHandler := handlers.NewSpectrumAnalysisHandler(repo)
	spectrumAnalysisPigmentHandler := handlers.NewSpectrumAnalysisPigmentsHandler(repo)

	// Настраиваем Gin
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// Добавляем CORS middleware
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Swagger документация
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Настраиваем API роуты
	api.SetupAPIRouter(router, repo, authMW, usersHandler, pigmentHandler, spectrumAnalysisHandler, spectrumAnalysisPigmentHandler)

	// Запускаем сервер
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on port %s\n", port)
	fmt.Printf("Swagger UI available at: http://localhost:%s/swagger/index.html\n", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
