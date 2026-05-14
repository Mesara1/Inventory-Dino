package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type ActionType string

const (
	ActionCreateItem     ActionType = "CREATE_ITEM"
	ActionUpdateItem     ActionType = "UPDATE_ITEM"
	ActionDeleteItem     ActionType = "DELETE_ITEM"
	ActionRestoreItem    ActionType = "RESTORE_ITEM"
	ActionCreateUser     ActionType = "CREATE_USER"
	ActionUpdateUser     ActionType = "UPDATE_USER"
	ActionDeactivateUser ActionType = "DEACTIVATE_USER"
	ActionLogin          ActionType = "LOGIN"
	ActionLogout         ActionType = "LOGOUT"
)

type JSONMap map[string]any

func (j JSONMap) Value() (driver.Value, error) {
	return json.Marshal(j)
}

func (j *JSONMap) Scan(value any) error {
	b, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(b, j)
}

type ActivityLog struct {
	ActivityID  uint       `gorm:"primaryKey;autoIncrement" json:"activity_id"`
	UserID      uint       `gorm:"not null" json:"user_id"`
	ItemID      *uint      `json:"item_id"`
	Action      ActionType `gorm:"type:enum('CREATE_ITEM','UPDATE_ITEM','DELETE_ITEM','RESTORE_ITEM','CREATE_USER','UPDATE_USER','DEACTIVATE_USER','LOGIN','LOGOUT');not null" json:"action"`
	Description JSONMap    `gorm:"type:json" json:"description"`
	OldData     JSONMap    `gorm:"type:json" json:"old_data"`
	NewData     JSONMap    `gorm:"type:json" json:"new_data"`
	CreatedAt   time.Time  `json:"created_at"`
}
