// import_transactions — one-time import ของ sheet "รับ,จ่าย" จาก Excel เข้า table `transactions`
//
// ใช้คอลัมน์ A(วันที่) B(รายการ) C(วิธีจ่าย) E(รับ) F(จ่าย) H(ผู้เบิก) J(หมายเหตุ) เท่านั้น
// คอลัมน์อื่น (K-V) เป็น side-table แยก (เช็คเงินสด, ราคาวัตถุดิบ, เบิกล่วงหน้าพนักงาน) ไม่เกี่ยวกับแถวเดียวกัน — ข้ามทั้งหมด
//
// วิธีได้ไฟล์ CSV ต้นทาง: เปิด Excel sheet "รับ,จ่าย" แล้ว Save As CSV (UTF-8) เอาเฉพาะคอลัมน์ A-J
//
// Usage:
//
//	go run ./cmd/import_transactions -csv path/to/income_expense.csv -dry-run
//	go run ./cmd/import_transactions -csv path/to/income_expense.csv          (รันจริง หลัง dry-run แล้วตรวจผ่าน)
package main

import (
	"encoding/csv"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"inventory-dino/internal/config"
	"inventory-dino/internal/database"
	"inventory-dino/internal/model"
)

type parsedRow struct {
	lineNo  int
	date    time.Time
	txnType string
	amount  float64
	method  string
	desc    string
	handled string
	note    string
}

func excelDateToTime(serial int) time.Time {
	epoch := time.Date(1899, 12, 30, 0, 0, 0, 0, time.UTC)
	return epoch.AddDate(0, 0, serial)
}

func mapPaymentMethod(s string) string {
	s = strings.TrimSpace(s)
	switch s {
	case "เงินสด":
		return "cash"
	case "โอน":
		return "transfer"
	default:
		return "cash" // เผื่อช่องว่าง/ไม่ตรง — dry-run จะ flag ให้ตรวจเอง
	}
}

func parseAmount(s string) float64 {
	s = strings.TrimSpace(strings.ReplaceAll(s, ",", ""))
	if s == "" {
		return 0
	}
	v, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0
	}
	return v
}

func parseCSV(path string) ([]parsedRow, []string) {
	f, err := os.Open(path)
	if err != nil {
		log.Fatalf("เปิดไฟล์ไม่ได้: %v", err)
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.FieldsPerRecord = -1

	var rows []parsedRow
	var warnings []string
	lastDate := time.Time{}
	lineNo := 1 // header

	for {
		record, err := r.Read()
		if err == io.EOF {
			break
		}
		lineNo++
		if err != nil {
			warnings = append(warnings, fmt.Sprintf("line %d: parse error: %v", lineNo, err))
			continue
		}
		if lineNo == 2 {
			continue // header row
		}
		col := func(i int) string {
			if i < len(record) {
				return strings.TrimSpace(record[i])
			}
			return ""
		}

		dateCell := col(0)
		desc := col(1)
		method := col(2)
		income := parseAmount(col(4))
		expense := parseAmount(col(5))
		handled := col(7)
		note := col(9)

		if dateCell != "" {
			serial, err := strconv.Atoi(dateCell)
			if err == nil {
				lastDate = excelDateToTime(serial)
			}
		}

		// แถวเปล่า/แถวหัวข้อ side-table — ไม่มีทั้งรับและจ่าย ข้าม
		if income == 0 && expense == 0 {
			continue
		}
		if desc == "" {
			warnings = append(warnings, fmt.Sprintf("line %d: ข้าม — ไม่มีคำอธิบายรายการ (รับ=%.2f จ่าย=%.2f)", lineNo, income, expense))
			continue
		}
		if lastDate.IsZero() {
			warnings = append(warnings, fmt.Sprintf("line %d: ข้าม — ยังไม่เจอวันที่ก่อนแถวนี้ (\"%s\")", lineNo, desc))
			continue
		}
		if income > 0 && expense > 0 {
			warnings = append(warnings, fmt.Sprintf("line %d: มีทั้งรับและจ่ายในแถวเดียว (\"%s\") — เอาแค่รับ %.2f", lineNo, desc, income))
		}

		row := parsedRow{
			lineNo:  lineNo,
			date:    lastDate,
			desc:    desc,
			method:  mapPaymentMethod(method),
			handled: handled,
			note:    note,
		}
		if income > 0 {
			row.txnType = "income"
			row.amount = income
		} else {
			row.txnType = "expense"
			row.amount = expense
		}
		rows = append(rows, row)
	}
	return rows, warnings
}

func main() {
	csvPath := flag.String("csv", "", "path to the exported income/expense CSV (columns A-J of sheet 'รับ,จ่าย')")
	dryRun := flag.Bool("dry-run", false, "print what would be imported without writing to the database")
	adminEmail := flag.String("admin", "admin@dinopop.com", "username of the admin account to record as created_by")
	flag.Parse()

	if *csvPath == "" {
		log.Fatal("ต้องระบุ -csv path/to/file.csv")
	}

	rows, warnings := parseCSV(*csvPath)

	fmt.Printf("พบ %d รายการที่ parse ได้, %d คำเตือน\n\n", len(rows), len(warnings))
	if len(warnings) > 0 {
		fmt.Println("=== คำเตือน (ตรวจก่อนรันจริง) ===")
		for _, w := range warnings {
			fmt.Println(" -", w)
		}
		fmt.Println()
	}

	fmt.Println("=== ตัวอย่าง 10 แถวแรก ===")
	for i, r := range rows {
		if i >= 10 {
			break
		}
		fmt.Printf(" %s | %-6s | %10.2f | %-9s | %-40s | %s\n",
			r.date.Format("2006-01-02"), r.txnType, r.amount, r.method, r.desc, r.handled)
	}
	fmt.Println()

	var totalIncome, totalExpense float64
	for _, r := range rows {
		if r.txnType == "income" {
			totalIncome += r.amount
		} else {
			totalExpense += r.amount
		}
	}
	fmt.Printf("รวมรับ: %.2f บาท | รวมจ่าย: %.2f บาท | สุทธิ: %.2f บาท\n", totalIncome, totalExpense, totalIncome-totalExpense)

	if *dryRun {
		fmt.Println("\n(--dry-run) ไม่ได้เขียนข้อมูลลง database")
		return
	}

	cfg := config.Load()
	db := database.Connect(cfg)

	var admin model.User
	if err := db.Where("username = ?", *adminEmail).First(&admin).Error; err != nil {
		log.Fatalf("ไม่เจอ admin account %q: %v", *adminEmail, err)
	}

	fmt.Printf("\nกำลัง insert %d รายการ ผูกกับ created_by_user_id=%d (%s) ...\n", len(rows), admin.UserID, admin.Username)
	inserted := 0
	for _, r := range rows {
		txn := model.Transaction{
			TxnDate:         r.date,
			Type:            model.TxnType(r.txnType),
			Amount:          r.amount,
			PaymentMethod:   model.PaymentMethod(r.method),
			Description:     r.desc,
			HandledBy:       r.handled,
			Note:            r.note,
			CreatedByUserID: admin.UserID,
		}
		if err := db.Create(&txn).Error; err != nil {
			log.Printf("line %d: insert ไม่ผ่าน: %v", r.lineNo, err)
			continue
		}
		inserted++
	}
	fmt.Printf("เสร็จแล้ว: insert สำเร็จ %d / %d รายการ\n", inserted, len(rows))
}
