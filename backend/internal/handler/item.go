package handler

import (
	"errors"
	"net/http"
	"strconv"

	"inventory-dino/internal/model"
	"inventory-dino/pkg/auth"
	"inventory-dino/pkg/response"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type itemResponse struct {
	model.Item
	IsLowStock bool `json:"is_low_stock"`
}

func toItemResponse(item model.Item) itemResponse {
	return itemResponse{Item: item, IsLowStock: item.IsLowStock()}
}

func toItemResponses(items []model.Item) []itemResponse {
	result := make([]itemResponse, len(items))
	for i, item := range items {
		result[i] = toItemResponse(item)
	}
	return result
}

func (h *Handler) ListItems(c *gin.Context) {
	search := c.Query("search")
	categoryID := c.Query("category_id")
	lowStock := c.Query("low_stock") == "true"

	orderMap := map[string]string{
		"name":     "item_name ASC",
		"quantity": "item_quantity ASC",
		"category": "category_id ASC, item_name ASC",
	}
	order, ok := orderMap[c.DefaultQuery("sort", "name")]
	if !ok {
		order = "item_name ASC"
	}

	query := h.db.Preload("Category").Where("deleted_at IS NULL")
	if search != "" {
		query = query.Where("item_name LIKE ?", "%"+search+"%")
	}
	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}
	if lowStock {
		query = query.Where("item_quantity <= min_quantity")
	}

	var items []model.Item
	query.Order(order).Find(&items)
	response.Success(c, toItemResponses(items))
}

func (h *Handler) CreateItem(c *gin.Context) {
	var req struct {
		ItemName    string `json:"item_name" binding:"required"`
		ItemQty     int    `json:"item_quantity"`
		Unit        string `json:"unit" binding:"required"`
		MinQuantity int    `json:"min_quantity"`
		CategoryID  *uint  `json:"category_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	if req.ItemQty < 0 || req.MinQuantity < 0 {
		response.BadRequest(c, "quantity cannot be negative")
		return
	}

	item := model.Item{
		ItemName:    req.ItemName,
		ItemQty:     req.ItemQty,
		Unit:        req.Unit,
		MinQuantity: req.MinQuantity,
		CategoryID:  req.CategoryID,
	}
	if err := h.db.Create(&item).Error; err != nil {
		response.Error(c, http.StatusConflict, "item name already exists")
		return
	}
	h.db.Preload("Category").First(&item, item.ItemID)

	claims := c.MustGet("claims").(*auth.Claims)
	h.writeLog(claims.UserID, &item.ItemID, model.ActionCreateItem, nil, model.JSONMap{
		"item_name": item.ItemName,
		"unit":      item.Unit,
	})

	response.Created(c, toItemResponse(item))
}

func (h *Handler) UpdateItem(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var item model.Item
	if err := h.db.Where("item_id = ? AND deleted_at IS NULL", id).First(&item).Error; err != nil {
		response.NotFound(c)
		return
	}

	var req struct {
		ItemName    string `json:"item_name" binding:"required"`
		ItemQty     int    `json:"item_quantity"`
		Unit        string `json:"unit" binding:"required"`
		MinQuantity int    `json:"min_quantity"`
		CategoryID  *uint  `json:"category_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	if req.ItemQty < 0 || req.MinQuantity < 0 {
		response.BadRequest(c, "quantity cannot be negative")
		return
	}

	oldData := model.JSONMap{
		"item_name":     item.ItemName,
		"item_quantity": item.ItemQty,
		"unit":          item.Unit,
		"min_quantity":  item.MinQuantity,
	}

	if err := h.db.Model(&item).Updates(map[string]any{
		"item_name":     req.ItemName,
		"item_quantity": req.ItemQty,
		"unit":          req.Unit,
		"min_quantity":  req.MinQuantity,
		"category_id":   req.CategoryID,
	}).Error; err != nil {
		response.Error(c, http.StatusConflict, "item name already exists")
		return
	}
	h.db.Preload("Category").First(&item, item.ItemID)

	claims := c.MustGet("claims").(*auth.Claims)
	h.writeLog(claims.UserID, &item.ItemID, model.ActionUpdateItem, oldData, model.JSONMap{
		"item_name":     req.ItemName,
		"item_quantity": req.ItemQty,
		"unit":          req.Unit,
		"min_quantity":  req.MinQuantity,
	})

	response.Success(c, toItemResponse(item))
}

var errNegativeQty = errors.New("quantity cannot be negative")

func (h *Handler) UpdateItemQuantity(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var req struct {
		Delta int `json:"delta"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	if req.Delta == 0 {
		response.BadRequest(c, "delta cannot be zero")
		return
	}

	var item model.Item
	txErr := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("item_id = ? AND deleted_at IS NULL", id).
			First(&item).Error; err != nil {
			return err
		}
		newQty := item.ItemQty + req.Delta
		if newQty < 0 {
			return errNegativeQty
		}
		return tx.Model(&item).Update("item_quantity", newQty).Error
	})

	if txErr != nil {
		if errors.Is(txErr, errNegativeQty) {
			response.BadRequest(c, "quantity cannot be negative")
			return
		}
		response.NotFound(c)
		return
	}

	oldQty := item.ItemQty
	h.db.Preload("Category").First(&item, item.ItemID)

	claims := c.MustGet("claims").(*auth.Claims)
	h.writeLog(claims.UserID, &item.ItemID, model.ActionUpdateItem,
		model.JSONMap{"item_quantity": oldQty},
		model.JSONMap{"item_quantity": item.ItemQty},
	)

	response.Success(c, toItemResponse(item))
}

func (h *Handler) DeleteItem(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var req struct {
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "password required")
		return
	}

	claims := c.MustGet("claims").(*auth.Claims)
	var admin model.User
	if err := h.db.First(&admin, claims.UserID).Error; err != nil {
		response.InternalError(c)
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(req.Password)); err != nil {
		response.Error(c, http.StatusUnauthorized, "incorrect password")
		return
	}

	var item model.Item
	if err := h.db.Where("item_id = ? AND deleted_at IS NULL", id).First(&item).Error; err != nil {
		response.NotFound(c)
		return
	}

	// เขียน log ก่อน delete เพราะหลัง delete แล้ว FK จะ reject
	h.writeLog(claims.UserID, &item.ItemID, model.ActionDeleteItem, model.JSONMap{
		"item_name": item.ItemName,
	}, nil)

	h.db.Delete(&item)

	response.Success(c, nil)
}
