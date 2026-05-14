package router

import (
	"inventory-dino/internal/handler"
	"inventory-dino/internal/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(h *handler.Handler, jwtMiddleware gin.HandlerFunc) *gin.Engine {
	r := gin.Default()

	r.Static("/", "../frontend")

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
