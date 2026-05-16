package handler

import (
	"inventory-dino/internal/config"

	"gorm.io/gorm"
)

type Handler struct {
	db  *gorm.DB
	cfg *config.Config
}

func New(db *gorm.DB, cfg *config.Config) *Handler {
	return &Handler{db: db, cfg: cfg}
}

func (h *Handler) AllowedOrigin() string {
	return h.cfg.AllowedOrigin
}
