package main

import (
	"fmt"
	"log"

	"inventory-dino/internal/config"
	"inventory-dino/internal/database"
	"inventory-dino/internal/model"

	"golang.org/x/crypto/bcrypt"
)

type itemSeed struct {
	name     string
	qty      int
	unit     string
	min      int
	category string
}

func main() {
	cfg := config.Load()
	db := database.Connect(cfg)

	categoryNames := []string{"วัตถุดิบ", "บรรจุภัณฑ์", "อุปกรณ์", "ของแต่งรส", "สินค้าสำเร็จรูป"}
	catMap := map[string]uint{}
	for _, name := range categoryNames {
		cat := model.Category{CategoryName: name}
		db.Where("category_name = ?", name).FirstOrCreate(&cat)
		catMap[name] = cat.CategoryID
	}
	fmt.Println("✓ categories seeded")

	items := []itemSeed{
		// วัตถุดิบ
		{"ข้าวโพดดิบ", 150, "กก.", 50, "วัตถุดิบ"},
		{"น้ำตาลทราย", 80, "กก.", 30, "วัตถุดิบ"},
		{"เนยสด", 25, "กก.", 10, "วัตถุดิบ"},
		{"น้ำมันพืช", 40, "ลิตร", 15, "วัตถุดิบ"},
		{"เกลือป่น", 20, "กก.", 8, "วัตถุดิบ"},
		{"นมข้นหวาน", 60, "กระป๋อง", 20, "วัตถุดิบ"},
		{"ช็อกโกแลตผง", 12, "กก.", 5, "วัตถุดิบ"},
		{"ผงมัทฉะ", 8, "กก.", 3, "วัตถุดิบ"},
		// ของแต่งรส
		{"ซอสคาราเมล", 30, "ขวด", 10, "ของแต่งรส"},
		{"ซอสสตรอว์เบอร์รี", 18, "ขวด", 8, "ของแต่งรส"},
		{"ผงชีส", 15, "กก.", 5, "ของแต่งรส"},
		{"ผงบาร์บีคิว", 10, "กก.", 4, "ของแต่งรส"},
		{"ผงนมวานิลลา", 14, "กก.", 5, "ของแต่งรส"},
		{"ซอสบัตเตอร์สก็อต", 7, "ขวด", 5, "ของแต่งรส"},
		// บรรจุภัณฑ์
		{"ถุงซิปขนาดเล็ก (100g)", 500, "ใบ", 200, "บรรจุภัณฑ์"},
		{"ถุงซิปขนาดกลาง (200g)", 350, "ใบ", 150, "บรรจุภัณฑ์"},
		{"ถุงซิปขนาดใหญ่ (500g)", 200, "ใบ", 100, "บรรจุภัณฑ์"},
		{"กล่องของขวัญขนาด S", 80, "กล่อง", 40, "บรรจุภัณฑ์"},
		{"กล่องของขวัญขนาด M", 60, "กล่อง", 30, "บรรจุภัณฑ์"},
		{"กล่องของขวัญขนาด L", 40, "กล่อง", 20, "บรรจุภัณฑ์"},
		{"สติ๊กเกอร์โลโก้", 1000, "แผ่น", 300, "บรรจุภัณฑ์"},
		{"ริบบิ้นตกแต่ง", 25, "ม้วน", 10, "บรรจุภัณฑ์"},
		{"ถุงกระดาษหูหิ้ว", 150, "ใบ", 80, "บรรจุภัณฑ์"},
		// อุปกรณ์
		{"ถุงมือยาง (กล่อง)", 8, "กล่อง", 3, "อุปกรณ์"},
		{"หมวกคลุมผม", 30, "ใบ", 10, "อุปกรณ์"},
		{"ผ้ากันเปื้อน", 5, "ผืน", 2, "อุปกรณ์"},
		{"กระดาษซับมัน", 200, "แผ่น", 100, "อุปกรณ์"},
		{"ไม้พาย (อันใหญ่)", 4, "อัน", 2, "อุปกรณ์"},
		// สินค้าสำเร็จรูป
		{"ป็อปคอร์นคาราเมล (สำเร็จ)", 45, "ถุง", 20, "สินค้าสำเร็จรูป"},
		{"ป็อปคอร์นเนย (สำเร็จ)", 38, "ถุง", 20, "สินค้าสำเร็จรูป"},
		{"ป็อปคอร์นมัทฉะ (สำเร็จ)", 12, "ถุง", 15, "สินค้าสำเร็จรูป"},
		{"ป็อปคอร์นชีส (สำเร็จ)", 20, "ถุง", 15, "สินค้าสำเร็จรูป"},
	}

	for _, s := range items {
		catID := catMap[s.category]
		item := model.Item{
			ItemName:    s.name,
			ItemQty:     s.qty,
			Unit:        s.unit,
			MinQuantity: s.min,
			CategoryID:  &catID,
		}
		db.Where("item_name = ?", s.name).FirstOrCreate(&item)
	}
	fmt.Printf("✓ %d items seeded\n", len(items))

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
