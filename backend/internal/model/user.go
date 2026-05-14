package model

import "time"

type Role string

const (
	RoleAdmin Role = "admin"
	RoleUser  Role = "user"
)

type User struct {
	UserID    uint       `gorm:"primaryKey;autoIncrement" json:"user_id"`
	Username  string     `gorm:"unique;not null" json:"username"`
	Password  string     `gorm:"not null" json:"-"`
	Firstname string     `json:"firstname"`
	Lastname  string     `json:"lastname"`
	Tel       string     `json:"tel"`
	Role      Role       `gorm:"type:enum('admin','user');not null;default:'user'" json:"role"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `gorm:"index" json:"-"`
}
