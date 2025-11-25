package pkg

import (
    "colorLex/internal/app/config"
    "colorLex/internal/app/handler"
    "strconv"
    "github.com/gin-gonic/gin"
    "github.com/sirupsen/logrus"
)

type App struct {
    config  *config.Config
    router  *gin.Engine
    handler *handler.Handler
}

func NewApp(cfg *config.Config, router *gin.Engine, h *handler.Handler) *App {
    return &App{
        config:  cfg,
        router:  router,
        handler: h,
    }
}

func (a *App) RunApp() {
    a.handler.RegisterStatic(a.router)
    a.handler.RegisterHandler(a.router)

    addr := a.config.ServiceHost + ":" + strconv.Itoa(a.config.ServicePort)
    
    logrus.Infof("Starting server on %s", addr)
    
    if err := a.router.Run(addr); err != nil {
        logrus.Fatalf("Failed to start server: %v", err)
    }
}