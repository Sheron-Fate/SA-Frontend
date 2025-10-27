package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type Client struct {
	rdb *redis.Client
}

type SessionData struct {
	UserID      uint   `json:"user_id"`
	Login       string `json:"login"`
	IsModerator bool   `json:"is_moderator"`
	CreatedAt   int64  `json:"created_at"`
}

func NewClient(addr, password string, db int) *Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	return &Client{rdb: rdb}
}

// SetSession сохраняет сессию пользователя
func (c *Client) SetSession(ctx context.Context, sessionID string, sessionData *SessionData, expiration time.Duration) error {
	data, err := json.Marshal(sessionData)
	if err != nil {
		return fmt.Errorf("failed to marshal session data: %w", err)
	}

	return c.rdb.Set(ctx, fmt.Sprintf("session:%s", sessionID), data, expiration).Err()
}

// GetSession получает данные сессии
func (c *Client) GetSession(ctx context.Context, sessionID string) (*SessionData, error) {
	data, err := c.rdb.Get(ctx, fmt.Sprintf("session:%s", sessionID)).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("session not found")
		}
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	var sessionData SessionData
	if err := json.Unmarshal([]byte(data), &sessionData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal session data: %w", err)
	}

	return &sessionData, nil
}

// DeleteSession удаляет сессию
func (c *Client) DeleteSession(ctx context.Context, sessionID string) error {
	return c.rdb.Del(ctx, fmt.Sprintf("session:%s", sessionID)).Err()
}

// AddToBlacklist добавляет токен в blacklist
func (c *Client) AddToBlacklist(ctx context.Context, tokenID string, expiration time.Duration) error {
	return c.rdb.Set(ctx, fmt.Sprintf("blacklist:%s", tokenID), "1", expiration).Err()
}

// IsBlacklisted проверяет, находится ли токен в blacklist
func (c *Client) IsBlacklisted(ctx context.Context, tokenID string) (bool, error) {
	result, err := c.rdb.Exists(ctx, fmt.Sprintf("blacklist:%s", tokenID)).Result()
	if err != nil {
		return false, fmt.Errorf("failed to check blacklist: %w", err)
	}
	return result > 0, nil
}

// GetUserSessions получает все сессии пользователя
func (c *Client) GetUserSessions(ctx context.Context, userID uint) ([]string, error) {
	pattern := fmt.Sprintf("session:*")
	keys, err := c.rdb.Keys(ctx, pattern).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get session keys: %w", err)
	}

	var userSessions []string
	for _, key := range keys {
		data, err := c.rdb.Get(ctx, key).Result()
		if err != nil {
			continue
		}

		var sessionData SessionData
		if err := json.Unmarshal([]byte(data), &sessionData); err != nil {
			continue
		}

		if sessionData.UserID == userID {
			sessionID := key[8:] // убираем префикс "session:"
			userSessions = append(userSessions, sessionID)
		}
	}

	return userSessions, nil
}

// Close закрывает соединение с Redis
func (c *Client) Close() error {
	return c.rdb.Close()
}

// Ping проверяет соединение с Redis
func (c *Client) Ping(ctx context.Context) error {
	return c.rdb.Ping(ctx).Err()
}

// SetRefreshToken сохраняет refresh токен в Redis
func (c *Client) SetRefreshToken(ctx context.Context, userID uint, token string, expiration time.Duration) error {
	key := fmt.Sprintf("refresh_token:%d", userID)
	return c.rdb.Set(ctx, key, token, expiration).Err()
}

// GetRefreshToken получает refresh токен из Redis
func (c *Client) GetRefreshToken(ctx context.Context, userID uint) (string, error) {
	key := fmt.Sprintf("refresh_token:%d", userID)
	return c.rdb.Get(ctx, key).Result()
}

// BlacklistToken добавляет токен в черный список
func (c *Client) BlacklistToken(ctx context.Context, token string, expiration time.Duration) error {
	return c.rdb.Set(ctx, fmt.Sprintf("blacklist:%s", token), true, expiration).Err()
}

// IsTokenBlacklisted проверяет, находится ли токен в черном списке
func (c *Client) IsTokenBlacklisted(ctx context.Context, token string) (bool, error) {
	val, err := c.rdb.Get(ctx, fmt.Sprintf("blacklist:%s", token)).Result()
	if err == redis.Nil {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return val == "true", nil
}
