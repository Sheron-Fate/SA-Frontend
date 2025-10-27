package handlers

import (
	"net/http"

	"colorLex/internal/app/api/types"
	"colorLex/internal/app/ds"
	"colorLex/internal/app/repository"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UsersHandler struct {
	Repository *repository.Repository
}

func NewUsersHandler(repo *repository.Repository) *UsersHandler {
	return &UsersHandler{Repository: repo}
}

// POST /api/users/register - регистрация пользователя
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

	// Хешируем пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка создания пользователя"))
		return
	}

	// Создаем пользователя
	user := ds.User{
		Login:        request.Login,
		PasswordHash: string(hashedPassword),
		IsModerator:  false, // По умолчанию не модератор
	}

	if err := h.Repository.GetDB().Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.Fail("Ошибка создания пользователя"))
		return
	}

	response := types.UserProfileResponse{
		ID:          user.ID,
		Login:       user.Login,
		IsModerator: user.IsModerator,
	}

	c.JSON(http.StatusCreated, gin.H{
		"user":    response,
		"message": "Пользователь успешно зарегистрирован",
	})
}

// POST /api/users/login - аутентификация
func (h *UsersHandler) Login(c *gin.Context) {
	var request types.LoginRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный формат данных"))
		return
	}

	// Ищем пользователя
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

	// Проверяем пароль
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(request.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, types.Fail("Неверный логин или пароль"))
		return
	}

	// TODO: Создать сессию/JWT токен
	// Пока просто возвращаем профиль

	response := types.UserProfileResponse{
		ID:          user.ID,
		Login:       user.Login,
		IsModerator: user.IsModerator,
	}

	c.JSON(http.StatusOK, gin.H{
		"user":    response,
		"message": "Успешный вход в систему",
	})
}

// POST /api/users/logout - деавторизация
func (h *UsersHandler) Logout(c *gin.Context) {
	// TODO: Удалить сессию/токен
	c.JSON(http.StatusOK, gin.H{
		"message": "Успешный выход из системы",
	})
}

// GET /api/users/profile - профиль пользователя
func (h *UsersHandler) GetProfile(c *gin.Context) {
	currentUserID := uint(1) // TODO: Заглушка - заменить на реального пользователя из сессии

	var user ds.User
	if err := h.Repository.GetDB().First(&user, currentUserID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, types.Fail("Пользователь не найден"))
		} else {
			c.JSON(http.StatusInternalServerError, types.Fail("Ошибка получения профиля"))
		}
		return
	}

	response := types.UserProfileResponse{
		ID:          user.ID,
		Login:       user.Login,
		IsModerator: user.IsModerator,
	}

	c.JSON(http.StatusOK, gin.H{
		"user": response,
	})
}

// PUT /api/users/profile - обновление профиля
func (h *UsersHandler) UpdateProfile(c *gin.Context) {
	currentUserID := uint(1) // TODO: Заглушка

	var request types.UpdateProfileRequest
	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, types.Fail("Неверный формат данных"))
		return
	}

	// Находим пользователя
	var user ds.User
	if err := h.Repository.GetDB().First(&user, currentUserID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.Fail("Пользователь не найден"))
		return
	}

	// Обновляем только переданные поля
	updates := make(map[string]interface{})
	if request.Login != "" {
		// Проверяем что новый логин не занят
		var existingUser ds.User
		err := h.Repository.GetDB().Where("login = ? AND id != ?", request.Login, currentUserID).First(&existingUser).Error
		if err == nil {
			c.JSON(http.StatusBadRequest, types.Fail("Логин уже занят"))
			return
		} else if err != gorm.ErrRecordNotFound {
			c.JSON(http.StatusInternalServerError, types.Fail("Ошибка проверки логина"))
			return
		}
		updates["login"] = request.Login
	}

	if request.Password != "" {
		// Хешируем новый пароль
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, types.Fail("Ошибка обновления пароля"))
			return
		}
		updates["password_hash"] = string(hashedPassword)
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
	h.Repository.GetDB().First(&user, currentUserID)

	response := types.UserProfileResponse{
		ID:          user.ID,
		Login:       user.Login,
		IsModerator: user.IsModerator,
	}

	c.JSON(http.StatusOK, gin.H{
		"user":    response,
		"message": "Профиль успешно обновлен",
	})
}
