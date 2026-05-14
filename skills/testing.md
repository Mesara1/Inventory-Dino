# Testing Patterns

## Backend: Go Integration Tests

### รัน tests
```powershell
# รันจาก backend/ folder
cd backend
go test ./tests/... -v -timeout 60s
```

### เมื่อไหรต้องรัน
- หลังแก้ handler, service, middleware, model
- ก่อน commit ที่กระทบ API behavior
- **ถามก่อนเสมอถ้าจะรัน full flow** — อาจใช้เวลานาน

### โครงสร้าง test
```
backend/tests/
└── api_test.go   # integration tests ทั้งหมด
```

### Test Cases ที่มี
| TC | Test | Expected |
|----|------|----------|
| TC-001 | Login valid credentials | 200 |
| TC-002 | Login invalid password | 401 |
| TC-003 | GET /auth/me without token | 401 |
| TC-004 | GET /auth/me with token | 200 |
| TC-005 | GET /items without auth | 401 |
| TC-006 | Create item as Admin | 201 |
| TC-007 | Create item as User | 403 |
| TC-008 | Update quantity → negative | 400 |
| TC-009 | Delete item wrong password | 401 |
| TC-010 | Delete category with items | 400 |
| TC-011 | Deactivate last admin | 400 |

### Helper functions
```go
loginAs(t, username, password)  // login แล้วคืน *http.Client พร้อม cookie
anonClient()                    // client ที่ไม่มี auth
doPost(client, path, body)      // POST request
doRequest(client, method, path, body)  // ทุก method
parseData(resp)                 // แกะ .data จาก response JSON
```

### Pattern: cleanup หลังแต่ละ test
```go
func TestSomething(t *testing.T) {
    admin := loginAs(t, "admin@dinopop.com", "admin1234")
    
    // สร้าง test data
    resp := doPost(admin, "/api/v1/items", payload)
    id := fid(parseData(resp)["item_id"].(float64))
    
    // test
    // ...
    
    // cleanup เสมอ ไม่ว่า test จะ pass หรือ fail
    doRequest(admin, "DELETE", "/api/v1/items/"+id, map[string]string{"password": "admin1234"})
}
```

### บัคที่เคยเจอ + วิธีแก้
- **Activity log FK error หลัง delete item**: ต้องเขียน `writeLog` ก่อน `db.Delete()` เสมอ

---

## Frontend: E2E Tests (Playwright) — ต้องติดตั้ง Node.js ก่อน

### ติดตั้ง (ทำครั้งเดียวแล้ว)
```powershell
npm install -D @playwright/test
node node_modules/@playwright/test/cli.js install chromium
```

### รัน (ต้องเปิด server ก่อน: go run cmd/main.go)
```powershell
cd C:\Users\Meen\Desktop\inventory-dino
node node_modules/@playwright/test/cli.js test
node node_modules/@playwright/test/cli.js test --headed   # เห็น browser
node node_modules/@playwright/test/cli.js test --project=mobile
```

### Test cases ที่ควรมี (TODO เมื่อมี Node.js)
- Login flow (valid/invalid)
- Dashboard แสดง items ถูกต้อง
- Update quantity modal: layout ไม่ overflow บน mobile (iPhone SE 375px)
- Update quantity ลดไม่ติดลบ
- Delete item ต้องใส่ password
- Admin-only pages redirect User ออก

### Visual regression: qty-modal บน mobile
```js
test('qty-modal ไม่ overflow บน iPhone SE', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    // ... login, open modal, check no horizontal scroll
    const pad = page.locator('.qty-modal__pad');
    const box = await pad.boundingBox();
    expect(box.x + box.width).toBeLessThanOrEqual(375);
});
```
