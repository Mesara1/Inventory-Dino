package handler

import (
	"net/http"
	"strconv"

	"inventory-dino/internal/model"
	"inventory-dino/pkg/auth"
	"inventory-dino/pkg/response"

	"github.com/gin-gonic/gin"
)

func (h *Handler) ListCategories(c *gin.Context) {
	var categories []model.Category
	h.db.Order("category_name ASC").Find(&categories)
	response.Success(c, categories)
}

func (h *Handler) CreateCategory(c *gin.Context) {
	var req struct {
		CategoryName string `json:"category_name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	category := model.Category{CategoryName: req.CategoryName}
	if err := h.db.Create(&category).Error; err != nil {
		response.Error(c, http.StatusConflict, "category name already exists")
		return
	}

	claims := c.MustGet("claims").(*auth.Claims)
	h.writeLog(claims.UserID, nil, model.ActionCreateItem, nil, model.JSONMap{
		"category_name": category.CategoryName,
	})

	response.Created(c, category)
}

func (h *Handler) UpdateCategory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var category model.Category
	if err := h.db.First(&category, id).Error; err != nil {
		response.NotFound(c)
		return
	}

	var req struct {
		CategoryName string `json:"category_name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	oldName := category.CategoryName
	if err := h.db.Model(&category).Update("category_name", req.CategoryName).Error; err != nil {
		response.Error(c, http.StatusConflict, "category name already exists")
		return
	}

	claims := c.MustGet("claims").(*auth.Claims)
	h.writeLog(claims.UserID, nil, model.ActionUpdateItem, model.JSONMap{
		"category_name": oldName,
	}, model.JSONMap{
		"category_name": req.CategoryName,
	})

	response.Success(c, category)
}

func (h *Handler) DeleteCategory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var category model.Category
	if err := h.db.First(&category, id).Error; err != nil {
		response.NotFound(c)
		return
	}

	var itemCount int64
	h.db.Model(&model.Item{}).Where("category_id = ? AND deleted_at IS NULL", id).Count(&itemCount)
	if itemCount > 0 {
		response.Error(c, http.StatusBadRequest, "cannot delete category with existing items")
		return
	}

	h.db.Delete(&category)

	claims := c.MustGet("claims").(*auth.Claims)
	h.writeLog(claims.UserID, nil, model.ActionDeleteItem, model.JSONMap{
		"category_name": category.CategoryName,
	}, nil)

	response.Success(c, nil)
}
