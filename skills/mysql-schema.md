# MySQL Schema & Query Patterns

## Updated Schema (ต้อง migrate จาก schema.sql ปัจจุบัน)

### เพิ่ม categories table
```sql
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### อัพเดท items table
```sql
-- เพิ่ม columns ที่ขาด
ALTER TABLE items
    ADD COLUMN unit VARCHAR(50) NOT NULL DEFAULT 'ชิ้น' AFTER item_quantity,
    ADD COLUMN min_quantity INT NOT NULL DEFAULT 0 AFTER unit,
    ADD COLUMN category_id INT NULL AFTER min_quantity,
    ADD CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL;
```

### Full Schema (สำหรับ rebuild ใหม่)
```sql
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    tel VARCHAR(20),
    role ENUM('admin','user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL UNIQUE,
    item_quantity INT NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    min_quantity INT NOT NULL DEFAULT 0,
    category_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

CREATE TABLE activity_logs (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT NULL,
    action ENUM(
        'CREATE_ITEM','UPDATE_ITEM','DELETE_ITEM','RESTORE_ITEM',
        'CREATE_USER','UPDATE_USER','DEACTIVATE_USER',
        'LOGIN','LOGOUT'
    ) NOT NULL,
    description JSON,
    old_data JSON,
    new_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE SET NULL
);
```

## Common Queries

### Dashboard: รายการทั้งหมด + low stock flag
```sql
SELECT
    i.*,
    c.category_name,
    (i.item_quantity <= i.min_quantity) AS is_low_stock
FROM items i
LEFT JOIN categories c ON i.category_id = c.category_id
WHERE i.deleted_at IS NULL
ORDER BY is_low_stock DESC, i.item_name ASC;
```

### Filter by category + low stock
```sql
SELECT i.*, c.category_name
FROM items i
LEFT JOIN categories c ON i.category_id = c.category_id
WHERE i.deleted_at IS NULL
  AND (? IS NULL OR i.category_id = ?)
  AND (? = FALSE OR i.item_quantity <= i.min_quantity)
ORDER BY i.item_name;
```

### Update quantity (ใช้ใน transaction)
```sql
UPDATE items
SET item_quantity = item_quantity + ?
WHERE item_id = ? AND deleted_at IS NULL AND (item_quantity + ?) >= 0;
-- ถ้า affected rows = 0 แสดงว่าจำนวนจะติดลบ
```

## GORM Tips
- ใช้ `gorm:"softDelete"` หรือ `gorm.DeletedAt` สำหรับ users (soft delete)
- items ใช้ hard delete — `db.Unscoped().Delete(&item)` ถ้า embed `gorm.Model`
- ใช้ `db.Transaction()` เสมอเมื่ออัพเดท quantity
