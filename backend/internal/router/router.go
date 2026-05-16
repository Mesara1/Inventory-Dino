package router

import (
	"strings"

	"inventory-dino/internal/handler"
	"inventory-dino/internal/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(h *handler.Handler, jwtMiddleware gin.HandlerFunc) *gin.Engine {
	r := gin.Default()

	r.Use(corsMiddleware(h.AllowedOrigin()))

	v1 := r.Group("/api/v1")

	v1.POST("/auth/login", h.Login)

	protected := v1.Group("/")
	protected.Use(jwtMiddleware)
	{
		protected.POST("/auth/logout", h.Logout)
		protected.GET("/auth/me", h.Me)

		users := protected.Group("/users")
		{
			users.GET("", middleware.AdminOnly(), h.ListUsers)
			users.POST("", middleware.AdminOnly(), h.CreateUser)
			users.GET("/:id", h.GetUser)
			users.PUT("/:id", h.UpdateUser)
			users.PATCH("/:id/password", h.ChangePassword)
			users.DELETE("/:id", h.DeactivateUser)
			users.DELETE("/:id/permanent", middleware.AdminOnly(), h.PermanentDeleteUser)
		}

		categories := protected.Group("/categories")
		{
			categories.GET("", h.ListCategories)
			categories.POST("", middleware.AdminOnly(), h.CreateCategory)
			categories.PUT("/:id", middleware.AdminOnly(), h.UpdateCategory)
			categories.DELETE("/:id", middleware.AdminOnly(), h.DeleteCategory)
		}

		items := protected.Group("/items")
		{
			items.GET("", h.ListItems)
			items.POST("", middleware.AdminOnly(), h.CreateItem)
			items.PUT("/:id", middleware.AdminOnly(), h.UpdateItem)
			items.PATCH("/:id/quantity", h.UpdateItemQuantity)
			items.DELETE("/:id", middleware.AdminOnly(), h.DeleteItem)
		}
	}

	return r
}

func corsMiddleware(allowedOrigin string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		// Dev: อนุญาตทุก origin ที่มาจาก port 3000 (รองรับ LAN mobile)
		if origin != "" && strings.HasSuffix(origin, ":3000") {
			c.Header("Access-Control-Allow-Origin", origin)
		} else {
			c.Header("Access-Control-Allow-Origin", allowedOrigin)
		}
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
