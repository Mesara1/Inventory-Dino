package model

import "time"

type TxnType string

const (
	TxnIncome  TxnType = "income"
	TxnExpense TxnType = "expense"
)

type PaymentMethod string

const (
	PaymentCash     PaymentMethod = "cash"
	PaymentTransfer PaymentMethod = "transfer"
)

type Transaction struct {
	TransactionID   uint          `gorm:"primaryKey;autoIncrement" json:"transaction_id"`
	TxnDate         time.Time     `gorm:"column:txn_date;type:date;not null" json:"txn_date"`
	Type            TxnType       `gorm:"type:enum('income','expense');not null" json:"type"`
	Amount          float64       `gorm:"not null" json:"amount"`
	PaymentMethod   PaymentMethod `gorm:"column:payment_method;type:enum('cash','transfer');not null" json:"payment_method"`
	Description     string        `gorm:"not null" json:"description"`
	HandledBy       string        `gorm:"column:handled_by" json:"handled_by"`
	Note            string        `json:"note"`
	CreatedByUserID uint          `gorm:"column:created_by_user_id;not null" json:"created_by_user_id"`
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
	DeletedAt       *time.Time    `gorm:"index" json:"-"`
}
