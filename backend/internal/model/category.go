package model

import "time"

type Category struct {
	CategoryID   uint      `gorm:"primaryKey;autoIncrement" json:"category_id"`
	CategoryName string    `gorm:"unique;not null" json:"category_name"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
