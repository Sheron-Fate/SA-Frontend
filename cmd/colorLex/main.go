package main

import (
	"colorLex/internal/app/api"
	"colorLex/internal/app/config"
	"colorLex/internal/app/dsn"
	"colorLex/internal/app/handler"
	"colorLex/internal/app/repository"
	"colorLex/internal/pkg"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	router := gin.Default()
	cfg, _ := config.NewConfig()
	repo, _ := repository.New(dsn.FromEnv())
	hand := handler.NewHandler(repo)

	api.SetupAPIRouter(router, repo)

	application := pkg.NewApp(cfg, router, hand)
	application.RunApp()
}
