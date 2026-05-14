package main

import (
	"log"
	"net/http"

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

	// Serve frontend on port 3000
	go func() {
		fs := http.FileServer(http.Dir("../frontend"))
		log.Println("frontend serving on http://localhost:3000")
		if err := http.ListenAndServe(":3000", fs); err != nil {
			log.Fatal("frontend server error:", err)
		}
	}()

	log.Println("API server starting on port", cfg.Port)
	log.Fatal(r.Run(":" + cfg.Port))
}
