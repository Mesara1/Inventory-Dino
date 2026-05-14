# Dinopop Corn — Inventory System Requirements

## 1. Introduction

### 1.1 Problem Statement
ผู้ประกอบการไม่สามารถติดตามปริมาณสินค้าคงเหลือภายในร้านได้อย่างแม่นยำ ส่งผลให้:
- ไม่สามารถขายสินค้าได้ครบตามที่ต้องการ
- สูญเสียโอกาสทางรายได้
- ไม่สามารถวางแผนสั่งซื้อได้ล่วงหน้า

### 1.2 Objective
พัฒนา Web Application สำหรับบริหารจัดการวัตถุดิบและสต็อกสินค้าภายในร้านเดียว ช่วยติดตามจำนวนของ และแจ้งเตือนเมื่อของใกล้หมด

---

## 2. Scope of Work
- ระบบใช้งานภายในร้านเดียว (Dinopop Corn แจ้งวัฒนะปากเกร็ด 19)
- ผู้ใช้งาน 2 ประเภท: **Admin** และ **User**
- Web App แบบ Responsive (mobile-friendly)

---

## 3. Functional Requirements

### FR-01: Account Management

**Admin สามารถ:**
- สร้าง / แก้ไข / ปิด User Account

**ข้อมูลที่ใช้สร้าง Account:**
| Field | Required |
|-------|----------|
| ชื่อ-นามสกุล | ✅ |
| Email (username) | ✅ |
| Password | ✅ |
| เบอร์โทรศัพท์ | Optional |

**แก้ไขได้หลังสร้าง:** ชื่อ-นามสกุล, เบอร์โทรศัพท์, Password

**ลบ Account:** Soft delete เท่านั้น (set `deleted_at`) — ไม่ลบออกจาก DB
- Admin ปิด Account ของ User ใดก็ได้
- User ทั่วไปปิด Account ตัวเองได้

---

### FR-02: Role & Permission

| Action | Admin | User |
|--------|:-----:|:----:|
| Create item | ✅ | ❌ |
| Edit item (ชื่อ / unit / category / threshold) | ✅ | ❌ |
| Update item quantity (+/-) | ✅ | ✅ |
| Delete item | ✅ | ❌ |
| Manage user accounts | ✅ | ❌ |
| View dashboard | ✅ | ✅ |
| ปิด account ตัวเอง | ✅ | ✅ |

---

### FR-03: Create Item (Admin only)

ข้อมูลที่กรอกเมื่อสร้างรายการใหม่:

| Field | Required | หมายเหตุ |
|-------|----------|----------|
| ชื่อรายการ (item_name) | ✅ | ห้ามซ้ำ (case-insensitive) |
| จำนวนเริ่มต้น | ✅ | จำนวนเต็มบวก >= 0 |
| หน่วยนับ (unit) | ✅ | เช่น ถุง, กล่อง, กิโลกรัม, ชิ้น |
| ประเภท (category) | ✅ | เลือกจาก category ที่มีอยู่ |
| จำนวนขั้นต่ำ (min_quantity) | ✅ | ใช้สำหรับแจ้งเตือน low stock |

---

### FR-04: Edit Item

**Admin แก้ไขได้:** ชื่อ, จำนวน, unit, category, min_quantity

**User ทั่วไปทำได้:** เพิ่มหรือลดจำนวนเท่านั้น
- ห้ามลดให้จำนวนต่ำกว่า 0

---

### FR-05: Delete Item (Admin only)
- ยืนยันรหัสผ่านก่อนลบทุกครั้ง
- Hard delete (ลบออกจาก DB) — activity log ยังคงอยู่ (item_id set NULL)

---

### FR-06: Category Management (Admin only)
- สร้าง / แก้ไข / ลบ Category ได้
- ประเภทตัวอย่าง: บรรจุภัณฑ์, วัตถุดิบ, อุปกรณ์
- ลบ category ที่มี item อยู่ไม่ได้ (ต้อง reassign ก่อน)

---

### FR-07: Dashboard

แสดงผลรายการของทั้งหมด พร้อมข้อมูล:
- ชื่อรายการ, จำนวนปัจจุบัน, หน่วยนับ, ประเภท
- **Highlight รายการที่ quantity <= min_quantity** (low stock warning)
- แสดงจำนวนรายการทั้งหมด / รายการที่ low stock (summary card)
- Filter ตาม: ชื่อ (search), category, สถานะ (low stock / ปกติ)
- Sort ตาม: ชื่อ, จำนวน, ประเภท

---

## 4. Non-Functional Requirements

| NFR | รายละเอียด |
|-----|-----------|
| Responsive | รองรับ mobile และ desktop |
| Performance | Response time < 3 วินาที |
| Capacity | รองรับ items ได้ถึง 1,000 รายการ |
| Security | Password ต้อง hash (bcrypt), JWT auth |
| Availability | ใช้งานภายใน LAN / local network |

---

## 5. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (TypeScript) + Tailwind CSS |
| Backend | Go + Gin framework |
| Database | MySQL 8.0 |
| Auth | JWT (httpOnly cookie) |
| Container | Docker Compose |

---

## 6. Out of Scope
- ระบบ POS / การขาย
- การสั่งซื้อจากซัพพลายเออร์
- Activity Log UI (เก็บใน DB เท่านั้น)
- Notification แบบ push/email
- Multi-branch / multi-store

---

*Project นี้พัฒนาเพื่อใช้งานจริง และเป็นการฝึกฝน Software Development Cycle*
