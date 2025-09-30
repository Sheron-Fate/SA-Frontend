package ds

import "gorm.io/gorm"

type Pigment struct {
    ID          uint   `gorm:"primaryKey;autoIncrement"`
    Name        string
    Brief       string
    Description string
    ImageKey    string
    Color       string
    Specs       string
    CreatedAt   gorm.DeletedAt
    UpdatedAt   gorm.DeletedAt
}