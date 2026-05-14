package main

import (
	"log"

	"inventory-dino/internal/config"
	"inventory-dino/internal/database"
	"inventory-dino/internal/handler"
	"inventory-dino/internal/middleware"
	"inventory-dino/internal/router"
)

func main() {
	cfg := config.Load()
	db := database.Connect(cfg)
	h := handler.New(db, cfg)
	r := router.Setup(h, middleware.JWT(cfg.JWTSecret))

	log.Println("server starting on port", cfg.Port)
	log.Fatal(r.Run(":" + cfg.Port))
}
