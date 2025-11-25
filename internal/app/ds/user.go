package ds

type User struct {
    ID           uint   `gorm:"primaryKey;autoIncrement"`
    Login        string `gorm:"unique"`
    PasswordHash string
    IsModerator  bool
}