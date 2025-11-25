package handlers

import (
	"colorLex/internal/app/api/middleware"
	"colorLex/internal/app/api/redis"
	"colorLex/internal/app/api/types"
	"colorLex/internal/app/ds"
	"colorLex/internal/app/repository"
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UsersHandler struct {
	Repository *repository.Repository
	AuthMW     *middleware.AuthMiddleware
	RedisClient *redis.Client
}

func NewUsersHandler(repo *repository.Repository, authMW *middleware.AuthMiddleware, redisClient *redis.Client) *UsersHandler {
	return &UsersHandler{
		Repository:  repo,
		AuthMW:     authMW,
		RedisClient: redisClient,
	}
}

// Register godoc
// @Summary Регистрация пользователя
// @Description Создает нового пользователя в системе
// @Tags auth
// @Accept json
// @Produce json
// @Param request body types.RegisterRequest true "Данные для регистрации"
// @Success 201 {object} types.AuthResponse
// @Failure 400 {object} types.ErrorResponse
// @Failure 500 {object} types.ErrorResponse
// @Router /api/auth/register [post]
func (h *UsersHandler) Register(c *gin.Context) {
	var request types.RegisterRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный формат данных"))
		return
	}

	// Проверяем что логин не занят
	var existingUser ds.User
	err := h.Repository.GetDB().Where("login = ?", request.Login).First(&existingUser).Error
	if err == nil {
		c.JSON(http.StatusBadRequest, types.Fail("Пользователь с таким логином уже существует"))
		return
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка проверки пользователя"))
		return
	}

	// Сохраняем пароль без хеширования (для упрощения)
	// Создаем пользователя
	user := ds.User{
		Login:        request.Login,
		PasswordHash: request.Password, // Сохраняем пароль как есть, без хеширования
		IsModerator:  request.IsModerator,
	}

	if err := h.Repository.GetDB().Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка создания пользователя"))
		return
	}

	// Генерируем токены
	accessToken, err := h.AuthMW.GenerateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка генерации токена"))
		return
	}

	refreshToken, err := h.AuthMW.GenerateRefreshToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка генерации refresh токена"))
		return
	}

	// Создаем сессию в Redis
	sessionID := uuid.New().String()
	sessionData := &redis.SessionData{
		UserID:      user.ID,
		Login:       user.Login,
		IsModerator: user.IsModerator,
		CreatedAt:   time.Now().Unix(),
	}

	if err := h.RedisClient.SetSession(context.Background(), sessionID, sessionData, 24*time.Hour); err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка создания сессии"))
		return
	}

	// Сохраняем refresh токен в Redis
	if err := h.RedisClient.SetRefreshToken(context.Background(), user.ID, refreshToken, 7*24*time.Hour); err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка сохранения refresh токена"))
		return
	}

	response := types.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: types.UserProfileResponse{
			ID:          user.ID,
			Login:       user.Login,
			IsModerator: user.IsModerator,
		},
		ExpiresIn: 86400, // 24 часа в секундах
	}

	// Устанавливаем cookie
	c.SetCookie("auth_token", accessToken, 86400, "/", "", false, true)
	c.SetCookie("session_id", sessionID, 86400, "/", "", false, true)

	c.JSON(http.StatusCreated, response)
}

// Login godoc
// @Summary Аутентификация пользователя
// @Description Вход в систему с получением JWT токенов
// @Tags auth
// @Accept json
// @Produce json
// @Param request body types.LoginRequest true "Данные для входа"
// @Success 200 {object} types.AuthResponse
// @Failure 400 {object} types.ErrorResponse
// @Failure 401 {object} types.ErrorResponse
// @Failure 500 {object} types.ErrorResponse
// @Router /api/auth/login [post]
func (h *UsersHandler) Login(c *gin.Context) {
	var request types.LoginRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный формат данных"))
		return
	}

	// Находим пользователя
	var user ds.User
	err := h.Repository.GetDB().Where("login = ?", request.Login).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, types.Fail("Неверный логин или пароль"))
		} else {
			c.JSON(http.StatusInternalServerError, types.Fail("Ошибка аутентификации"))
		}
		return
	}

	// Проверяем пароль (простое сравнение строк без хеширования)
	if user.PasswordHash != request.Password {
		c.JSON(http.StatusUnauthorized, types.Fail("Неверный логин или пароль"))
		return
	}

	// Генерируем токены
	accessToken, err := h.AuthMW.GenerateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка генерации токена"))
		return
	}

	refreshToken, err := h.AuthMW.GenerateRefreshToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка генерации refresh токена"))
		return
	}

	// Создаем сессию в Redis
	sessionID := uuid.New().String()
	sessionData := &redis.SessionData{
		UserID:      user.ID,
		Login:       user.Login,
		IsModerator: user.IsModerator,
		CreatedAt:   time.Now().Unix(),
	}

	if err := h.RedisClient.SetSession(context.Background(), sessionID, sessionData, 24*time.Hour); err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка создания сессии"))
		return
	}

	// Сохраняем refresh токен в Redis
	if err := h.RedisClient.SetRefreshToken(context.Background(), user.ID, refreshToken, 7*24*time.Hour); err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка сохранения refresh токена"))
		return
	}

	response := types.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: types.UserProfileResponse{
			ID:          user.ID,
			Login:       user.Login,
			IsModerator: user.IsModerator,
		},
		ExpiresIn: 86400, // 24 часа в секундах
	}

	// Устанавливаем cookie
	c.SetCookie("auth_token", accessToken, 86400, "/", "", false, true)
	c.SetCookie("session_id", sessionID, 86400, "/", "", false, true)

	c.JSON(http.StatusOK, response)
}

// Logout godoc
// @Summary Выход из системы
// @Description Выход из системы с добавлением токена в blacklist
// @Tags auth
// @Accept json
// @Produce json
// @Param request body types.LogoutRequest true "Refresh токен для выхода"
// @Success 200 {object} map[string]string
// @Failure 400 {object} types.ErrorResponse
// @Failure 500 {object} types.ErrorResponse
// @Router /api/auth/logout [post]
func (h *UsersHandler) Logout(c *gin.Context) {
	var request types.LogoutRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный формат данных"))
		return
	}

	// Добавляем refresh токен в blacklist
	tokenID := fmt.Sprintf("refresh_%s", request.RefreshToken)
	if err := h.RedisClient.AddToBlacklist(context.Background(), tokenID, 7*24*time.Hour); err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка выхода из системы"))
		return
	}

	// Удаляем cookie
	c.SetCookie("auth_token", "", -1, "/", "", false, true)
	c.SetCookie("session_id", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "Успешный выход из системы",
	})
}

// RefreshToken godoc
// @Summary Обновление токена
// @Description Обновляет access токен используя refresh токен
// @Tags auth
// @Accept json
// @Produce json
// @Param request body types.RefreshTokenRequest true "Refresh токен"
// @Success 200 {object} types.AuthResponse
// @Failure 400 {object} types.ErrorResponse
// @Failure 401 {object} types.ErrorResponse
// @Failure 500 {object} types.ErrorResponse
// @Router /api/auth/refresh [post]
func (h *UsersHandler) RefreshToken(c *gin.Context) {
	var request types.RefreshTokenRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный формат данных"))
		return
	}

	// Проверяем что refresh токен не в blacklist
	tokenID := fmt.Sprintf("refresh_%s", request.RefreshToken)
	isBlacklisted, err := h.RedisClient.IsBlacklisted(context.Background(), tokenID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка проверки токена"))
		return
	}
	if isBlacklisted {
		c.JSON(http.StatusUnauthorized, types.Fail("Токен недействителен"))
		return
	}

	// Валидируем refresh токен
	claims, err := h.AuthMW.ValidateToken(request.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.Fail("Недействительный refresh токен"))
		return
	}

	// Проверяем что пользователь все еще существует
	var user ds.User
	if err := h.Repository.GetDB().First(&user, claims.UserID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, types.Fail("Пользователь не найден"))
		return
	}

	// Генерируем новый access токен
	accessToken, err := h.AuthMW.GenerateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка генерации токена"))
		return
	}

	response := types.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: request.RefreshToken, // Возвращаем тот же refresh токен
		User: types.UserProfileResponse{
			ID:          user.ID,
			Login:       user.Login,
			IsModerator: user.IsModerator,
		},
		ExpiresIn: 86400, // 24 часа в секундах
	}

	// Обновляем cookie
	c.SetCookie("auth_token", accessToken, 86400, "/", "", false, true)

	c.JSON(http.StatusOK, response)
}

// GetProfile godoc
// @Summary Получение профиля пользователя
// @Description Возвращает информацию о текущем пользователе
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} types.UserProfileResponse
// @Failure 401 {object} types.ErrorResponse
// @Failure 500 {object} types.ErrorResponse
// @Router /api/users/profile [get]
func (h *UsersHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.Fail("Пользователь не аутентифицирован"))
		return
	}

	var user ds.User
	if err := h.Repository.GetDB().First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка получения профиля"))
		return
	}

	response := types.UserProfileResponse{
		ID:          user.ID,
		Login:       user.Login,
		IsModerator: user.IsModerator,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateProfile godoc
// @Summary Обновление профиля пользователя
// @Description Обновляет информацию профиля текущего пользователя
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body types.UpdateProfileRequest true "Данные для обновления"
// @Success 200 {object} types.UserProfileResponse
// @Failure 400 {object} types.ErrorResponse
// @Failure 401 {object} types.ErrorResponse
// @Failure 500 {object} types.ErrorResponse
// @Router /api/users/profile [put]
func (h *UsersHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, types.Fail("Пользователь не аутентифицирован"))
		return
	}

	var request types.UpdateProfileRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный формат данных"))
		return
	}

	var user ds.User
	if err := h.Repository.GetDB().First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка обновления профиля"))
		return
	}

	// Обновляем только переданные поля
	updates := make(map[string]interface{})
	if request.Login != "" {
		// Проверяем что новый логин не занят
		var existingUser ds.User
		err := h.Repository.GetDB().Where("login = ? AND id != ?", request.Login, userID).First(&existingUser).Error
		if err == nil {
			c.JSON(http.StatusBadRequest, types.Fail("Пользователь с таким логином уже существует"))
			return
		} else if err != gorm.ErrRecordNotFound {
			c.JSON(http.StatusInternalServerError, types.Fail("Ошибка проверки логина"))
			return
		}
		updates["login"] = request.Login
	}

	if request.Password != "" {
		// Сохраняем пароль без хеширования (для упрощения)
		updates["password_hash"] = request.Password
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, types.Fail("Нет данных для обновления"))
		return
	}

	if err := h.Repository.GetDB().Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка обновления профиля"))
		return
	}

	// Получаем обновленного пользователя
	h.Repository.GetDB().First(&user, userID)

	response := types.UserProfileResponse{
		ID:          user.ID,
		Login:       user.Login,
		IsModerator: user.IsModerator,
	}

	c.JSON(http.StatusOK, response)
}
