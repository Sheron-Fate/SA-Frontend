package main

import (
    "log"
    "github.com/joho/godotenv"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "colorLex/internal/app/ds"
    "colorLex/internal/app/dsn"
)

func main() {
    _ = godotenv.Load()
    
    db, err := gorm.Open(postgres.Open(dsn.FromEnv()), &gorm.Config{})
    if err != nil {
        log.Fatal("failed to connect database:", err)
    }

    err = db.AutoMigrate(&ds.User{}, &ds.Pigment{}, &ds.AnalysisRequest{}, &ds.RequestPigment{})
    if err != nil {
        log.Fatal("cant migrate db:", err)
    }

    log.Println("Migration completed successfully!")
}