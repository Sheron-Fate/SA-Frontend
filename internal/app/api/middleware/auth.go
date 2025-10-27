package middleware

import (
	"colorLex/internal/app/api/types"
	"colorLex/internal/app/ds"
	"colorLex/internal/app/repository"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type AuthMiddleware struct {
	Repository *repository.Repository
	JWTSecret  string
}

func NewAuthMiddleware(repo *repository.Repository, jwtSecret string) *AuthMiddleware {
	return &AuthMiddleware{
		Repository: repo,
		JWTSecret:  jwtSecret,
	}
}

// Claims структура для JWT токена
type Claims struct {
	UserID      uint   `json:"user_id"`
	Login       string `json:"login"`
	IsModerator bool   `json:"is_moderator"`
	jwt.RegisteredClaims
}

// AuthRequired middleware для проверки аутентификации
func (a *AuthMiddleware) AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := a.extractToken(c)
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, types.Fail("Токен не предоставлен"))
			c.Abort()
			return
		}

		claims, err := a.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, types.Fail("Недействительный токен"))
			c.Abort()
			return
		}

		// Проверяем что пользователь все еще существует
		var user ds.User
		if err := a.Repository.GetDB().First(&user, claims.UserID).Error; err != nil {
			c.JSON(http.StatusUnauthorized, types.Fail("Пользователь не найден"))
			c.Abort()
			return
		}

		// Сохраняем информацию о пользователе в контекст
		c.Set("user_id", claims.UserID)
		c.Set("user_login", claims.Login)
		c.Set("is_moderator", claims.IsModerator)
		c.Set("user", user)

		c.Next()
	}
}

// ModeratorRequired middleware для проверки прав модератора
func (a *AuthMiddleware) ModeratorRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		isModerator, exists := c.Get("is_moderator")
		if !exists || !isModerator.(bool) {
			c.JSON(http.StatusForbidden, types.Fail("Недостаточно прав. Требуется роль модератора"))
			c.Abort()
			return
		}
		c.Next()
	}
}

// OptionalAuth middleware для опциональной аутентификации
func (a *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := a.extractToken(c)
		if tokenString != "" {
			claims, err := a.ValidateToken(tokenString)
			if err == nil {
				// Проверяем что пользователь все еще существует
				var user ds.User
				if err := a.Repository.GetDB().First(&user, claims.UserID).Error; err == nil {
					c.Set("user_id", claims.UserID)
					c.Set("user_login", claims.Login)
					c.Set("is_moderator", claims.IsModerator)
					c.Set("user", user)
				}
			}
		}
		c.Next()
	}
}

// extractToken извлекает токен из заголовка Authorization или Cookie
func (a *AuthMiddleware) extractToken(c *gin.Context) string {
	// Сначала проверяем заголовок Authorization
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			return parts[1]
		}
	}

	// Затем проверяем Cookie
	cookie, err := c.Cookie("auth_token")
	if err == nil && cookie != "" {
		return cookie
	}

	return ""
}

// ValidateToken проверяет и парсит JWT токен
func (a *AuthMiddleware) ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(a.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		return nil, err
	}

	return claims, nil
}

// GenerateToken создает новый JWT токен для пользователя
func (a *AuthMiddleware) GenerateToken(user *ds.User) (string, error) {
	claims := &Claims{
		UserID:      user.ID,
		Login:       user.Login,
		IsModerator: user.IsModerator,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // 24 часа
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(a.JWTSecret))
}

// GenerateRefreshToken создает refresh token
func (a *AuthMiddleware) GenerateRefreshToken(user *ds.User) (string, error) {
	claims := &Claims{
		UserID:      user.ID,
		Login:       user.Login,
		IsModerator: user.IsModerator,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // 7 дней
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(a.JWTSecret))
}
