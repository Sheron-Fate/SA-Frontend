package types

// Базовые структуры ответов как у автора
type SuccessResponse struct {
    Status string      `json:"status"`
    Data   interface{} `json:"data"`
}

type ErrorResponse struct {
    Status  string `json:"status"`
    Message string `json:"message"`
}

func Success(data interface{}) SuccessResponse {
    return SuccessResponse{
        Status: "success",
        Data:   data,
    }
}

func Fail(message string) ErrorResponse {
    return ErrorResponse{
        Status:  "fail", 
        Message: message,
    }
}