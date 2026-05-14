package handler

import (
	"net/http"
	"strconv"
	"time"

	"inventory-dino/internal/model"
	"inventory-dino/pkg/auth"
	"inventory-dino/pkg/response"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func (h *Handler) ListUsers(c *gin.Context) {
	var users []model.User
	h.db.Where("deleted_at IS NULL").Order("created_at DESC").Find(&users)
	response.Success(c, users)
}

func (h *Handler) CreateUser(c *gin.Context) {
	var req struct {
		Username  string     `json:"username" binding:"required"`
		Password  string     `json:"password" binding:"required,min=6"`
		Firstname string     `json:"firstname" binding:"required"`
		Lastname  string     `json:"lastname"`
		Tel       string     `json:"tel"`
		Role      model.Role `json:"role"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		response.InternalError(c)
		return
	}

	role := req.Role
	if role == "" {
		role = model.RoleUser
	}

	user := model.User{
		Username:  req.Username,
		Password:  string(hashed),
		Firstname: req.Firstname,
		Lastname:  req.Lastname,
		Tel:       req.Tel,
		Role:      role,
	}
	if err := h.db.Create(&user).Error; err != nil {
		response.Error(c, http.StatusConflict, "username already exists")
		return
	}

	claims := c.MustGet("claims").(*auth.Claims)
	h.writeLog(claims.UserID, nil, model.ActionCreateUser, nil, model.JSONMap{
		"username": user.Username,
		"role":     string(user.Role),
	})

	response.Created(c, user)
}

func (h *Handler) GetUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	claims := c.MustGet("claims").(*auth.Claims)
	if claims.Role != "admin" && claims.UserID != uint(id) {
		response.Forbidden(c)
		return
	}

	var user model.User
	if err := h.db.Where("user_id = ? AND deleted_at IS NULL", id).First(&user).Error; err != nil {
		response.NotFound(c)
		return
	}
	response.Success(c, user)
}

func (h *Handler) UpdateUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	claims := c.MustGet("claims").(*auth.Claims)
	if claims.Role != "admin" && claims.UserID != uint(id) {
		response.Forbidden(c)
		return
	}

	var user model.User
	if err := h.db.Where("user_id = ? AND deleted_at IS NULL", id).First(&user).Error; err != nil {
		response.NotFound(c)
		return
	}

	var req struct {
		Firstname string `json:"firstname"`
		Lastname  string `json:"lastname"`
		Tel       string `json:"tel"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	oldData := model.JSONMap{
		"firstname": user.Firstname,
		"lastname":  user.Lastname,
		"tel":       user.Tel,
	}

	h.db.Model(&user).Updates(map[string]any{
		"firstname": req.Firstname,
		"lastname":  req.Lastname,
		"tel":       req.Tel,
	})
	h.db.First(&user, user.UserID)

	h.writeLog(claims.UserID, nil, model.ActionUpdateUser, oldData, model.JSONMap{
		"firstname": req.Firstname,
		"lastname":  req.Lastname,
		"tel":       req.Tel,
	})

	response.Success(c, user)
}

func (h *Handler) ChangePassword(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	claims := c.MustGet("claims").(*auth.Claims)
	if claims.Role != "admin" && claims.UserID != uint(id) {
		response.Forbidden(c)
		return
	}

	var req struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	var user model.User
	if err := h.db.Where("user_id = ? AND deleted_at IS NULL", id).First(&user).Error; err != nil {
		response.NotFound(c)
		return
	}

	if claims.Role != "admin" {
		if req.CurrentPassword == "" {
			response.BadRequest(c, "current_password required")
			return
		}
		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
			response.Error(c, http.StatusUnauthorized, "current password is incorrect")
			return
		}
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		response.InternalError(c)
		return
	}

	h.db.Model(&user).Update("password", string(hashed))
	response.Success(c, nil)
}

func (h *Handler) DeactivateUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	claims := c.MustGet("claims").(*auth.Claims)
	if claims.Role != "admin" && claims.UserID != uint(id) {
		response.Forbidden(c)
		return
	}

	var user model.User
	if err := h.db.Where("user_id = ? AND deleted_at IS NULL", id).First(&user).Error; err != nil {
		response.NotFound(c)
		return
	}

	if user.Role == model.RoleAdmin {
		var adminCount int64
		h.db.Model(&model.User{}).Where("role = 'admin' AND deleted_at IS NULL").Count(&adminCount)
		if adminCount <= 1 {
			response.Error(c, http.StatusBadRequest, "cannot deactivate the last admin account")
			return
		}
	}

	now := time.Now()
	h.db.Model(&user).Update("deleted_at", &now)

	h.writeLog(claims.UserID, nil, model.ActionDeactivateUser, model.JSONMap{
		"username": user.Username,
	}, nil)

	response.Success(c, nil)
}
