package handlers

import (
    "io"
    "net/http"
    "net/url"
    "os"
    "strings"

    "github.com/gin-gonic/gin"
)

// ProxyImage проксирует изображение из публичного MinIO bucket через бэкенд
// GET /api/images/:key
func ProxyImage(c *gin.Context) {
    key := c.Param("key")
    trimmedKey := strings.TrimSpace(key)
    if trimmedKey == "" {
        c.Status(http.StatusBadRequest)
        return
    }

    base := os.Getenv("MINIO_PUBLIC_BASE")
    if base == "" {
        // Фоллбэк: полный путь к bucket'у
        base = "http://localhost:9000/pigments"
    }
    base = strings.TrimRight(base, "/")

    // Безопасно экранируем ключ как часть пути
    // Разрешаем вложенные пути вида foo/bar.jpg
    parts := strings.Split(trimmedKey, "/")
    for i, p := range parts {
        parts[i] = url.PathEscape(p)
    }
    escapedKey := strings.Join(parts, "/")

    targetURL := base + "/" + escapedKey

    resp, err := http.Get(targetURL)
    if err != nil {
        c.Status(http.StatusBadGateway)
        return
    }
    defer resp.Body.Close()

    // Пробрасываем статус и тип контента
    for k, v := range resp.Header {
        if strings.EqualFold(k, "Content-Length") || strings.EqualFold(k, "Content-Type") || strings.EqualFold(k, "Last-Modified") || strings.EqualFold(k, "ETag") || strings.EqualFold(k, "Cache-Control") {
            for _, vv := range v {
                c.Writer.Header().Add(k, vv)
            }
        }
    }
    c.Status(resp.StatusCode)
    io.Copy(c.Writer, resp.Body)
}
