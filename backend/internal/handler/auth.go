package handler

import (
	"net/http"

	"inventory-dino/internal/model"
	"inventory-dino/pkg/auth"
	"inventory-dino/pkg/response"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *Handler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "username and password required")
		return
	}

	var user model.User
	if err := h.db.Where("username = ? AND deleted_at IS NULL", req.Username).First(&user).Error; err != nil {
		response.Error(c, http.StatusUnauthorized, "invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		response.Error(c, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := auth.Sign(user.UserID, string(user.Role), h.cfg.JWTSecret)
	if err != nil {
		response.InternalError(c)
		return
	}

	c.SetCookie("token", token, 86400, "/", "", false, true)
	response.Success(c, gin.H{
		"user_id":   user.UserID,
		"username":  user.Username,
		"firstname": user.Firstname,
		"lastname":  user.Lastname,
		"role":      user.Role,
	})
}

func (h *Handler) Logout(c *gin.Context) {
	c.SetCookie("token", "", -1, "/", "", false, true)
	response.Success(c, nil)
}

func (h *Handler) Me(c *gin.Context) {
	claims := c.MustGet("claims").(*auth.Claims)

	var user model.User
	if err := h.db.First(&user, claims.UserID).Error; err != nil {
		response.NotFound(c)
		return
	}

	response.Success(c, gin.H{
		"user_id":   user.UserID,
		"username":  user.Username,
		"firstname": user.Firstname,
		"lastname":  user.Lastname,
		"tel":       user.Tel,
		"role":      user.Role,
	})
}
