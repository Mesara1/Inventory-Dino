package handler

import "inventory-dino/internal/model"

func (h *Handler) writeLog(userID uint, itemID *uint, action model.ActionType, oldData, newData model.JSONMap) {
	h.db.Create(&model.ActivityLog{
		UserID:  userID,
		ItemID:  itemID,
		Action:  action,
		OldData: oldData,
		NewData: newData,
	})
}
