package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"

	"inventory-dino/internal/config"
	"inventory-dino/internal/database"
	"inventory-dino/internal/handler"
	"inventory-dino/internal/middleware"
	"inventory-dino/internal/router"
)

var srv *httptest.Server

func TestMain(m *testing.M) {
	cfg := config.Load()
	db := database.Connect(cfg)
	h := handler.New(db, cfg)
	r := router.Setup(h, middleware.JWT(cfg.JWTSecret))
	srv = httptest.NewServer(r)
	defer srv.Close()
	os.Exit(m.Run())
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func doPost(client *http.Client, path string, body any) *http.Response {
	b, _ := json.Marshal(body)
	resp, err := client.Post(srv.URL+path, "application/json", bytes.NewBuffer(b))
	if err != nil {
		panic(err)
	}
	return resp
}

func doRequest(client *http.Client, method, path string, body any) *http.Response {
	var r io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		r = bytes.NewBuffer(b)
	}
	req, _ := http.NewRequest(method, srv.URL+path, r)
	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	return resp
}

func parseData(resp *http.Response) map[string]any {
	var res map[string]any
	json.NewDecoder(resp.Body).Decode(&res)
	if data, ok := res["data"].(map[string]any); ok {
		return data
	}
	return nil
}

func loginAs(t *testing.T, username, password string) *http.Client {
	t.Helper()
	jar, _ := cookiejar.New(nil)
	client := &http.Client{Jar: jar}
	resp := doPost(client, "/api/v1/auth/login", map[string]string{
		"username": username, "password": password,
	})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("login failed: got %d", resp.StatusCode)
	}
	return client
}

func anonClient() *http.Client {
	jar, _ := cookiejar.New(nil)
	return &http.Client{Jar: jar}
}

func suffix() string { return fmt.Sprintf("%06d", rand.Intn(999999)) }
func fid(f float64) string { return strconv.Itoa(int(f)) }

// ── TC-001 ~ TC-004: Auth ─────────────────────────────────────────────────────

func TestLogin_ValidCredentials(t *testing.T) {
	resp := doPost(anonClient(), "/api/v1/auth/login", map[string]string{
		"username": "admin@dinopop.com", "password": "admin1234",
	})
	if resp.StatusCode != http.StatusOK {
		t.Errorf("TC-001 FAIL: expected 200, got %d", resp.StatusCode)
	}
}

func TestLogin_InvalidPassword(t *testing.T) {
	resp := doPost(anonClient(), "/api/v1/auth/login", map[string]string{
		"username": "admin@dinopop.com", "password": "wrongpassword",
	})
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("TC-002 FAIL: expected 401, got %d", resp.StatusCode)
	}
}

func TestMe_WithoutToken(t *testing.T) {
	resp := doRequest(anonClient(), "GET", "/api/v1/auth/me", nil)
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("TC-003 FAIL: expected 401, got %d", resp.StatusCode)
	}
}

func TestMe_WithToken(t *testing.T) {
	client := loginAs(t, "admin@dinopop.com", "admin1234")
	resp := doRequest(client, "GET", "/api/v1/auth/me", nil)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("TC-004 FAIL: expected 200, got %d", resp.StatusCode)
	}
}

// ── TC-005 ~ TC-009: Items ────────────────────────────────────────────────────

func TestListItems_WithoutAuth(t *testing.T) {
	resp := doRequest(anonClient(), "GET", "/api/v1/items", nil)
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("TC-005 FAIL: expected 401, got %d", resp.StatusCode)
	}
}

func TestCreateItem_AsAdmin(t *testing.T) {
	client := loginAs(t, "admin@dinopop.com", "admin1234")
	name := "test-item-" + suffix()
	resp := doPost(client, "/api/v1/items", map[string]any{
		"item_name": name, "item_quantity": 10,
		"unit": "ชิ้น", "min_quantity": 2,
	})
	if resp.StatusCode != http.StatusCreated {
		t.Errorf("TC-006 FAIL: expected 201, got %d", resp.StatusCode)
		return
	}
	if data := parseData(resp); data != nil {
		doRequest(client, "DELETE", "/api/v1/items/"+fid(data["item_id"].(float64)),
			map[string]string{"password": "admin1234"})
	}
}

func TestCreateItem_AsUser_ShouldFail(t *testing.T) {
	admin := loginAs(t, "admin@dinopop.com", "admin1234")
	email := "user-" + suffix() + "@dinopop.com"
	createResp := doPost(admin, "/api/v1/users", map[string]any{
		"username": email, "password": "test1234", "firstname": "Test", "role": "user",
	})
	userID := fid(parseData(createResp)["user_id"].(float64))

	user := loginAs(t, email, "test1234")
	resp := doPost(user, "/api/v1/items", map[string]any{
		"item_name": "fail-" + suffix(), "item_quantity": 0, "unit": "ชิ้น", "min_quantity": 0,
	})
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("TC-007 FAIL: expected 403, got %d", resp.StatusCode)
	}
	doRequest(admin, "DELETE", "/api/v1/users/"+userID, nil)
}

func TestUpdateQuantity_CausesNegative_Blocked(t *testing.T) {
	client := loginAs(t, "admin@dinopop.com", "admin1234")
	createResp := doPost(client, "/api/v1/items", map[string]any{
		"item_name": "neg-test-" + suffix(), "item_quantity": 5,
		"unit": "ชิ้น", "min_quantity": 0,
	})
	id := fid(parseData(createResp)["item_id"].(float64))

	resp := doRequest(client, "PATCH", "/api/v1/items/"+id+"/quantity", map[string]int{"delta": -10})
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("TC-008 FAIL: expected 400, got %d", resp.StatusCode)
	}
	doRequest(client, "DELETE", "/api/v1/items/"+id, map[string]string{"password": "admin1234"})
}

func TestDeleteItem_WrongPassword_Rejected(t *testing.T) {
	client := loginAs(t, "admin@dinopop.com", "admin1234")
	createResp := doPost(client, "/api/v1/items", map[string]any{
		"item_name": "del-test-" + suffix(), "item_quantity": 1,
		"unit": "ชิ้น", "min_quantity": 0,
	})
	id := fid(parseData(createResp)["item_id"].(float64))

	resp := doRequest(client, "DELETE", "/api/v1/items/"+id, map[string]string{"password": "wrongpw"})
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("TC-009 FAIL: expected 401, got %d", resp.StatusCode)
	}
	doRequest(client, "DELETE", "/api/v1/items/"+id, map[string]string{"password": "admin1234"})
}

// ── TC-010: Categories ────────────────────────────────────────────────────────

func TestDeleteCategory_WithItems_Blocked(t *testing.T) {
	admin := loginAs(t, "admin@dinopop.com", "admin1234")
	s := suffix()

	catResp := doPost(admin, "/api/v1/categories", map[string]string{"category_name": "cat-" + s})
	catData := parseData(catResp)
	catID := fid(catData["category_id"].(float64))

	itemResp := doPost(admin, "/api/v1/items", map[string]any{
		"item_name": "item-cat-" + s, "item_quantity": 1,
		"unit": "ชิ้น", "min_quantity": 0,
		"category_id": catData["category_id"],
	})
	itemID := fid(parseData(itemResp)["item_id"].(float64))

	resp := doRequest(admin, "DELETE", "/api/v1/categories/"+catID, nil)
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("TC-010 FAIL: expected 400, got %d", resp.StatusCode)
	}
	doRequest(admin, "DELETE", "/api/v1/items/"+itemID, map[string]string{"password": "admin1234"})
	doRequest(admin, "DELETE", "/api/v1/categories/"+catID, nil)
}

// ── TC-011: Users ─────────────────────────────────────────────────────────────

func TestDeactivateLastAdmin_Blocked(t *testing.T) {
	admin := loginAs(t, "admin@dinopop.com", "admin1234")
	meData := parseData(doRequest(admin, "GET", "/api/v1/auth/me", nil))
	adminID := fid(meData["user_id"].(float64))

	resp := doRequest(admin, "DELETE", "/api/v1/users/"+adminID, nil)
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("TC-011 FAIL: expected 400, got %d", resp.StatusCode)
	}
}
