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

func suffix() string       { return fmt.Sprintf("%06d", rand.Intn(999999)) }
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

// ── TC-012 ~ TC-013: Permanent Delete User ────────────────────────────────────

func TestPermanentDelete_ActiveUser_Blocked(t *testing.T) {
	admin := loginAs(t, "admin@dinopop.com", "admin1234")
	createResp := doPost(admin, "/api/v1/users", map[string]any{
		"username": "perm-test-" + suffix() + "@dinopop.com",
		"password": "test1234", "firstname": "Test", "role": "user",
	})
	userID := fid(parseData(createResp)["user_id"].(float64))

	resp := doRequest(admin, "DELETE", "/api/v1/users/"+userID+"/permanent",
		map[string]string{"password": "admin1234"})
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("TC-012 FAIL: expected 400, got %d", resp.StatusCode)
	}
	// cleanup
	doRequest(admin, "DELETE", "/api/v1/users/"+userID, nil)
	doRequest(admin, "DELETE", "/api/v1/users/"+userID+"/permanent",
		map[string]string{"password": "admin1234"})
}

func TestPermanentDelete_DeactivatedUser_Success(t *testing.T) {
	admin := loginAs(t, "admin@dinopop.com", "admin1234")
	createResp := doPost(admin, "/api/v1/users", map[string]any{
		"username": "perm-del-" + suffix() + "@dinopop.com",
		"password": "test1234", "firstname": "ToDelete", "role": "user",
	})
	userID := fid(parseData(createResp)["user_id"].(float64))

	doRequest(admin, "DELETE", "/api/v1/users/"+userID, nil)

	resp := doRequest(admin, "DELETE", "/api/v1/users/"+userID+"/permanent",
		map[string]string{"password": "admin1234"})
	if resp.StatusCode != http.StatusOK {
		t.Errorf("TC-013 FAIL: expected 200, got %d", resp.StatusCode)
	}
}

// ── TC-014 ~ TC-018: Transactions (Finance) ──────────────────────────────────

func TestListTransactions_WithoutAuth(t *testing.T) {
	resp := doRequest(anonClient(), "GET", "/api/v1/transactions", nil)
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("TC-014 FAIL: expected 401, got %d", resp.StatusCode)
	}
}

func TestCreateTransaction_AsUser_ShouldFail(t *testing.T) {
	admin := loginAs(t, "admin@dinopop.com", "admin1234")
	email := "user-" + suffix() + "@dinopop.com"
	createResp := doPost(admin, "/api/v1/users", map[string]any{
		"username": email, "password": "test1234", "firstname": "Test", "role": "user",
	})
	userID := fid(parseData(createResp)["user_id"].(float64))

	user := loginAs(t, email, "test1234")
	resp := doPost(user, "/api/v1/transactions", map[string]any{
		"txn_date": "2030-01-01", "type": "income", "amount": 100,
		"payment_method": "cash", "description": "fail-" + suffix(),
	})
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("TC-015 FAIL: expected 403, got %d", resp.StatusCode)
	}
	doRequest(admin, "DELETE", "/api/v1/users/"+userID, nil)
}

func TestTransactionSummary_And_RunningBalance(t *testing.T) {
	admin := loginAs(t, "admin@dinopop.com", "admin1234")
	// far-future date avoids colliding with other rows when checking the running-balance delta
	date := "2031-0" + strconv.Itoa(1+rand.Intn(9)) + "-15"

	incResp := doPost(admin, "/api/v1/transactions", map[string]any{
		"txn_date": date, "type": "income", "amount": 500,
		"payment_method": "cash", "description": "test-income-" + suffix(),
	})
	if incResp.StatusCode != http.StatusCreated {
		t.Fatalf("TC-016 FAIL: create income expected 201, got %d", incResp.StatusCode)
	}
	incID := fid(parseData(incResp)["transaction_id"].(float64))

	expResp := doPost(admin, "/api/v1/transactions", map[string]any{
		"txn_date": date, "type": "expense", "amount": 200,
		"payment_method": "transfer", "description": "test-expense-" + suffix(),
	})
	expID := fid(parseData(expResp)["transaction_id"].(float64))

	listResp := doRequest(admin, "GET", "/api/v1/transactions?from="+date+"&to="+date, nil)
	data := parseData(listResp)
	summary := data["summary"].(map[string]any)
	if summary["total_income"].(float64) != 500 || summary["total_expense"].(float64) != 200 || summary["net"].(float64) != 300 {
		t.Errorf("TC-016 FAIL: unexpected summary %+v", summary)
	}

	items := data["items"].([]any)
	var incBal, expBal float64
	for _, it := range items {
		row := it.(map[string]any)
		if fid(row["transaction_id"].(float64)) == incID {
			incBal = row["running_balance"].(float64)
		}
		if fid(row["transaction_id"].(float64)) == expID {
			expBal = row["running_balance"].(float64)
		}
	}
	if expBal-incBal != -200 {
		t.Errorf("TC-016 FAIL: running balance delta expected -200, got %v", expBal-incBal)
	}

	doRequest(admin, "DELETE", "/api/v1/transactions/"+incID, map[string]string{"password": "admin1234"})
	doRequest(admin, "DELETE", "/api/v1/transactions/"+expID, map[string]string{"password": "admin1234"})
}

func TestDeleteTransaction_WrongPassword_Rejected(t *testing.T) {
	admin := loginAs(t, "admin@dinopop.com", "admin1234")
	createResp := doPost(admin, "/api/v1/transactions", map[string]any{
		"txn_date": "2031-01-01", "type": "expense", "amount": 50,
		"payment_method": "cash", "description": "del-test-" + suffix(),
	})
	id := fid(parseData(createResp)["transaction_id"].(float64))

	resp := doRequest(admin, "DELETE", "/api/v1/transactions/"+id, map[string]string{"password": "wrongpw"})
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("TC-017 FAIL: expected 401, got %d", resp.StatusCode)
	}
	doRequest(admin, "DELETE", "/api/v1/transactions/"+id, map[string]string{"password": "admin1234"})
}

// ── TC-018: Recipe cost/profit calculation ───────────────────────────────────

func TestRecipeCost_MatchesFormula(t *testing.T) {
	admin := loginAs(t, "admin@dinopop.com", "admin1234")
	s := suffix()

	// น้ำมันเกสร reference จากสเปรดชีต: 250 บาท/5000g, ใช้ 70g/หม้อ -> cost ต่อหม้อ 3.5 บาท
	itemResp := doPost(admin, "/api/v1/items", map[string]any{
		"item_name": "recipe-test-oil-" + s, "item_quantity": 0, "unit": "g", "min_quantity": 0,
		"package_price": 250, "package_size_g": 5000,
	})
	itemID := parseData(itemResp)["item_id"].(float64)

	recipeResp := doPost(admin, "/api/v1/recipes", map[string]any{
		"name": "recipe-test-" + s, "bags_per_batch": 2.2, "sale_price_per_bag": 45,
		"ingredients": []map[string]any{
			{"item_id": itemID, "quantity_g": 70},
		},
	})
	if recipeResp.StatusCode != http.StatusCreated {
		t.Fatalf("TC-018 FAIL: create recipe expected 201, got %d", recipeResp.StatusCode)
	}
	data := parseData(recipeResp)
	costPerBag := data["cost_per_bag"].(float64)
	want := 3.5 / 2.2 // cost_per_batch / bags_per_batch
	if diff := costPerBag - want; diff > 0.001 || diff < -0.001 {
		t.Errorf("TC-018 FAIL: cost_per_bag expected ~%.4f, got %v", want, costPerBag)
	}

	recipeID := fid(data["recipe_id"].(float64))
	doRequest(admin, "DELETE", "/api/v1/recipes/"+recipeID, map[string]string{"password": "admin1234"})
	doRequest(admin, "DELETE", "/api/v1/items/"+fid(itemID), map[string]string{"password": "admin1234"})
}

func TestCreateRecipe_AsUser_ShouldFail(t *testing.T) {
	admin := loginAs(t, "admin@dinopop.com", "admin1234")
	email := "user-" + suffix() + "@dinopop.com"
	createResp := doPost(admin, "/api/v1/users", map[string]any{
		"username": email, "password": "test1234", "firstname": "Test", "role": "user",
	})
	userID := fid(parseData(createResp)["user_id"].(float64))

	user := loginAs(t, email, "test1234")
	resp := doPost(user, "/api/v1/recipes", map[string]any{
		"name": "fail-" + suffix(), "bags_per_batch": 1, "sale_price_per_bag": 10,
		"ingredients": []map[string]any{},
	})
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("TC-019 FAIL: expected 403, got %d", resp.StatusCode)
	}
	doRequest(admin, "DELETE", "/api/v1/users/"+userID, nil)
}
