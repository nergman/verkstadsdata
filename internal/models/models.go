package models

import "time"

type User struct {
    ID           int       `json:"id"`
    Username     string    `json:"username"`
    Email        string    `json:"email"`
    PasswordHash string    `json:"-"`
    IsPremium    bool      `json:"is_premium"`
    CreatedAt    time.Time `json:"created_at"`
}

type SavedTool struct {
    ID             int       `json:"id"`
    UserID         int       `json:"user_id"`
    ToolName       string    `json:"tool_name"`
    ToolData       string    `json:"tool_data"`
    CalculatorType string    `json:"calculator_type"`
    CreatedAt      time.Time `json:"created_at"`
}
