package types

// Запрос на создание пигмента
type CreatePigmentRequest struct {
    Name        string `json:"name" binding:"required"`
    Brief       string `json:"brief" binding:"required"`
    Description string `json:"description,omitempty"`
    Color       string `json:"color,omitempty"`
    Specs       string `json:"specs,omitempty"`
}

// Запрос на обновление пигмента
type UpdatePigmentRequest struct {
    Name        string `json:"name,omitempty"`
    Brief       string `json:"brief,omitempty"`
    Description string `json:"description,omitempty"`
    Color       string `json:"color,omitempty"`
    Specs       string `json:"specs,omitempty"`
}

// Ответ с пигментом
type PigmentResponse struct {
    ID          uint   `json:"id"`
    Name        string `json:"name"`
    Brief       string `json:"brief"`
    Description string `json:"description,omitempty"`
    Color       string `json:"color,omitempty"`
    Specs       string `json:"specs,omitempty"`
    ImageKey    string `json:"image_key,omitempty"`
    CreatedAt   string `json:"created_at,omitempty"`
}

// Фильтры для списка пигментов
type PigmentFilter struct {
    Search string `form:"search"`
    Color  string `form:"color"`
    DateFrom string `form:"date_from"`
    DateTo   string `form:"date_to"`
    Limit  int    `form:"limit,default=20"`
    Offset int    `form:"offset,default=0"`
}
