# Dinopop Corn — UI Design Requirement

## Project Overview
ระบบ Inventory Management Web App สำหรับร้าน **Dinopop Corn** ร้านขายป็อปคอร์น ใช้ติดตามวัตถุดิบและสต็อกสินค้าภายในร้าน
ผู้ใช้งานเป็นพนักงาน ใช้ทั้งบนมือถือและ desktop ระหว่างทำงานหลังร้าน

**Tech Stack:** Next.js (TypeScript) + Tailwind CSS
**ภาษา UI:** ภาษาไทย (label, placeholder, error message ทั้งหมด)

---

## Users & Roles

| Role | ความสามารถ |
|------|-----------|
| **Admin** | เข้าถึงได้ทุกหน้า จัดการ users, items, categories ได้ทั้งหมด |
| **User** | ดู Dashboard, อัพเดทจำนวนสินค้าได้อย่างเดียว |

---

## Pages & Screens

### 1. Login Page — `/login`

**เข้าถึงได้:** ทุกคน (unauthenticated)
**Redirect:** หลัง login สำเร็จ → `/dashboard`

**Elements:**
- Logo / ชื่อร้าน "Dinopop Corn"
- Form: Email + Password
- ปุ่ม "เข้าสู่ระบบ"
- Error message เมื่อ credentials ผิด
- ไม่มีลิงก์ "สมัครสมาชิก" (Admin เป็นคนสร้าง account เท่านั้น)

---

### 2. Dashboard — `/dashboard`

**เข้าถึงได้:** Admin, User
**หน้าหลักของระบบ**

#### Summary Cards (บนสุด)
| Card | แสดง |
|------|------|
| รายการทั้งหมด | จำนวน items ทั้งหมดในระบบ |
| ของใกล้หมด | จำนวน items ที่ quantity <= min_quantity (highlight สีแดง/ส้ม ถ้า > 0) |

#### Filter & Search Bar
- Search box: ค้นหาชื่อสินค้า
- Dropdown: กรองตาม Category
- Toggle/Tab: แสดงทั้งหมด / เฉพาะของใกล้หมด

#### Items Table / List
แสดงคอลัมน์:
| คอลัมน์ | หมายเหตุ |
|---------|---------|
| ชื่อรายการ | sortable |
| ประเภท | category name |
| จำนวน | ตัวเลข + หน่วย (เช่น "50 ถุง") sortable |
| จำนวนขั้นต่ำ | min_quantity + หน่วย |
| สถานะ | badge "ปกติ" (เขียว) / "ใกล้หมด" (แดง/ส้ม) |
| Actions | ดูด้านล่าง |

**Actions ตาม Role:**
- **Admin:** ปุ่ม แก้ไข (edit icon), ลบ (trash icon), ปุ่ม +/- จำนวน
- **User:** ปุ่ม +/- จำนวนเท่านั้น

**Low Stock Row:** แถวที่ quantity <= min_quantity ควร highlight (เช่น พื้นหลังสีแดงอ่อน หรือ left border สีแดง)

#### Mobile View
บน mobile ให้แสดงเป็น Card แทน Table (1 card ต่อ item)

---

### 3. Items — Modal / Drawer (ไม่ใช่ page แยก)

#### 3.1 Add Item Modal (Admin only)
เปิดจากปุ่ม "+ เพิ่มรายการ" บน Dashboard

**Form Fields:**
| Field | Type | Validation |
|-------|------|-----------|
| ชื่อรายการ | Text input | Required, ห้ามซ้ำ |
| ประเภท | Dropdown (categories) | Required |
| จำนวนเริ่มต้น | Number input (>= 0) | Required |
| หน่วยนับ | Text input | Required (เช่น ถุง, กล่อง, ชิ้น) |
| จำนวนขั้นต่ำ (แจ้งเตือน) | Number input (>= 0) | Required |

**Buttons:** ยกเลิก / บันทึก

#### 3.2 Edit Item Modal (Admin only)
เปิดจากปุ่ม Edit บนแถว item

**Form Fields:** เหมือน Add แต่ pre-filled ด้วยข้อมูลเดิม

**Buttons:** ยกเลิก / บันทึก

#### 3.3 Update Quantity Modal (Admin + User)
เปิดจากปุ่ม +/- บนแถว item

**แสดง:** ชื่อ item + จำนวนปัจจุบัน
**Input:** จำนวนที่ต้องการ เพิ่ม หรือ ลด (ระบบคำนวณ new = current + delta)
**Validation:** ผลลัพธ์ต้องไม่ต่ำกว่า 0
**Buttons:** ยกเลิก / ยืนยัน

#### 3.4 Delete Item Confirmation Modal (Admin only)
เปิดจากปุ่ม Delete บนแถว item

**แสดง:** ชื่อ item ที่จะลบ + คำเตือน
**ต้องกรอก:** Password ของ Admin เพื่อยืนยัน
**Buttons:** ยกเลิก / ลบ (สีแดง)

---

### 4. Categories Management — `/categories` (Admin only)

**เข้าถึงได้:** Admin เท่านั้น

**Elements:**
- ตารางแสดง categories ทั้งหมด (ชื่อ, จำนวน items ในนั้น)
- ปุ่ม "+ เพิ่มประเภท"
- แต่ละแถว: ปุ่ม แก้ไข, ลบ
- ปุ่มลบ disable ถ้า category นั้นมี items อยู่ (พร้อม tooltip อธิบาย)

**Add/Edit Category:** Inline form หรือ small modal — กรอกชื่อ category เท่านั้น

---

### 5. User Management — `/users` (Admin only)

**เข้าถึงได้:** Admin เท่านั้น

**Elements:**
- ตารางแสดง users ทั้งหมด
- คอลัมน์: ชื่อ-นามสกุล, Email, เบอร์, Role (badge), วันที่สร้าง, Actions
- ปุ่ม "+ เพิ่มผู้ใช้"
- Actions ต่อ user: แก้ไข, ปิดบัญชี

#### Add User Modal
**Form Fields:**
| Field | Type | Validation |
|-------|------|-----------|
| ชื่อ | Text | Required |
| นามสกุล | Text | Optional |
| Email | Email input | Required, unique |
| เบอร์โทร | Text | Optional |
| รหัสผ่าน | Password | Required, min 6 ตัว |
| Role | Dropdown (Admin/User) | Required |

#### Edit User Modal
- แก้ไข: ชื่อ, นามสกุล, เบอร์โทร
- ไม่สามารถแก้ Email / Role ผ่านหน้านี้

#### Deactivate Confirmation
- Dialog confirm ว่าต้องการปิดบัญชี user นี้จริงไหม
- แสดงชื่อ user ที่จะปิด

---

### 6. Profile — `/profile`

**เข้าถึงได้:** ทุกคน (ข้อมูลของตัวเอง)

**Sections:**
1. **ข้อมูลส่วนตัว** — แก้ไข ชื่อ, นามสกุล, เบอร์โทร
2. **เปลี่ยนรหัสผ่าน** — กรอก รหัสปัจจุบัน + รหัสใหม่ + ยืนยันรหัสใหม่
3. **ปิดบัญชี** — ปุ่มสีแดง พร้อม confirmation dialog

---

## Navigation

### Sidebar / Bottom Navigation
| เมนู | Icon | เข้าถึงได้ |
|------|------|-----------|
| Dashboard | grid/home | Admin, User |
| จัดการสินค้า | (ปุ่มใน Dashboard ไม่ใช่เมนู) | — |
| ประเภทสินค้า | tag | Admin |
| ผู้ใช้งาน | users | Admin |
| โปรไฟล์ | person | Admin, User |
| ออกจากระบบ | logout | Admin, User |

**Desktop:** Sidebar ซ้ายมือ
**Mobile:** Bottom navigation bar

---

## Key UX Notes

1. **Low stock ต้องเห็นทันที** — เปิดหน้า Dashboard แล้วต้องรู้ว่าของไหนใกล้หมดทันที
2. **Update quantity ต้องทำได้เร็ว** — User ทำงานหลังร้าน ต้องกด +/- ได้ไม่เกิน 2-3 tap
3. **Mobile first** — ผู้ใช้มักใช้มือถือ ตาราง/card ต้องอ่านง่ายบนหน้าจอเล็ก
4. **ภาษาไทยทั้งหมด** — ทุก label, placeholder, error message, toast notification
5. **Toast notifications** — แสดงผล success/error หลังทุก action (เช่น "บันทึกเรียบร้อย", "เกิดข้อผิดพลาด")
6. **Loading states** — ปุ่มต้อง disable และแสดง spinner ขณะ API call

---

## API Endpoints (พร้อมใช้งาน)

```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

GET    /api/v1/users              (Admin)
POST   /api/v1/users              (Admin)
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
PATCH  /api/v1/users/:id/password
DELETE /api/v1/users/:id          (soft delete)

GET    /api/v1/categories
POST   /api/v1/categories         (Admin)
PUT    /api/v1/categories/:id     (Admin)
DELETE /api/v1/categories/:id     (Admin)

GET    /api/v1/items              (coming soon)
POST   /api/v1/items              (Admin, coming soon)
PUT    /api/v1/items/:id          (Admin, coming soon)
PATCH  /api/v1/items/:id/quantity (coming soon)
DELETE /api/v1/items/:id          (Admin, coming soon)
```

**Base URL:** `http://localhost:8080`
**Auth:** JWT ใน httpOnly cookie — ส่ง `credentials: 'include'` ทุก request
**Response format:**
```json
{ "data": ..., "message": "success" }
{ "error": "...", "message": "..." }
```

---

## Design Direction (ให้เป็นแนวทาง)

- **โทนสี:** สดใส อ่านง่าย เหมาะกับร้านขายอาหาร — เช่น orange/yellow primary หรือ clean white + accent color
- **Font:** ภาษาไทยอ่านง่าย
- **Style:** Clean, minimal — ไม่ซับซ้อน ใช้งานได้ทันที
- **Low stock color:** แดง หรือ ส้ม — ต้องเด่นชัด
