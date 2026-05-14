# Go + Gin REST API Patterns

## Project Setup
```bash
go mod init inventory-dino/backend
go get github.com/gin-gonic/gin
go get gorm.io/gorm
go get gorm.io/driver/mysql
go get github.com/golang-jwt/jwt/v5
go get golang.org/x/crypto
```

## Folder Structure
```
backend/
├── cmd/main.go
├── internal/
│   ├── config/       # env config
│   ├── handler/      # HTTP handlers (thin layer)
│   ├── service/      # business logic
│   ├── repository/   # DB queries
│   ├── middleware/   # JWT auth, CORS, etc.
│   └── model/        # GORM models + request/response structs
└── pkg/              # shared utilities
```

## Response Helper
```go
// pkg/response/response.go
func Success(c *gin.Context, data any) {
    c.JSON(http.StatusOK, gin.H{"data": data, "message": "success"})
}

func Error(c *gin.Context, status int, msg string) {
    c.JSON(status, gin.H{"error": msg, "message": msg})
}
```

## Router Setup
```go
func SetupRouter(h *handler.Handler, authMiddleware gin.HandlerFunc) *gin.Engine {
    r := gin.Default()
    v1 := r.Group("/api/v1")

    v1.POST("/auth/login", h.Login)

    auth := v1.Group("/")
    auth.Use(authMiddleware)
    {
        auth.GET("/items", h.ListItems)
        auth.POST("/items", h.AdminOnly(), h.CreateItem)
        auth.PATCH("/items/:id/quantity", h.UpdateQuantity)
        auth.PUT("/items/:id", h.AdminOnly(), h.UpdateItem)
        auth.DELETE("/items/:id", h.AdminOnly(), h.DeleteItem)
    }
    return r
}
```

## GORM Model Example
```go
type Item struct {
    ItemID      uint           `gorm:"primaryKey;autoIncrement" json:"item_id"`
    ItemName    string         `gorm:"unique;not null" json:"item_name"`
    ItemQty     int            `gorm:"default:0" json:"item_quantity"`
    Unit        string         `gorm:"not null" json:"unit"`
    MinQuantity int            `gorm:"default:0" json:"min_quantity"`
    CategoryID  uint           `json:"category_id"`
    CreatedAt   time.Time      `json:"created_at"`
    UpdatedAt   time.Time      `json:"updated_at"`
    DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}
```

## Prevent Negative Quantity
```go
// ใช้ DB transaction + row lock เพื่อป้องกัน race condition
func (r *itemRepo) UpdateQuantity(id uint, delta int) error {
    return r.db.Transaction(func(tx *gorm.DB) error {
        var item Item
        if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&item, id).Error; err != nil {
            return err
        }
        newQty := item.ItemQty + delta
        if newQty < 0 {
            return errors.New("quantity cannot be negative")
        }
        return tx.Model(&item).Update("item_quantity", newQty).Error
    })
}
```

## Middleware: Admin Only
```go
func AdminOnly() gin.HandlerFunc {
    return func(c *gin.Context) {
        claims := c.MustGet("claims").(*JWTClaims)
        if claims.Role != "admin" {
            response.Error(c, http.StatusForbidden, "admin only")
            c.Abort()
            return
        }
        c.Next()
    }
}
```
