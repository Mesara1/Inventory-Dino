package router

import (
	"inventory-dino/internal/handler"
	"inventory-dino/internal/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(h *handler.Handler, jwtMiddleware gin.HandlerFunc) *gin.Engine {
	r := gin.Default()

	r.Use(corsMiddleware())

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
		}

		categories := protected.Group("/categories")
		{
			categories.GET("", h.ListCategories)
			categories.POST("", middleware.AdminOnly(), h.CreateCategory)
			categories.PUT("/:id", middleware.AdminOnly(), h.UpdateCategory)
			categories.DELETE("/:id", middleware.AdminOnly(), h.DeleteCategory)
		}
	}

	return r
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "http://localhost:3000")
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
