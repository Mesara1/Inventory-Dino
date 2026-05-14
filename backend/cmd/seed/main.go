package main

import (
	"fmt"
	"log"

	"inventory-dino/internal/config"
	"inventory-dino/internal/database"
	"inventory-dino/internal/model"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	cfg := config.Load()
	db := database.Connect(cfg)

	categories := []string{"บรรจุภัณฑ์", "วัตถุดิบ", "อุปกรณ์"}
	for _, name := range categories {
		cat := model.Category{CategoryName: name}
		db.Where("category_name = ?", name).FirstOrCreate(&cat)
	}
	fmt.Println("✓ categories seeded")

	hashed, err := bcrypt.GenerateFromPassword([]byte("admin1234"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}

	admin := model.User{
		Username:  "admin@dinopop.com",
		Password:  string(hashed),
		Firstname: "Admin",
		Lastname:  "Dinopop",
		Role:      model.RoleAdmin,
	}
	result := db.Where("username = ?", admin.Username).FirstOrCreate(&admin)
	if result.Error != nil {
		log.Fatal(result.Error)
	}

	fmt.Println("✓ admin seeded")
	fmt.Println("  username: admin@dinopop.com")
	fmt.Println("  password: admin1234")
	fmt.Println("\n⚠ เปลี่ยน password หลัง login ครั้งแรก")
}
