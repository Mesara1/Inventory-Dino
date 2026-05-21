# Dinopop Corn Inventory — Maintenance & Development Guide

ระบบ Inventory Management สำหรับร้าน **Dinopop Corn แจ้งวัฒนะปากเกร็ด 19**

---

## ภาพรวมระบบ

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS + HTML (SPA) |
| Backend | Go 1.22 + Gin framework |
| Database | MySQL 8.0 |
| Container | Docker Compose |
| Web Server | Nginx (reverse proxy) |
| Host | Oracle Cloud VM (Ubuntu 22.04, ARM A1.Flex) |

**App URL:** http://dinopop19.duckdns.org

---

## การเข้าถึง Server

ต้องมี SSH private key จาก owner ของ project ก่อน

```bash
ssh -i /path/to/private.key ubuntu@161.118.208.161
```

---

## โครงสร้างโปรเจค

```
Inventory-Dino/
├── backend/              # Go + Gin REST API
│   ├── cmd/
│   │   ├── main.go       # entry point
│   │   └── seed/main.go  # seed admin user
│   ├── internal/
│   │   ├── config/       # env config loader
│   │   ├── handler/      # HTTP handlers
│   │   ├── middleware/   # JWT auth, CORS
│   │   ├── model/        # GORM models
│   │   └── router/       # route definitions
│   └── pkg/
│       ├── auth/         # JWT helper
│       └── response/     # response helper
├── frontend/             # Static SPA
│   ├── index.html
│   ├── app.jsx           # main app logic
│   ├── pages.jsx         # page components
│   ├── modals.jsx        # modal components
│   ├── api.js            # API client
│   └── manifest.json     # PWA manifest
├── database/
│   └── schema.sql        # MySQL schema
├── scripts/
│   ├── setup-server.sh   # ติดตั้ง Docker (รันครั้งแรก)
│   └── deploy.sh         # deploy / update app
├── docker-compose.yml        # local dev
├── docker-compose.prod.yml   # production
└── nginx.conf                # nginx config
```

---

## API Endpoints

Base path: `/api/v1`

| Method | Path | Auth | Role |
|--------|------|------|------|
| POST | `/auth/login` | ❌ | — |
| POST | `/auth/logout` | ✅ | any |
| GET | `/items` | ✅ | any |
| POST | `/items` | ✅ | admin |
| PUT | `/items/:id` | ✅ | admin |
| PATCH | `/items/:id/quantity` | ✅ | any |
| DELETE | `/items/:id` | ✅ | admin |
| GET | `/categories` | ✅ | any |
| POST | `/categories` | ✅ | admin |
| PUT | `/categories/:id` | ✅ | admin |
| DELETE | `/categories/:id` | ✅ | admin |
| GET | `/users` | ✅ | admin |
| POST | `/users` | ✅ | admin |
| PUT | `/users/:id` | ✅ | admin |
| DELETE | `/users/:id` | ✅ | admin |
| DELETE | `/users/:id/permanent` | ✅ | admin |

---

## การ Deploy / อัปเดต

### อัปเดต App (push code ใหม่แล้ว)
```bash
ssh -i "SSH-keys/ssh-key-2026-05-21.key" ubuntu@161.118.208.161
cd ~/Inventory-Dino
git pull origin main
# ถ้าแก้ frontend อย่างเดียว: Nginx serve ทันที ไม่ต้อง rebuild
# ถ้าแก้ backend: ต้อง rebuild
docker compose -f docker-compose.prod.yml up -d --build
```

### ดูสถานะ Containers
```bash
docker compose -f docker-compose.prod.yml ps
```

### ดู Logs
```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx
```

### Restart Service
```bash
docker compose -f docker-compose.prod.yml restart backend
```

---

## การพัฒนา Local

### Prerequisites
- Docker Desktop
- Go 1.22+
- Node.js (optional, frontend เป็น vanilla JS)

### Run Local
```bash
# Start MySQL
docker-compose up -d

# Run backend
cd backend
cp .env.example .env
# แก้ .env ให้ตรงกับ local
go run ./cmd/main.go

# Seed admin user (ครั้งแรก)
go run ./cmd/seed/main.go
```

Frontend เปิดไฟล์ `frontend/index.html` ผ่าน browser ได้เลย หรือ serve ด้วย live-server

---

## Business Rules สำคัญ

- Item quantity ห้ามติดลบเด็ดขาด (validate ที่ backend ด้วย DB transaction + SELECT FOR UPDATE)
- Item name ต้อง unique (case-insensitive)
- ลบ user = soft delete เท่านั้น (`deleted_at`) — มี permanent delete แยกสำหรับ admin
- ลบ item ต้องยืนยัน password ก่อนทุกครั้ง
- Low stock alert = `quantity <= min_quantity`
- Activity log บันทึกลง DB อัตโนมัติ ไม่มี UI แสดง

---

## Roles & Permissions

| Action | Admin | User |
|--------|:-----:|:----:|
| Create item | ✅ | ❌ |
| Edit item | ✅ | ❌ |
| Update quantity | ✅ | ✅ |
| Delete item | ✅ | ❌ |
| Manage categories | ✅ | ❌ |
| Manage users | ✅ | ❌ |
| View dashboard | ✅ | ✅ |

---

## เพิ่ม Feature ใหม่

### Backend (Go)
1. เพิ่ม model ใน `backend/internal/model/`
2. เพิ่ม handler ใน `backend/internal/handler/`
3. Register route ใน `backend/internal/router/router.go`
4. ถ้ามี DB schema ใหม่ อัปเดต `database/schema.sql`

### Frontend (Vanilla JS)
1. เพิ่ม page component ใน `frontend/pages.jsx`
2. เพิ่ม modal ใน `frontend/modals.jsx` (ถ้ามี)
3. เพิ่ม API call ใน `frontend/api.js`
4. Register page ใน `frontend/app.jsx`

### Naming Conventions
- Go: PascalCase types, camelCase locals, snake_case JSON tags
- JS: camelCase functions/variables
- SQL: snake_case columns/tables
- API response: snake_case keys

---

## Troubleshooting

| อาการ | สาเหตุที่เป็นไปได้ | วิธีแก้ |
|-------|-----------------|---------|
| เข้า `http://161.118.208.161` ไม่ได้ | iptables บน VM ปิด port 80 | `sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT` |
| Backend crash loop | .env.prod ไม่ครบ หรือ MySQL ยังไม่พร้อม | `docker compose logs backend` ดู error |
| Login ไม่ได้ | ยังไม่ได้ seed | `docker compose -f docker-compose.prod.yml exec backend ./seed` |
| DB connect error | DB_HOST ผิด หรือ MySQL ยังไม่ start | รอ 10-15 วิ แล้ว restart backend |
