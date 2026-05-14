# Skill Router

Claude อ่านไฟล์นี้และ apply skill ที่ตรงกับ context โดยอัตโนมัติ ไม่ต้องรอให้สั่ง

---

## Routing Rules

### Project Skills (skills/ folder)

| เมื่อทำงานเกี่ยวกับ | ใช้ skill |
|---|---|
| Go handler, middleware, GORM model, Gin router | `skills/go-gin-api.md` |
| JWT, login/logout, bcrypt, cookie, protected route | `skills/auth-jwt.md` |
| Next.js component, React Query, Tailwind, API call, middleware.ts | `skills/nextjs-frontend.md` |
| SQL schema, migration, query, GORM tag, DB index | `skills/mysql-schema.md` |
| เขียน test, รัน test, regression, E2E, Playwright | `skills/testing.md` |

**วิธีใช้:** ก่อนเขียนโค้ดในแต่ละ domain อ่าน skill ที่เกี่ยวข้องก่อน เพื่อให้ pattern และ convention สอดคล้องกันตลอด project

---

### Claude Code Skills

| สถานการณ์ | Skill | เมื่อไหร่ |
|---|---|---|
| เขียนโค้ดใหม่หรือแก้ไข feature ครบแล้ว | `simplify` | หลังจาก implement จบแต่ละ module |
| ก่อนสร้าง PR | `review` | ก่อน push ทุกครั้ง |
| implement auth, password, permission ครบแล้ว | `security-review` | หลัง auth module เสร็จ |

---

## End-of-Session Review

เมื่อ task ใหญ่หรือ session จบ Claude ต้องรีวิวตามหัวข้อนี้เสมอ:

### 1. Skill Usage
- skill ไหนที่ถูก apply ใน session นี้บ้าง
- apply ถูก context ไหม หรือควร apply เพิ่มที่ตรงไหน

### 2. Skill Quality
- pattern ใน skill file ที่ใช้ไป — ยังตรงกับโค้ดจริงไหม
- มีอะไรที่ควร update ใน skill file ไหม

### 3. Missing Skills
- มีงานที่ทำไปแต่ไม่มี skill รองรับไหม
- ถ้ามี ระบุว่า skill นั้นควรชื่ออะไร และ cover อะไรบ้าง

### 4. Next Session
- skill ไหนที่ session ถัดไปน่าจะต้องใช้

---

## Review Format (ใช้ตอนท้าย session)

```
## Session Review

**Skills used:** [list]
**Gaps found:** [ถ้าไม่มีให้บอก "none"]
**Skill updates needed:** [file + สิ่งที่ต้องเพิ่ม/แก้]
**Suggested new skills:** [ถ้าไม่มีให้บอก "none"]
**Next session will need:** [list]
```
