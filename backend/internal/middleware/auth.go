package middleware

import (
	"inventory-dino/pkg/auth"
	"inventory-dino/pkg/response"

	"github.com/gin-gonic/gin"
)

func JWT(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr, err := c.Cookie("token")
		if err != nil {
			response.Unauthorized(c)
			c.Abort()
			return
		}
		claims, err := auth.Parse(tokenStr, secret)
		if err != nil {
			response.Unauthorized(c)
			c.Abort()
			return
		}
		c.Set("claims", claims)
		c.Next()
	}
}

func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims := c.MustGet("claims").(*auth.Claims)
		if claims.Role != "admin" {
			response.Forbidden(c)
			c.Abort()
			return
		}
		c.Next()
	}
}
