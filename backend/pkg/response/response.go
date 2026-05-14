package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Success(c *gin.Context, data any) {
	c.JSON(http.StatusOK, gin.H{"data": data, "message": "success"})
}

func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, gin.H{"data": data, "message": "created"})
}

func Error(c *gin.Context, status int, msg string) {
	c.JSON(status, gin.H{"data": nil, "error": msg})
}

func BadRequest(c *gin.Context, msg string) {
	Error(c, http.StatusBadRequest, msg)
}

func Unauthorized(c *gin.Context) {
	Error(c, http.StatusUnauthorized, "unauthorized")
}

func Forbidden(c *gin.Context) {
	Error(c, http.StatusForbidden, "forbidden")
}

func NotFound(c *gin.Context) {
	Error(c, http.StatusNotFound, "not found")
}

func InternalError(c *gin.Context) {
	Error(c, http.StatusInternalServerError, "internal server error")
}
