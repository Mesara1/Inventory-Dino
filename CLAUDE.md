# Dinopop Corn Inventory — CLAUDE.md

## Skill Routing
อ่าน `skills/router.md` ก่อนเริ่มงานทุกครั้ง — ไฟล์นี้กำหนดว่า context ไหนต้องใช้ skill อะไร และต้องรีวิวอะไรตอนท้าย session

## Project Context
ระบบ Inventory Management สำหรับร้าน **Dinopop Corn แจ้งวัฒนะปากเกร็ด 19**
ใช้ติดตามวัตถุดิบและสต็อกสินค้าภายในร้าน — ระบบใช้งานภายในร้านเดียว คนกรอกข้อมูลเอง

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (TypeScript) + Tailwind CSS |
| Backend | Go + Gin framework |
| Database | MySQL 8.0 (Docker) |
| Auth | JWT (httpOnly cookie) |
| Container | Docker Compose |

## Project Structure
```
inventory-dino/
├── backend/          # Go + Gin REST API
│   ├── cmd/
│   ├── internal/
│   │   ├── handler/
│   │   ├── service/
│   │   ├── repository/
│   │   └── middleware/
│   └── main.go
├── frontend/         # Next.js app
│   ├── app/
│   ├── components/
│   └── lib/
├── database/         # SQL schema / migrations
├── skills/           # Technical reference docs
└── docker-compose.yml
```

## Roles & Permissions
| Action | Admin | User |
|--------|:-----:|:----:|
| Create item | ✅ | ❌ |
| Edit item (ชื่อ / unit / category / threshold) | ✅ | ❌ |
| Update item quantity (+/-) | ✅ | ✅ |
| Delete item | ✅ | ❌ |
| Manage categories | ✅ | ❌ |
| Manage user accounts | ✅ | ❌ |
| View dashboard | ✅ | ✅ |
| ปิด account ตัวเอง | ✅ | ✅ |

## Key Business Rules
- Item quantity >= 0 — ห้ามลดต่ำกว่า 0 เด็ดขาด
- Item name ต้อง unique (case-insensitive)
- User delete = soft delete (`deleted_at`) เท่านั้น
- Delete item ต้องยืนยัน password ก่อนทุกครั้ง
- Low stock = `quantity <= min_quantity` ต่อ item
- Activity logs: เขียนลง DB เท่านั้น ไม่มี UI แสดง
- Password ต้อง hash ด้วย bcrypt ก่อน store

## Database Schema
ดูรายละเอียดที่ `database/schema.sql`

**Tables:**
- `users` — user accounts (soft delete via `deleted_at`)
- `items` — inventory items + `unit`, `min_quantity`, `category_id`
- `categories` — item categories
- `activity_logs` — audit trail

**หมายเหตุ:** schema.sql ปัจจุบันยังไม่มี `categories` table และ `unit`, `min_quantity`, `category_id` ใน `items` — ต้องเพิ่มก่อน

## API Design Convention
- Base path: `/api/v1`
- Auth: JWT ใน `Authorization: Bearer <token>` header
- Response format:
  ```json
  { "data": ..., "message": "success" }
  { "error": "...", "message": "error detail" }
  ```
- Naming: snake_case สำหรับ JSON keys

## Naming Conventions
- **Go (backend):** PascalCase สำหรับ types/structs, camelCase สำหรับ local variables, snake_case สำหรับ JSON tags
- **TypeScript (frontend):** PascalCase สำหรับ components, camelCase สำหรับ functions/variables
- **SQL:** snake_case ทุก column/table

## Development Notes
- ใช้ Docker Compose สำหรับ MySQL — `docker-compose up -d`
- ไม่ต้องทำ multi-branch / multi-store
- ไม่ต้องทำ push notification หรือ email alert
- Activity Log UI ไม่ต้องทำ (out of scope)
