package config

import (
	"os"
)

type Config struct {
	DatabaseURL  string
	RedisAddr    string
	RedisPassword string
	RedisDB      int
	JWTSecret    string
}

func LoadConfig() (*Config, error) {
	return &Config{
		DatabaseURL:   getEnv("DATABASE_URL", "postgres://root:password@localhost:5435/PigmentsArchive?sslmode=disable"),
		RedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", "password"),
		RedisDB:       0,
		JWTSecret:     getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
