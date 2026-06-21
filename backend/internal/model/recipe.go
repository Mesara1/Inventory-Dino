package model

import "time"

type Recipe struct {
	RecipeID        uint               `gorm:"primaryKey;autoIncrement" json:"recipe_id"`
	Name            string             `gorm:"unique;not null" json:"name"`
	BagsPerBatch    float64            `gorm:"column:bags_per_batch;not null" json:"bags_per_batch"`
	SalePricePerBag float64            `gorm:"column:sale_price_per_bag;not null" json:"sale_price_per_bag"`
	Ingredients     []RecipeIngredient `gorm:"foreignKey:RecipeID" json:"ingredients,omitempty"`
	CreatedAt       time.Time          `json:"created_at"`
	UpdatedAt       time.Time          `json:"updated_at"`
	DeletedAt       *time.Time         `gorm:"index" json:"-"`
}

type RecipeIngredient struct {
	RecipeIngredientID uint    `gorm:"primaryKey;autoIncrement" json:"recipe_ingredient_id"`
	RecipeID           uint    `gorm:"column:recipe_id;not null" json:"recipe_id"`
	ItemID             uint    `gorm:"column:item_id;not null" json:"item_id"`
	Item               *Item   `gorm:"foreignKey:ItemID" json:"item,omitempty"`
	QuantityG          float64 `gorm:"column:quantity_g;not null" json:"quantity_g"`
}
