package model

import "time"

type Item struct {
	ItemID      uint       `gorm:"primaryKey;autoIncrement" json:"item_id"`
	ItemName    string     `gorm:"unique;not null" json:"item_name"`
	ItemQty     int        `gorm:"column:item_quantity;not null;default:0" json:"item_quantity"`
	Unit        string     `gorm:"not null" json:"unit"`
	MinQuantity int        `gorm:"not null;default:0" json:"min_quantity"`
	CategoryID  *uint      `json:"category_id"`
	Category    *Category  `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `gorm:"index" json:"-"`
}

func (i *Item) IsLowStock() bool {
	return i.ItemQty <= i.MinQuantity
}
